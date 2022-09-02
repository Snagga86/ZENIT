import dgram from 'node:dgram';
import { EmotionProcessor } from './emotion-processor.js'

const serverPython = dgram.createSocket('udp4');
const serverPhone = dgram.createSocket('udp4');
const emotionProcessor = new EmotionProcessor();

serverPython.on('error', (err) => {
  console.log(`server error:\n${err.stack}`);
  serverPython.close();
});

serverPython.on('message', (msg, rinfo) => {

    var emotionalValence = emotionProcessor.keyValueInput(msg.toString());

    console.log(emotionalValence);

  serverPhone.send(emotionalValence, 1338);

});

serverPython.on('listening', () => {
  const address = serverPython.address();
  console.log(`server listening ${address.address}:${address.port}`);
});

serverPython.bind(1337);

serverPhone.on('error', (err) => {
    console.log(`server error:\n${err.stack}`);
    serverPhone.close();
  });
  
  serverPhone.on('message', (msg, rinfo) => {
    console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
  });
  
  serverPhone.on('listening', () => {
    const address = serverPhone.address();
    console.log(`server listening ${address.address}:${address.port}`);
  });
