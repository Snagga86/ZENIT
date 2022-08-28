import dgram from 'node:dgram';

const serverPython = dgram.createSocket('udp4');
const serverPhone = dgram.createSocket('udp4');

serverPython.on('error', (err) => {
  console.log(`server error:\n${err.stack}`);
  serverPython.close();
});

serverPython.on('message', (msg, rinfo) => {
  //console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
    console.log(msg.toString());
  
  /*var sendVal = msg.toString('ascii').split(',')[1].trim();
  var sendVal2 = "sAnger";

  console.log("len:" + sendVal.length);

  console.log("SendVal:" + sendVal);
  console.log("len:" + sendVal.length);
  const buf6 = Buffer.from(sendVal);
  console.log(buf6);
  console.log("SendVal2:" + sendVal2);
  console.log("len2:" + sendVal2.length);
  const buf7 = Buffer.from(sendVal2);
  console.log(buf7); */
  serverPhone.send(msg.toString(), 1338);

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
  
  //serverPhone.bind(1338);