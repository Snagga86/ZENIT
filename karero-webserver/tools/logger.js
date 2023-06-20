import fs from 'fs';

const logger = (filename, type, data) => {
  const logMessage = Date.now() + ";" + type + ";" + data + "\n";

  fs.appendFile("log/" + filename + ".txt", logMessage, (err) => {
    if (err) {
      console.error('Error writing to log file:', err);
    }
  });
};

export default logger;