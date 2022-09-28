import dgram from 'node:dgram';
import { EmotionProcessor } from './emotion-processor.js'

const emotionDetectionSocket = dgram.createSocket('udp4');
//const serverRobot = dgram.createSocket('udp4');
const emotionProcessor = new EmotionProcessor();

import { WebSocketServer } from 'ws';

const displayControlWSS = new WebSocketServer({host: "192.168.0.101", port: 3344}, ()=>{
  console.log("display control server start");
});

const robotControlWSS = new WebSocketServer({host: "192.168.0.101", port: 3345}, ()=>{
  console.log("robot control server start");
});

var displayControlWS = null;
var robotControlWS = null;

displayControlWSS.on('connection', (webSocket) =>{
  console.log("display control connection established");
  displayControlWS = webSocket;
  console.log(webSocket.readyState);
});

robotControlWSS.on('connection', (webSocket) =>{
  console.log("robot control connection established");
  robotControlWS = webSocket;
  console.log(webSocket.readyState);

  robotControlWS.on('message', (data) =>{
    console.log("robot control data:" + data);
    robotControlWS.send("nice data");
  });
});



displayControlWSS.on('close', (webSocket) =>{
  console.log("connection disconnected");
  displayControlWS = null;
});

displayControlWSS.on('error', (webSocket) =>{
  console.log("connection disonnected");
  displayControlWS = null;
});

emotionDetectionSocket.on('error', (err) => {
  console.log(`server error:\n${err.stack}`);
  emotionDetectionSocket.close();
});

emotionDetectionSocket.on('message', (msg, rinfo) => {

    var emotionalValence = emotionProcessor.keyValueInput(msg.toString());

    console.log("val: " + emotionalValence);
    if(displayControlWS != null){
      
      displayControlWS.send(emotionalValence);
      //console.log(displayControlWS.readyState);
      //console.log("send");
    }
    else{
      console.log("phone not connected");
    }

    if(robotControlWS != null){
      robotControlWS.send(emotionalValence);
    }
    else{
      console.log("robot not connected");
    }
    

  //serverRobot.send(emotionalValence, 5678, "192.168.0.164");
});

emotionDetectionSocket.on('listening', () => {
  const address = emotionDetectionSocket.address();
  console.log(`python server listening ${address.address}:${address.port}`);
});

emotionDetectionSocket.bind(1337);
