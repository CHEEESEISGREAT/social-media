const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Set up the 3 folders you wanted
const folders = [
    path.join(__dirname, 'posts'),
    path.join(__dirname, 'profiles'),
    path.join(__dirname, 'profiles/profilepictures')
];

folders.forEach(folder => {
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
        console.log(`Created: ${folder}`);
    }
});

// Serve the profile pictures so the frontend can see them
app.use('/profilepictures', express.static(path.join(__dirname, 'profiles/profilepictures')));

// --- ROUTES ---

// 1. Get all posts from the /posts folder
app.get('/posts', (req, res) => {
    const postFiles = fs.readdirSync(path.join(__dirname, 'posts'));
    const allPosts = postFiles.map(file => {
        const content = fs.readFileSync(path.join(__dirname, 'posts', file));
        return JSON.parse(content);
    });
    res.json({ posts: allPosts, users: [] }); // Simplified for your frontend
});

// 2. Create or Delete Posts
app.post('/posts', (req, res) => {
    const data = req.body;
    const timestamp = data.postId || Date.now().toString();

    // ACTION: DELETE
    if (data.action === 'delete') {
        const filePath = path.join(__dirname, 'posts', `${data.postId}.json`);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            return res.json({ success: true });
        }
        return res.status(404).json({ error: "File not found" });
    }

    // ACTION: SAVE PROFILE PICTURE
    let pfpUrl = data.pfp;
    if (data.pfp && data.pfp.startsWith('data:image')) {
        const base64Data = data.pfp.replace(/^data:image\/\w+;base64,/, "");
        const filename = `${data.user}_pfp.png`;
        fs.writeFileSync(path.join(__dirname, 'profiles/profilepictures', filename), base64Data, 'base64');
        pfpUrl = `/profilepictures/${filename}`; // Public URL
    }

    // ACTION: SAVE POST
    const postData = {
        user: data.user,
        text: data.text,
        img: data.img || null,
        pfp: pfpUrl || "",
        bio: data.bio || "Member of Socials.",
        timestamp: timestamp,
        type: 'feed'
    };

    fs.writeFileSync(
        path.join(__dirname, 'posts', `${timestamp}.json`),
        JSON.stringify(postData, null, 2)
    );

    res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server live on port ${PORT}`));
