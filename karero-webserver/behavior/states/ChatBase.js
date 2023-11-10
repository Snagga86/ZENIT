import { State, Actions, Transition, StateWrap } from './BaseState.js';
import { Brain } from '../brain.js';
import logger from '../../tools/logger.js';
import globalStore from '../../tools/globals.js';
import readline from 'readline';



/* Robot state class defining the robot behavior within this state */
export class ChatBase extends StateWrap{
    constructor(chatProcessor, emotionProcessor, gesturePostureProcessor, speechProcessor, brainEvents){

        /* Call the super constructor and set the identification name for the state class */
        super("chatBase", emotionProcessor, gesturePostureProcessor, speechProcessor, brainEvents);

        this.chatProcessor = chatProcessor;

        /* Bind concrete implementation functions for enter and exit of the current state. */
        this.state.actions.onEnter = this.enterFunction.bind(this);
        this.state.actions.onExit = this.exitFunction.bind(this);

        /* Add transitions to the other states to build the graph.
        The transition is called after the state was left but before the new state is entered. */
        this.state.transitions.push(new Transition("welcoming", "welcoming", () => {
            console.log('transition action for "callToAction" in "welcoming" state')
        }));

        this.timeout;
        this.toTime;

        this.stateTimeout;
    }

    /* Enter function is executed whenever the state is activated. */
    enterFunction(){

        //this.followHead();

        this.speechProcessor.speechEvent.on('FinalResult', (result) => {
            console.log("tts result:" + result);
            if(result.length > 1){
                this.chatProcessor.sendMessage(result);
            }
            
        });

        this.chatProcessor.chatEvents.on(Brain.ROBOT_BRAIN_EVENTS.RASA_ANSWER, (payload) => {
            console.log("res:");
            console.log(payload);
            
            if(payload.length > 1){
                var result = JSON.parse(payload[1].image.toString().replace(/'/g, '"'));
                //var customAction = payload[1].image.split(',');
                console.log(result.action);
                console.log(result.face);
                console.log(result.body);
            }
            
            var payloadTTS = {
                "mode" : "tts",
                "text" : payload[0].text
            }
            this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.TTS_ACTION, payloadTTS);
        });
    }

    /* Exit function is executed whenever the state is left. */
    exitFunction(){

        /* Turn off event listener if state is exited. */
        this.gesturePostureProcessor.gesturePostureEvent.removeAllListeners('ClosestBodyDistance', this.closestBodyRecognition);
        clearTimeout(this.timeout);
        //this.emotionProcessor.emotionEvent.removeAllListeners('EmotionDetection', this.emotionRecognition);
    }

    /* Interpretion function of received data coming from Azure Kinectic Space. */
    closestBodyRecognition(distance){
        /* If the arnold gesture was detected the robot changes its state to attack. */
        if(distance <= globalStore.welcomeDistance){

            /* Emit the attack state change event. */
            this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_STATE_CHANGE, "welcoming");
        }
    }

    nvcAction(action){

        var payloadFace = {
            "mode" : "setEmotion",
            "data" : action[0]
        }
        this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_FACE_ACTION, payloadFace);
        
        if(action.length > 1){
            var payloadBody = {
                "mode" : "setMode",
                "activity" : action[1]
            }
            this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_BODY_ACTION, payloadBody)
        }  
    }

    followHead(){
        var payload = {
            "mode" : "setMode",
            "activity" : "followHead"
        }

        /* Send the activity change to the KARERO brain. */
        this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_BODY_ACTION, payload)

        var payloadFace = {
            "mode" : "setEmotion",
            "data" : "Neutral"
        }
        this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_FACE_ACTION, payloadFace);
    }

    getRoboAnimationTime(emotion){
        var timeOutRoboAnimation = 0;
        if(emotion == 'neutral'){
            this.timeOutRoboAnimation = 3000;
        }
        if(emotion == 'joy'){
            this.timeOutRoboAnimation = 6000;
        }
        if(emotion == 'anger'){
            this.timeOutRoboAnimation = 6500;
        }
        if(emotion == 'disgust'){
            this.timeOutRoboAnimation = 5000;
        }
        if(emotion == 'sadness'){
            this.timeOutRoboAnimation = 10000;
        }
        if(emotion== 'surprise'){
            this.timeOutRoboAnimation = 6000;
        }
        if(emotion == 'fear'){
            this.timeOutRoboAnimation = 5000;
        }
        if(emotion == 'contempt'){
            this.timeOutRoboAnimation = 5000;
        }
        if(emotion == 'hot'){
            this.timeOutRoboAnimation = 15000;
        }
        if(emotion == 'thirsty'){
            this.timeOutRoboAnimation = 25000;
        }
        else{
            this.timeOutRoboAnimation = 2000;
        }
        return timeOutRoboAnimation;
    }
}