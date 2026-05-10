const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

    if (req.method === 'OPTIONS') return res.end();

    const dbPath = './data.json';
    const readDB = () => JSON.parse(fs.readFileSync(dbPath));
    const writeDB = (data) => fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));

    // ROUTE: Get All Data
    if (req.url === '/posts' && req.method === 'GET') {
        res.writeHead(200, {'Content-Type': 'application/json'});
        return res.end(fs.readFileSync(dbPath));
    }

    // ROUTE: Sign Up & Forum Posts
    if (req.url === '/posts' && req.method === 'POST') {
        let body = '';
        req.on('data', c => body += c);
        req.on('end', () => {
            const db = readDB();
            const item = JSON.parse(body);
            
            if (item.action === 'signup') {
                db.users.push({ user: item.user, pass: item.pass });
            } else {
                db.posts.push(item); // Text posts/forum
            }
            
            writeDB(db);
            res.end(JSON.stringify({status: 'ok'}));
        });
    }

    // ROUTE: Video/Image Uploads
    if (req.url === '/upload' && req.method === 'POST') {
        const name = `file-${Date.now()}.mp4`;
        const filePath = path.join(__dirname, 'reels', name);
        const stream = fs.createWriteStream(filePath);
        req.pipe(stream);
        req.on('end', () => {
            const db = readDB();
            db.reels.push({ 
                url: `https://${req.headers.host}/reels/${name}`,
                user: req.headers['x-user'],
                caption: req.headers['x-caption'],
                timestamp: Date.now()
            });
            writeDB(db);
            res.end('ok');
        });
    }

    // SERVE MEDIA
    if (req.url.startsWith('/reels/')) {
        const p = path.join(__dirname, req.url);
        if (fs.existsSync(p)) fs.createReadStream(p).pipe(res);
    }
});

if (!fs.existsSync('./reels')) fs.mkdirSync('./reels');
server.listen(3000);
