import dgram from 'node:dgram';
import pkg from  "osc-js";
import { WebSocketServer } from 'ws';
import { Brain } from '../behavior/brain.js';

export class KAREROServer {

    constructor(networkConfig, robotPosition) {

        this.networkConfig = networkConfig;
        this.robotPosition = robotPosition;
        this.KAREROBrain = new Brain();
        
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

        /* Websocket Server declarations. */
        this.displayControlWSS = null;
        this.robotControlWSS = null;

        /* Websocket. */
        this.displayControlWS = null;
        this.robotControlWS = null;
    }

    /* Starts all network services for KARERO interaction. 
    Azure Kinetic Space: The data is received via OSC protocol. Receive data only.
    Emotion Recognition: The data is received by UDP stream. Receive data only.
    Robot Arm: The data is sent and received via Websocket.
    Robot Display: The data is sent via Websocket. Send data only. */
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
                        "baseX" : this.robotPosition.baseX,
                        "baseY" : this.robotPosition.baseY,
                        "baseZ" : this.robotPosition.baseZ,
                        "baseRotation" : this.robotPosition.baseRotation,
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
            console.log(this.tmpOSCPayload.translatedBodies[0]);
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
        });

        this.emotionDetectionSocket.on('listening', () => {
            const address = this.emotionDetectionSocket.address();
            console.log(`python server listening ${address.address}:${address.port}`);
        });

        this.emotionDetectionSocket.bind(this.networkConfig.EmotionNetwork.Port);
    }
}



