import dgram from 'node:dgram';
import pkg from  "osc-js";
import http from "http";
import WebSocket from "ws";
import { Brain } from '../behavior/brain.js';

interface OSCPayload {
    translatedBodies: { x: number; y: number; z: number }[];
}

interface SoundFilePayload {
    name: string;      // Path to the generated sound file
    duration: number;  // Duration of the sound file in seconds
    partial: string; // Identifier for the partial file number
}

/**
 * ZENITServer Class
 * 
 * The `ZENITServer` class is responsible for managing various network services required for the ZENIT robotic system.
 * It facilitates communication between different hardware components, software modules, and external systems such as
 * Azure Kinect, emotion recognition, speech transcription, and robotic control.
 * 
 * Key Features:
 * - Manages UDP sockets for Kinect and emotion detection data streams.
 * - Establishes WebSocket connections for speech synthesis, robotic control, and display communication.
 * - Processes incoming data and relays it to the appropriate components of the ZENIT Brain.
 * 
 * Dependencies:
 * - `dgram` for UDP socket communication.
 * - `osc-js` for OSC protocol support.
 * - `ws` for WebSocket communication.
 * - `Brain` for processing and business logic integration.
 */
export class ZENITServer {

    networkConfig: any; // Replace with the actual type if available
    robotPosition: any; // Replace with a proper type
    soundPitch: number;

    ZENITBrain: Brain;

    tmpOSCPayload: { translatedBodies: { x: number, y: number, z: number }[] };

    talkingStart: number;
    talkingEnd: number;

    displayControlWSS: WebSocket.Server | null;
    robotControlWSS: WebSocket.Server | null;
    textToSpeechWSS: WebSocket.Server | null;
    speechTranscriptionControlWSS: WebSocket.Server | null;

    displayControlWS: any | null;
    robotControlWS: any | null;
    textToSpeechWS: any | null;
    speechTranscriptionControlWS: any | null;

    osc: any; // `osc-js` might not have proper type declarations
    phoneCamDetectionSocket: dgram.Socket;
    speechTranscriptionStreamSocket: dgram.Socket;

    constructor(config: {
        networkConfig: any; // Replace with a proper type
        robotPosition: any; // Replace with a proper type
        soundPitch: number;
    }, configPath: string) {
        this.networkConfig = config.networkConfig;
        this.robotPosition = config.robotPosition;
        this.soundPitch = config.soundPitch;

        this.ZENITBrain = new Brain(configPath);

        this.tmpOSCPayload = {
            translatedBodies: [{ x: 0, y: 0, z: 0 }],
        };

        this.talkingStart = 0;
        this.talkingEnd = 0;

        this.displayControlWSS = null;
        this.robotControlWSS = null;
        this.textToSpeechWSS = null;
        this.speechTranscriptionControlWSS = null;

        this.displayControlWS = null;
        this.robotControlWS = null;
        this.textToSpeechWS = null;
        this.speechTranscriptionControlWS = null;

        this.osc = new pkg();
        this.phoneCamDetectionSocket = dgram.createSocket('udp4');
        this.speechTranscriptionStreamSocket = dgram.createSocket('udp4');
    }

    /**
    * Sets up Azure Kinect services.
    */
    private setupAzureKinectService(): void {
        /* Open the OSC/UDP data receive connection to Azure Kinetic Space. */
        this.osc.open({ host: this.networkConfig.KinectNetwork.IpAddress, port: this.networkConfig.KinectNetwork.Port });

        /* On incoming OSC data from Azure Kinetic Space this data is processed for possible usage
        in the ZENIT Brain/business logic. */
        this.osc.on('/data', (message: any) => {
            const data: OSCPayload = JSON.parse(message.args);
            this.tmpOSCPayload = data;
            this.ZENITBrain.processKinectRecognition(data);
        });
    }

