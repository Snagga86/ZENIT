import { State, Actions, Transition, StateWrap } from './BaseState.js';
import { Brain } from '../brain.js';
import logger from '../../tools/logger.js';
import globalStore from '../../tools/globals.js';
import readline from 'readline';



/* Robot state class defining the robot behavior within this state */
export class MotionVideoSequence extends StateWrap{
    constructor(chatProcessor, emotionProcessor, gesturePostureProcessor, speechProcessor, brainEvents){

        /* Call the super constructor and set the identification name for the state class */
        super("motionVideoSequence", emotionProcessor, gesturePostureProcessor, speechProcessor, brainEvents);

        this.emotionStates = ['thirsty','neutral','hot','contempt','joy','anger','disgust','sadness','surprise','fear','neutral'];
        this.mode = ['only_face',/*'only_body',/'face_and_body'*/];

        this.chatProcessor = chatProcessor;

        this.currentEmotion = 0;
        this.currentMode = 0;

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

        var payload = {
            "mode" : "setEmotion",
            "data" : "Idle1"
        }
        this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_FACE_ACTION, payload); 
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
            console.log(payload[0]);
            console.log(payload[0].text);
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

    seekAttention(){
        var payload = {
            "mode" : "setMode",
            "activity" : "seekAttention"
        }

        /* Send the activity change to the KARERO brain. */
        this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_BODY_ACTION, payload);

        this.timeout = setTimeout(() => {
            this.followHead();
        }, 4500);
    }

    followHead(){
        console.log("next follow head");
        clearTimeout(this.stateTimeout);
        clearTimeout(this.timeout);

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

        this.timeout = setTimeout(() => {
            this.nextEmotion();
        }, 8000);
    }

    nextEmotion(){
        console.log("next iteration...");
        console.log("Mode: " + this.mode[this.currentMode]);
        console.log("Emotion: " + this.emotionStates[this.currentEmotion]);
        clearTimeout(this.stateTimeout);
        clearTimeout(this.timeout);
        var payloadBody = {
            "mode" : "setMode",
            "activity" : this.emotionStates[this.currentEmotion]
        }
        if(this.currentMode != 0)this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_BODY_ACTION, payloadBody)

        var curEmo = this.emotionStates[this.currentEmotion];
        if(curEmo == "fear"){
            curEmo = "terror";
        }
        var payloadFace = {
            "mode" : "setEmotion",
            "data" : curEmo[0].toUpperCase() + curEmo.slice(1)
        }
        if(this.currentMode != 1)this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_FACE_ACTION, payloadFace);
        console.log(this.currentEmotion);

        if(this.emotionStates[this.currentEmotion] == 'neutral'){
            this.toTime = 3000;
        }
        if(this.emotionStates[this.currentEmotion] == 'joy'){
            this.toTime = 6000;
        }
        if(this.emotionStates[this.currentEmotion] == 'anger'){
            this.toTime = 6500;
        }
        if(this.emotionStates[this.currentEmotion] == 'disgust'){
            this.toTime = 5000;
        }
        if(this.emotionStates[this.currentEmotion] == 'sadness'){
            this.toTime = 10000;
        }
        if(this.emotionStates[this.currentEmotion] == 'surprise'){
            this.toTime = 6000;
        }
        if(this.emotionStates[this.currentEmotion] == 'fear'){
            this.toTime = 5000;
        }
        if(this.emotionStates[this.currentEmotion] == 'contempt'){
            this.toTime = 5000;
        }
        if(this.emotionStates[this.currentEmotion] == 'hot'){
            this.toTime = 15000;
        }
        if(this.emotionStates[this.currentEmotion] == 'thirsty'){
            this.toTime = 25000;
        }
        
        console.log(this.toTime);

        this.stateTimeout = setTimeout(() => {
            this.followHead();
        }, this.toTime);

        this.currentEmotion++;
        if(this.currentEmotion >= this.emotionStates.length - 1){
            this.currentMode++;
            console.log(this.currentEmotion);
            this.currentEmotion = 0;
            if(this.currentMode >= this.mode.length){
                this.currentMode = 0;
            }
        }
    }
}