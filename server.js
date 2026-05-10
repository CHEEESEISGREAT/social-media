const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// 1. Folders
const folders = [
    path.join(__dirname, 'posts'),
    path.join(__dirname, 'profiles'),
    path.join(__dirname, 'profiles/profilepictures')
];
folders.forEach(f => { if (!fs.existsSync(f)) fs.mkdirSync(f, { recursive: true }); });

app.use('/profilepictures', express.static(path.join(__dirname, 'profiles/profilepictures')));

// 2. AUTH SYSTEM (Fixes logging into accounts that don't exist)
app.post('/auth', (req, res) => {
    const { user, pass, action } = req.body;
    const userFile = path.join(__dirname, 'profiles', `${user.toLowerCase()}.json`);

    if (action === 'signup') {
        if (fs.existsSync(userFile)) return res.status(400).json({ error: "User already exists" });
        const userData = { user, pass, bio: "Member of Socials.", pfp: "" };
        fs.writeFileSync(userFile, JSON.stringify(userData));
        return res.json({ success: true, user: userData });
    } 
    
    if (action === 'login') {
        if (!fs.existsSync(userFile)) return res.status(404).json({ error: "User not found" });
        const userData = JSON.parse(fs.readFileSync(userFile));
        if (userData.pass !== pass) return res.status(401).json({ error: "Wrong password" });
        return res.json({ success: true, user: userData });
    }
});

// 3. GET POSTS
app.get('/posts', (req, res) => {
    try {
        const files = fs.readdirSync(path.join(__dirname, 'posts'));
        const posts = files.map(file => JSON.parse(fs.readFileSync(path.join(__dirname, 'posts', file))));
        res.json({ posts });
    } catch (e) { res.json({ posts: [] }); }
});

// 4. POSTING & DELETING
app.post('/posts', (req, res) => {
    const data = req.body;

    if (data.action === 'delete') {
        const filePath = path.join(__dirname, 'posts', `${data.postId}.json`);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        return res.json({ success: true });
    }

    // Fixes the "Unknown" issue by ensuring data.user is used
    const timestamp = Date.now().toString();
    const postObject = {
        user: data.user || "Guest",
        text: data.text || "",
        img: data.img || null,
        pfp: data.pfp || "", 
        bio: data.bio || "",
        timestamp: timestamp,
        type: 'feed'
    };

    fs.writeFileSync(path.join(__dirname, 'posts', `${timestamp}.json`), JSON.stringify(postObject));
    res.json({ success: true });
});

app.listen(process.env.PORT || 3000);
