const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Higher limit for Base64 images

// Data Storage (In-memory)
let database = {
    users: [
        { user: 'admin', pass: 'password' } // Default admin
    ],
    posts: []
};

// --- ROUTES ---

// 1. Get all data (Feed + Users)
app.get('/posts', (req, res) => {
    res.json(database);
});

// 2. Handle all POST actions
app.post('/posts', (req, res) => {
    const data = req.body;

    // ACTION: Signup
    if (data.action === 'signup') {
        const exists = database.users.find(u => u.user === data.user);
        if (exists) return res.status(400).json({ error: "User exists" });
        
        database.users.push({ user: data.user, pass: data.pass });
        return res.json({ success: true });
    }

    // ACTION: Delete Post
    if (data.action === 'delete') {
        const initialLength = database.posts.length;
        // Filter out the post with the matching timestamp (ID)
        database.posts = database.posts.filter(p => p.timestamp !== data.postId);
        
        if (database.posts.length < initialLength) {
            return res.json({ success: true, message: "Post deleted" });
        } else {
            return res.status(404).json({ error: "Post not found" });
        }
    }

    // ACTION: Create New Post (Default)
    const newPost = {
        user: data.user,
        text: data.text,
        img: data.img || null,
        pfp: data.pfp || "", // Stores PFP for profile lookups
        bio: data.bio || "Member of Socials.", // Stores bio for profile lookups
        timestamp: Date.now().toString(),
        type: 'feed'
    };

    database.posts.push(newPost);
    res.json({ success: true, post: newPost });
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