    /**
    * Sets up Phone Camera services.
    */
    private setupPhoneCameraService(): void {
        /* Bind the UDP socket to receive recognized basic emotions from the emotion detection
        network. */
        this.phoneCamDetectionSocket.bind(this.networkConfig.EmotionNetwork.Port);

        /* Incoming data from the emotion detection network is processed in the ZENIT brain. */
        this.phoneCamDetectionSocket.on('message', (msg, rinfo) => {
            this.ZENITBrain.processPhoneCamRecognition(msg.toString());
        });

        /* Emotion detection error handling. */
        this.phoneCamDetectionSocket.on('error', (err) => {
            console.log(`server error:\n${err.stack}`);
            this.phoneCamDetectionSocket.close();
        });

        /* ToDo: Handling */
        this.phoneCamDetectionSocket.on('listening', () => {
            const address = this.phoneCamDetectionSocket.address();
            console.log(`python server listening ${address.address}:${address.port}`);
        });
    }

    /**
    * Sets up microphone and speech transcription service.
    */
    private setupMicrophoneService(): void {
        /* Bind the UDP socket to receive recognized basic emotions from the TTS detection
        network. */
        this.speechTranscriptionStreamSocket.bind(this.networkConfig.SpeechNetwork.Port);

        /* Incoming data from the TTS detection network is processed in the ZENIT brain. */
        this.speechTranscriptionStreamSocket.on('message', (msg, rinfo) => {
            this.ZENITBrain.processSpeechRecognition(msg.toString());
        });

        /* TTS detection error handling. */
        this.speechTranscriptionStreamSocket.on('error', (err) => {
            console.log(`server error:\n${err.stack}`);
            this.speechTranscriptionStreamSocket.close();
        });

        /* ToDo: Handling */
        this.speechTranscriptionStreamSocket.on('listening', () => {
            const address = this.speechTranscriptionStreamSocket.address();
            console.log(`python server listening ${address.address}:${address.port}`);
        });

        /* Bind the websocket to stop STT translation while the agent is
        talking to prevent sound feedback loops. */
        this.speechTranscriptionControlWSS = new WebSocket.Server({host: this.networkConfig.STTNetwork.IpAddress, port: this.networkConfig.STTNetwork.Port}, ()=>{
            console.log("stt control server start");
        });

        /* On incoming connection of the ZENIT STT in ZENIT Brain. */
        this.speechTranscriptionControlWSS.on('connection', (webSocket : any) =>{
            console.log("Speech-To-Text control connection established");
            this.speechTranscriptionControlWS = webSocket;
            this.ZENITBrain.setSpeechTranscriptonControlWS(webSocket);
        });

        /* Handling for STT connection close. */
        this.speechTranscriptionControlWSS.on('close', (webSocket : any) =>{
            console.log("connection disconnected");
            //this.textToSpeechWS = null;
        });

        /* Handling for STT connection error. */
        this.speechTranscriptionControlWSS.on('error', (webSocket : any) =>{
            console.log("connection disonnected");
            //this.textToSpeechWS = null;
        });
    }

    /**
    * Sets up speech synthesis service.
    */
    private setupSpeechSynthesisService(): void {
        /* Start the server to communicate with ZENIT TTS application. */
        this.textToSpeechWSS = new WebSocket.Server({host: this.networkConfig.TTSNetwork.IpAddress, port: this.networkConfig.TTSNetwork.Port}, ()=>{
            console.log("tts control server start");
        });

        /* On incoming connection of the ZENIT TTS in ZENIT Brain. */
        this.textToSpeechWSS.on('connection', (webSocket : any) =>{
            console.log("Text-To-Speech control connection established");
            this.textToSpeechWS = webSocket;
            this.ZENITBrain.setSpeechSynthesisWS(webSocket);

            this.textToSpeechWS.on('message', (data : any) =>{
                var soundInformation: SoundFilePayload = JSON.parse(data.toString('utf8')) as SoundFilePayload;
                this.ZENITBrain?.speechProcessor?.soundCreated(soundInformation.name, soundInformation.duration);

                var facePayload = {
                    "mode" : "setSound",
                    "data" : "speak",
                    "extra" : soundInformation.name,
                    "partial" : soundInformation.partial
                }
                console.log(facePayload);
                try{
                    console.log("Sending Text to speak to display device...")
                    this.displayControlWS.send(JSON.stringify(facePayload));
                }
                catch{
                    console.log("Display device not connected...")
                }
            });
        });

        /* Handling for TTS connection close. */
        this.textToSpeechWSS.on('close', (webSocket : any) =>{
            console.log("connection disconnected");
            this.textToSpeechWS = null;
        });

        /* Handling for TTS connection error. */
        this.textToSpeechWSS.on('error', (webSocket : any) =>{
            console.log("connection disonnected");
            this.textToSpeechWS = null;
        });
    }

