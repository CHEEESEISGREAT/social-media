const http = require('http');
const fs = require('fs');
const path = require('path');

// Ensure the database file exists immediately on startup
const dbPath = path.join(__dirname, 'data.json');
if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({ users: [{user: "admin", pass: "password"}], posts: [], reels: [] }, null, 2));
}

// Ensure the reels folder exists
const reelsDir = path.join(__dirname, 'reels');
if (!fs.existsSync(reelsDir)) {
    fs.mkdirSync(reelsDir);
}

const server = http.createServer((req, res) => {
    // CRITICAL: Standard Headers for ALL responses
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        return res.end();
    }

    try {
        // ROUTE: Get Data
        if (req.url === '/posts' && req.method === 'GET') {
            const data = fs.readFileSync(dbPath, 'utf8');
            res.writeHead(200, {'Content-Type': 'application/json'});
            return res.end(data);
        }

        // ROUTE: Sign Up / Forum
        if (req.url === '/posts' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
                const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
                const item = JSON.parse(body);
                
                if (item.action === 'signup') {
                    db.users.push({ user: item.user, pass: item.pass });
                } else {
                    db.posts.push({...item, timestamp: Date.now()});
                }
                
                fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({status: 'ok'}));
            });
        }

        // ROUTE: Media Upload
        else if (req.url === '/upload' && req.method === 'POST') {
            const fileName = `file-${Date.now()}.mp4`;
            const filePath = path.join(reelsDir, fileName);
            const stream = fs.createWriteStream(filePath);
            
            req.pipe(stream);
            req.on('end', () => {
                const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
                // Use req.headers.host to build the URL dynamically
                const protocol = req.headers.host.includes('localhost') ? 'http' : 'https';
                db.reels.push({ 
                    url: `${protocol}://${req.headers.host}/reels/${fileName}`,
                    user: req.headers['x-user'] || 'Unknown',
                    caption: req.headers['x-caption'] || '',
                    timestamp: Date.now()
                });
                fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
                res.writeHead(200);
                res.end('ok');
            });
        }

        // SERVE VIDEOS
        else if (req.url.startsWith('/reels/')) {
            const p = path.join(__dirname, req.url);
            if (fs.existsSync(p)) {
                fs.createReadStream(p).pipe(res);
            } else {
                res.writeHead(404);
                res.end();
            }
        }
        
        else {
            res.writeHead(404);
            res.end("Not Found");
        }

    } catch (err) {
        console.error("SERVER ERROR:", err);
        res.writeHead(500);
        res.end("Internal Server Error: " + err.message);
    }
});

// Use the PORT Render gives you, or 3000 for local
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server live on port ${PORT}`));
