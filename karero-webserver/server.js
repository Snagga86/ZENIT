import dgram from 'node:dgram';
import { EmotionProcessor } from './emotion-processor.js'
import pkg from  "osc-js";
import { WebSocketServer } from 'ws';

import { Mecharm } from "./mecharm.js";

var mecharm = new Mecharm();
mecharm.setCoordinates(1.15,0.35);

const emotionDetectionSocket = dgram.createSocket('udp4');
const emotionProcessor = new EmotionProcessor();
const osc = new pkg()
osc.open({ host: '192.168.0.101', port: 9123 })
//console.log(osc.status);

var rota = 0;

var tmpOSCPayload = "";


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
  var payload = {
    "mode" : "setMode",
    "activity" : "followHead"
  }
  
  //robotControlWS.send(JSON.stringify(payload));
  

  robotControlWS.on('message', (data) =>{
    console.log("robot control data:" + data);

    if(data == "getPersonCoordinates"){
      var payload = {
        "mode" : "dataSupply",
        "activity" : "personCoordinates",
        "data" : {
          "baseX" : 1.15,
          "baseY" : 0.9,
          "baseZ" : 0.35,
          "baseRotation" : -90,
          "personX" : Number(tmpOSCPayload.translatedBodies[0].x),
          "personY" : Number(tmpOSCPayload.translatedBodies[0].y),
          "personZ" : Number(tmpOSCPayload.translatedBodies[0].z)
        } 
      }

      robotControlWS.send(JSON.stringify(payload));

      
    }
    
  });
});

osc.on('/data', message => {
  //console.log(message.args); // prints the message arguments
  var data = JSON.parse(message.args)
  tmpOSCPayload = data
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
      
    }
    else{
      console.log("phone not connected");
    }

    if(robotControlWS != null){
      
      if(emotionalValence == "Ecstasy"){
        var payload = {
          "mode" : "setMode",
          "activity" : "dance"
        }
        robotControlWS.send(JSON.stringify(payload));
      }
      if(emotionalValence == "Neutral"){
        var payload = {
          "mode" : "setMode",
          "activity" : "followHead"
        }
        robotControlWS.send(JSON.stringify(payload));
      }
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

