import dgram from 'node:dgram';
import { EmotionProcessor } from '../behavior/emotion-processor.js'
import { GesturePostureProcessor } from '../behavior/gesture-posture-processor.js'
import pkg from  "osc-js";
import { WebSocketServer } from 'ws';
import { Brain } from '../behavior/brain.js';

export class KAREROServer {

    constructor(networkConfig) {

        this.KAREROBrain = new Brain();
        this.networkConfig = networkConfig;
        this.osc = new pkg()

        this.emotionDetectionSocket = dgram.createSocket('udp4');

        this.tmpOSCPayload = {
            "translatedBodies" : [
                {
                    "x": 0,
                    "y": 0,
                    "z": 0
                }
            ]
        };
        this.recognition = "";

        this.displayControlWS = null;
        this.robotControlWS = null;

        this.displayControlWSS = null;
        this.robotControlWSS = null;
    }

    startAllNetworkServices(){

        this.osc.open({ host: this.networkConfig.KinectNetwork.IpAddress, port: this.networkConfig.KinectNetwork.Port })

        this.displayControlWSS = new WebSocketServer({host: this.networkConfig.DisplayNetwork.IpAddress, port: this.networkConfig.DisplayNetwork.Port}, ()=>{
            console.log("display control server start");
        });

        this.robotControlWSS = new WebSocketServer({host: this.networkConfig.RobotNetwork.IpAddress, port: this.networkConfig.RobotNetwork.Port}, ()=>{
            console.log("robot control server start");
        });

        this.displayControlWSS.on('connection', (webSocket) =>{
            console.log("display control connection established");
            this.displayControlWS = webSocket;
            this.KAREROBrain.setBrainRobotFaceTransmissionWS(webSocket);
            console.log(webSocket.readyState);
        });

        this.robotControlWSS.on('connection', (webSocket) =>{
            console.log("robot control connection established");
            this.robotControlWS = webSocket;
            this.KAREROBrain.setBrainRobotBodyTransmissionWS(webSocket);
            console.log(webSocket.readyState);

            this.robotControlWS.on('message', (data) =>{
                
                if(data == "getPersonCoordinates"){
                    var payload = {
                        "mode" : "dataSupply",
                        "activity" : "personCoordinates",
                        "data" : {
                        "baseX" : 1.15,
                        "baseY" : 0.9,
                        "baseZ" : 0.35,
                        "baseRotation" : -90,
                        "personX" : Number(this.tmpOSCPayload.translatedBodies[0].x),
                        "personY" : Number(this.tmpOSCPayload.translatedBodies[0].y),
                        "personZ" : Number(this.tmpOSCPayload.translatedBodies[0].z)
                        } 
                    }

                this.robotControlWS.send(JSON.stringify(payload));
                }
            });
        });

        this.osc.on('/data', message => {
            //console.log(message.args); // prints the message arguments
            var data = JSON.parse(message.args)
            this.tmpOSCPayload = data
            //this.gesturePostureProcessor.digest(data);
            this.KAREROBrain.processKinectRecognition(data);
        });

        this.displayControlWSS.on('close', (webSocket) =>{
            console.log("connection disconnected");
            this.displayControlWS = null;
        });

        this.displayControlWSS.on('error', (webSocket) =>{
            console.log("connection disonnected");
            this.displayControlWS = null;
        });

        this.emotionDetectionSocket.on('error', (err) => {
            console.log(`server error:\n${err.stack}`);
            this.emotionDetectionSocket.close();
        });

        this.emotionDetectionSocket.on('message', (msg, rinfo) => {

            this.KAREROBrain.processEmotionRecognition(msg.toString());

            
            /*if(this.robotControlWS != null){
            
            if(this.recognition == "a3" || this.recognition == "arnold2" || this.recognition == "arnold"){
                var payload = {
                "mode" : "setMode",
                "activity" : "attack"
                }
                this.robotControlWS.send(JSON.stringify(payload));
                if(this.displayControlWS != null){
                    this.displayControlWS.send("Rage");
                }
            }
            else if(this.emotionalValence == "Ecstasy"){
                var payload = {
                "mode" : "setMode",
                "activity" : "dance"
                }
                this.robotControlWS.send(JSON.stringify(payload));
                if(this.displayControlWS != null){
                    this.displayControlWS.send("Ecstasy");
                
                }
                else{
                console.log("phone not connected");
                }
            }
            else if(this.emotionalValence == "Neutral"){
                var payload = {
                "mode" : "setMode",
                "activity" : "followHead"
                }
                if(this.displayControlWS != null){
            
                    this.displayControlWS.send(emotionalValence);
                
                }
                else{
                console.log("phone not connected");
                }
                this.robotControlWS.send(JSON.stringify(payload));
            }
            else{
                if(this.displayControlWS != null){
                    this.displayControlWS.send(emotionalValence);
                
                }
                else{
                console.log("phone not connected");
                }
            }
            }
            else{
            console.log("robot not connected");
            }*/
            

        //serverRobot.send(emotionalValence, 5678, "192.168.0.164");
        });

        this.emotionDetectionSocket.on('listening', () => {
        const address = this.emotionDetectionSocket.address();
        console.log(`python server listening ${address.address}:${address.port}`);
        });

        this.emotionDetectionSocket.bind(this.networkConfig.EmotionNetwork.Port);
    }
}



