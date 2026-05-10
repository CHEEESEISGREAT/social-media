const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// 1. Create the Folders
const folders = [
    path.join(__dirname, 'posts'),
    path.join(__dirname, 'profiles'),
    path.join(__dirname, 'profiles/profilepictures')
];

folders.forEach(f => {
    if (!fs.existsSync(f)) fs.mkdirSync(f, { recursive: true });
});

// 2. Serve images so frontend can load them
app.use('/profilepictures', express.static(path.join(__dirname, 'profiles/profilepictures')));

// 3. GET POSTS (Fixes the "undefined" error)
app.get('/posts', (req, res) => {
    try {
        const files = fs.readdirSync(path.join(__dirname, 'posts'));
        const posts = files.map(file => {
            const data = fs.readFileSync(path.join(__dirname, 'posts', file));
            return JSON.parse(data);
        });
        // We return the array directly inside a "posts" key to match your frontend loop
        res.json({ posts: posts }); 
    } catch (err) {
        res.json({ posts: [] });
    }
});

// 4. SAVE/DELETE POSTS
app.post('/posts', (req, res) => {
    const data = req.body;

    // Handle Delete
    if (data.action === 'delete') {
        const filePath = path.join(__dirname, 'posts', `${data.postId}.json`);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        return res.json({ success: true });
    }

    // Handle PFP Storage
    let finalPfp = data.pfp || "";
    if (data.pfp && data.pfp.includes('data:image')) {
        const base64Data = data.pfp.split(',')[1];
        const filename = `${data.user.replace(/\s+/g, '_')}_pfp.png`;
        fs.writeFileSync(path.join(__dirname, 'profiles/profilepictures', filename), base64Data, 'base64');
        // This URL must match your Render URL (or use relative path)
        finalPfp = `https://${req.get('host')}/profilepictures/${filename}`;
    }

    const timestamp = Date.now().toString();
    const postObject = {
        user: data.user || "Unknown",
        text: data.text || "",
        img: data.img || null,
        pfp: finalPfp,
        bio: data.bio || "Member of Socials.",
        timestamp: timestamp,
        type: 'feed'
    };

    fs.writeFileSync(
        path.join(__dirname, 'posts', `${timestamp}.json`),
        JSON.stringify(postObject)
    );

    res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