    /**
    * Sets up service to controll the Unity app running on the mobile phone.
    */
    private setupPhoneAppControlService(): void {
        /* Start the server to communicate with ZENIT Face application. */
        this.displayControlWSS = new WebSocket.Server({host: this.networkConfig.DisplayNetwork.IpAddress, port: this.networkConfig.DisplayNetwork.Port}, ()=>{
            console.log("display control server start");
        });

        /* On incoming connection of the ZENIT Face/Display, e.g. table or cell phone set
        the connection web socket in ZENIT Brain. */
        this.displayControlWSS.on('connection', (webSocket : any) =>{
            console.log("display control connection established");
            this.displayControlWS = webSocket;
            this.ZENITBrain.setBrainRobotFaceTransmissionWS(webSocket);

            this.displayControlWS.on('message', (data : any) =>{
                this.ZENITBrain.processBrainRobotFaceInput(data.toString('utf8'));
            });
        });

        /* Handling for display control connection close. */
        this.displayControlWSS.on('close', (webSocket : any) =>{
            console.log("connection disconnected");
            this.displayControlWS = null;
        });

        /* Handling for display control connection error. */
        this.displayControlWSS.on('error', (webSocket : any) =>{
            console.log("connection disonnected");
            this.displayControlWS = null;
        });
    }

    /**
    * Sets up control service for the robotic arm.
    */
    private setupRobotControlService(): void {
        /* Start the server to communicate with ZENIT Body application. */
        this.robotControlWSS = new WebSocket.Server({host: this.networkConfig.RobotNetwork.IpAddress, port: this.networkConfig.RobotNetwork.Port}, ()=>{
            console.log("robot control server start");
        });

        /* On incoming connection of the ZENIT body/MechArm set the connection web socket
        in ZENIT Body. */
        this.robotControlWSS.on('connection', (webSocket : any) =>{
            console.log("robot control connection established");
            this.robotControlWS = webSocket;
            this.ZENITBrain.setBrainRobotBodyTransmissionWS(webSocket);

            /* When ZENIT Body is in head follow mode it requests the position data of the first
            person tracked by the azure kinect array. Kinect data is the replied to the robot body. */
            this.robotControlWS.on('message', (data : any) =>{
                //console.log("on message...")     
                if(data == "getPersonViewPortPercentages"){
                    var payload = {
                        "mode" : "dataSupply",
                        "activity" : "personViewPortPercentages",
                        "data" : {
                            "face" : this.ZENITBrain.phoneCamProcessor.lastPhoneCamRecognition.face,
                            "percentX" : this.ZENITBrain.phoneCamProcessor.lastPhoneCamRecognition.percent_x,
                            "percentY" : this.ZENITBrain.phoneCamProcessor.lastPhoneCamRecognition.percent_y
                        } 
                    }
                    //console.log("send..." + JSON.stringify(payload))
                    this.robotControlWS.send(JSON.stringify(payload));
                }
                else if(data == "getPersonCoordinates"){
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

                    if(closestBody == null){
                        closestBody = {
                            x :0,
                            y :0,
                            z: 0
                        }
                    }

                    var payload_P = {
                        "mode" : "dataSupply",
                        "activity" : "personCoordinates",
                        "data" : {
                            "baseX" : this.robotPosition.baseX,
                            "baseY" : this.robotPosition.baseY,
                            "baseZ" : this.robotPosition.baseZ,
                            "baseRotation" : this.robotPosition.baseRotation,
                            "personX" : Number(closestBody?.x),
                            "personY" : Number(closestBody?.y),
                            "personZ" : Number(closestBody?.z)
                        } 
                    }

                this.robotControlWS.send(JSON.stringify(payload_P));
                }
            });
        });
    }

    /**
    * Sets up all network services required to run ZENIT.
    */
    public startAllNetworkServices(){
        this.setupAzureKinectService();
        this.setupMicrophoneService();
        this.setupPhoneAppControlService();
        this.setupPhoneCameraService();
        this.setupSpeechSynthesisService();
        this.setupRobotControlService();
    }
}