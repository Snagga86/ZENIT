const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);

  if (parsedUrl.pathname === '/getAudio') {
    const filename = "generatedSoundFiles/" + parsedUrl.query.filename;
    const audioFilePath = path.join(__dirname, filename);
    console.log(audioFilePath);
    fs.access(audioFilePath, fs.constants.F_OK, (err) => {
      if (err) {
        res.writeHead(404);
        res.end('File not found');
      } else {
        const stat = fs.statSync(audioFilePath);

        res.writeHead(200, {
          'Content-Type': 'audio/wav',
          'Content-Length': stat.size,
        });

        const audioStream = fs.createReadStream(audioFilePath);
        audioStream.pipe(res);
      }
    });
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

const port = 1339; // Change to your desired port
server.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});