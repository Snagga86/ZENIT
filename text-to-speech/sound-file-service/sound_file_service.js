const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Set the port for the server to listen on
const port = 1340; // Change this to your desired port

// Create an HTTP server to handle requests
const server = http.createServer((req, res) => {
  // Parse the incoming request URL
  const parsedUrl = url.parse(req.url, true);

  // Handle requests to the '/getAudio' endpoint
  if (parsedUrl.pathname === '/getAudio') {
    // Construct the file path for the requested audio file
    const filename = "../generatedSoundFiles/" + parsedUrl.query.filename;
    const audioFilePath = path.join(__dirname, filename);

    console.log(`Requested audio file path: ${audioFilePath}`);

    // Check if the requested file exists
    fs.access(audioFilePath, fs.constants.F_OK, (err) => {
      if (err) {
        // Respond with 404 if the file is not found
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('File not found');
      } else {
        // Get file statistics for the requested audio file
        const stat = fs.statSync(audioFilePath);

        // Set appropriate headers for serving the audio file
        res.writeHead(200, {
          'Content-Type': 'audio/wav',
          'Content-Length': stat.size,
        });

        // Create a readable stream for the audio file and pipe it to the response
        const audioStream = fs.createReadStream(audioFilePath);
        audioStream.pipe(res);
      }
    });
  } else {
    // Respond with 404 for all other routes
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

// Start the server and log the port number
server.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
