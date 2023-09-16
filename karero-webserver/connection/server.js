import dgram from 'node:dgram';
import pkg from  "osc-js";
import { WebSocketServer } from 'ws';
import { Brain } from '../behavior/brain.js';

export class KAREROServer {

    constructor(networkConfig, robotPosition) {

        /* Store network configuration and stationary robot position. */
        this.networkConfig = networkConfig;
        this.robotPosition = robotPosition;

        /* Initialize KARERO brain/business logic. */
        this.KAREROBrain = new Brain();
 
        /* Initial definition of the tracked person position to avoid NULL errors 
        if no data is received. */
        this.tmpOSCPayload = {
            "translatedBodies" : [
                {
                    "x": 0,
                    "y": 0,
                    "z": 0
                }
            ]
        };

        /* Websocket Server declarations. */
        this.displayControlWSS = null;
        this.robotControlWSS = null;
        this.textToSpeechWSS = null;

        /* Websockets. */
        this.displayControlWS = null;
        this.robotControlWS = null;
        this.textToSpeechWS = null;

        /* UDP sockets. */
        this.osc = new pkg()
        this.emotionDetectionSocket = dgram.createSocket('udp4');
        this.speechDetectionSocket = dgram.createSocket('udp4');
    }

    /* Starts all network services for KARERO interaction. 
    Azure Kinetic Space: The data is received via OSC protocol. Receive data only.
    Emotion Recognition: The data is received by UDP stream. Receive data only.
    Robot Arm: The data is sent and received via Websocket.
    Robot Display: The data is sent via Websocket. Send data only. */
    startAllNetworkServices(){

        /* -------- Azure Kinetic Space -------- */
        /* Open the OSC/UDP data receive connection to Azure Kinetic Space. */
        this.osc.open({ host: this.networkConfig.KinectNetwork.IpAddress, port: this.networkConfig.KinectNetwork.Port })

        /* On incoming OSC data from Azure Kinetic Space this data is processed for possible usage
        in the KARERO Brain/business logic. */
        this.osc.on('/data', message => {

            var data = JSON.parse(message.args)
            this.tmpOSCPayload = data
            this.KAREROBrain.processKinectRecognition(data);
        });

        /* -------- Emotion Recognition -------- */
        /* Bind the UDP socket to receive recognized basic emotions from the emotion detection
        network. */
        this.emotionDetectionSocket.bind(this.networkConfig.EmotionNetwork.Port);

        /* Incoming data from the emotion detection network is processed in the KARERO brain. */
        this.emotionDetectionSocket.on('message', (msg, rinfo) => {
            this.KAREROBrain.processEmotionRecognition(msg.toString());
        });

        /* Emotion detection error handling. */
        this.emotionDetectionSocket.on('error', (err) => {
            console.log(`server error:\n${err.stack}`);
            this.emotionDetectionSocket.close();
        });

        /* ToDo: Handling */
        this.emotionDetectionSocket.on('listening', () => {
            const address = this.emotionDetectionSocket.address();
            console.log(`python server listening ${address.address}:${address.port}`);
        });

        /* -------- Speech Recognition -------- */
        /* Bind the UDP socket to receive recognized basic emotions from the TTS detection
        network. */
        this.speechDetectionSocket.bind(this.networkConfig.SpeechNetwork.Port);

        /* Incoming data from the TTS detection network is processed in the KARERO brain. */
        this.speechDetectionSocket.on('message', (msg, rinfo) => {
            this.KAREROBrain.processSpeechRecognition(msg.toString());
        });

        /* TTS detection error handling. */
        this.speechDetectionSocket.on('error', (err) => {
            console.log(`server error:\n${err.stack}`);
            this.speechDetectionSocket.close();
        });

        /* ToDo: Handling */
        this.speechDetectionSocket.on('listening', () => {
            const address = this.speechDetectionSocket.address();
            console.log(`python server listening ${address.address}:${address.port}`);
        });

        /* -------- Display/Face Communication -------- */
        /* Start the server to communicate with KARERO Face application. */
        this.displayControlWSS = new WebSocketServer({host: this.networkConfig.DisplayNetwork.IpAddress, port: this.networkConfig.DisplayNetwork.Port}, ()=>{
            console.log("display control server start");
        });

        /* On incoming connection of the KARERO Face/Display, e.g. table or cell phone set
        the connection web socket in KARERO Brain. */
        this.displayControlWSS.on('connection', (webSocket) =>{
            console.log("display control connection established");
            this.displayControlWS = webSocket;
            this.KAREROBrain.setBrainRobotFaceTransmissionWS(webSocket);
        });

        /* Handling for display control connection close. */
        this.displayControlWSS.on('close', (webSocket) =>{
            console.log("connection disconnected");
            this.displayControlWS = null;
        });

        /* Handling for display control connection error. */
        this.displayControlWSS.on('error', (webSocket) =>{
            console.log("connection disonnected");
            this.displayControlWS = null;
        });

        /* -------- TTS Communication -------- */
        /* Start the server to communicate with KARERO TTS application. */
        this.textToSpeechWSS = new WebSocketServer({host: this.networkConfig.TTSNetwork.IpAddress, port: this.networkConfig.TTSNetwork.Port}, ()=>{
            console.log("tts control server start");
        });

        /* On incoming connection of the KARERO TTS in KARERO Brain. */
        this.textToSpeechWSS.on('connection', (webSocket) =>{
            console.log("Text-To-Speech control connection established");
            this.textToSpeechWS = webSocket;
            this.KAREROBrain.setTTSTransmissionWS(webSocket);

            this.textToSpeechWS.on('message', (data) =>{
                console.log(data.toString('utf8'))
                var text = data.toString('utf8').split(';')[0];
                var textDuration = data.toString('utf8').split(';')[1];
                this.KAREROBrain.agentTalking(textDuration);
                var facePayload = {
                    "mode" : "setSound",
                    "data" : "speak",
                    "extra" : text
                }

                try{
                    console.log("Sending Text to speak to display device...")
                    this.displayControlWS.send(JSON.stringify(facePayload));
                }
                catch{
                    console.log("Display device not connected...")
                }
            });
        });

        /* Handling for display control connection close. */
        this.textToSpeechWSS.on('close', (webSocket) =>{
            console.log("connection disconnected");
            this.textToSpeechWS = null;
        });

        /* Handling for display control connection error. */
        this.textToSpeechWSS.on('error', (webSocket) =>{
            console.log("connection disonnected");
            this.textToSpeechWS = null;
        });

        /* -------- MechArm Robot Communication -------- */
        /* Start the server to communicate with KARERO Body application. */
        this.robotControlWSS = new WebSocketServer({host: this.networkConfig.RobotNetwork.IpAddress, port: this.networkConfig.RobotNetwork.Port}, ()=>{
            console.log("robot control server start");
        });

        /* On incoming connection of the KARERO body/MechArm set the connection web socket
        in KARERO Body. */
        this.robotControlWSS.on('connection', (webSocket) =>{
            console.log("robot control connection established");
            this.robotControlWS = webSocket;
            this.KAREROBrain.setBrainRobotBodyTransmissionWS(webSocket);

            /* When KARERO Body is in head follow mode it requests the position data of the first
            person tracked by the azure kinect array. Kinect data is the replied to the robot body. */
            this.robotControlWS.on('message', (data) =>{              
                if(data == "getPersonCoordinates"){
                    /* Only target closest body */
                    var closestBody = null;
                    var closestDistance = 100000;
                    var distance = 0;
                    this.tmpOSCPayload.translatedBodies.forEach(body => {
                        var xDistance = this.robotPosition.baseX - body.x;
                        var yDistance = this.robotPosition.baseY - body.y;
                        var zDistance = this.robotPosition.baseZ - body.z;

                        distance = Math.sqrt(
                            Math.pow(xDistance, 2) +
                            Math.pow(yDistance, 2) +
                            Math.pow(zDistance, 2)
                        );
                        
                        if(distance < closestDistance){
                            closestBody = body;
                            closestDistance = distance;
                        }
                    });
                    var payload = {
                        "mode" : "dataSupply",
                        "activity" : "personCoordinates",
                        "data" : {
                            "baseX" : this.robotPosition.baseX,
                            "baseY" : this.robotPosition.baseY,
                            "baseZ" : this.robotPosition.baseZ,
                            "baseRotation" : this.robotPosition.baseRotation,
                            "personX" : Number(closestBody.x),
                            "personY" : Number(closestBody.y),
                            "personZ" : Number(closestBody.z)
                        } 
                    }

                this.robotControlWS.send(JSON.stringify(payload));
                }
            });
        });

    }
}



