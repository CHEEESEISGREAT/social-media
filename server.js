const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    // Enable CORS so your friend's HTML file can talk to your server
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

    if (req.method === 'OPTIONS') { res.end(); return; }

    // ROUTE: Get Forum Posts
    if (req.url === '/posts' && req.method === 'GET') {
        const data = fs.readFileSync('./data.json');
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(data);
    }

    // ROUTE: Save New Forum Post
    else if (req.url === '/posts' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            const db = JSON.parse(fs.readFileSync('./data.json'));
            db.posts.push(JSON.parse(body));
            fs.writeFileSync('./data.json', JSON.stringify(db));
            res.end('Posted!');
        });
    }

    // ROUTE: Upload a Reel
    else if (req.url === '/upload' && req.method === 'POST') {
        const fileName = `reel-${Date.now()}.mp4`;
        const fileStream = fs.createWriteStream(path.join(__dirname, 'reels', fileName));
        req.pipe(fileStream);
        req.on('end', () => {
            const db = JSON.parse(fs.readFileSync('./data.json'));
            db.reels.push({ url: `http://localhost:3000/reels/${fileName}` });
            fs.writeFileSync('./data.json', JSON.stringify(db));
            res.end('Video Uploaded!');
        });
    }

    // ROUTE: Serve Videos
    else if (req.url.startsWith('/reels/')) {
        const filePath = path.join(__dirname, req.url);
        if (fs.existsSync(filePath)) {
            const stat = fs.statSync(filePath);
            res.writeHead(200, { 'Content-Length': stat.size, 'Content-Type': 'video/mp4' });
            fs.createReadStream(filePath).pipe(res);
        }
    }
});

server.listen(3000, () => console.log('Server running at http://localhost:3000'));