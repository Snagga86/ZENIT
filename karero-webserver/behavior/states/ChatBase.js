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

        this.nextNonverbalSignals = null;
        this.lastRASAPayload = null;

        /* Bind concrete implementation functions for enter and exit of the current state. */
        this.state.actions.onEnter = this.enterFunction.bind(this);
        this.state.actions.onExit = this.exitFunction.bind(this);

        /* Add transitions to the other states to build the graph.
        The transition is called after the state was left but before the new state is entered. */
        this.state.transitions.push(new Transition("exerciseEntry", "exerciseEntry", () => {
            console.log('transition action for "ChatBase" in "exerciseEntry" state')
        }));
        this.state.transitions.push(new Transition("callToAction", "callToAction", () => {
            console.log('transition action for "ChatBase" in "callToAction" state')
        }));
        this.state.transitions.push(new Transition("emotionCascade", "emotionCascade", () => {
            console.log('transition action for "ChatBase" in "emotionCascade" state')
        }));

        /* Temporary transitions to animation demos and speech. */
        this.state.transitions.push(new Transition("angerShow", "angerShow", () => {
            console.log('transition action for "ChatBase" in "angerShow" state')
        }));
        this.state.transitions.push(new Transition("sadnessShow", "sadnessShow", () => {
            console.log('transition action for "ChatBase" in "sadnessShow" state')
        }));
        this.state.transitions.push(new Transition("contemptShow", "contemptShow", () => {
            console.log('transition action for "ChatBase" in "contemptShow" state')
        }));
        this.state.transitions.push(new Transition("danceShow", "danceShow", () => {
            console.log('transition action for "ChatBase" in "danceShow" state')
        }));
        this.state.transitions.push(new Transition("disgustShow", "disgustShow", () => {
            console.log('transition action for "ChatBase" in "disgustShow" state')
        }));
        

        this.chatDuration = 0;
    }

    /* Enter function is executed whenever the state is activated. */
    enterFunction(){

        this.followHead();
        this.gesturePostureProcessor.gesturePostureEvent.on('ClosestBodyDistance', this.closestBodyRecognition.bind(this));
        this.speechProcessor.speechEvent.on('FinalResult', this.finalResultHandler.bind(this));
        this.chatProcessor.chatEvents.on(Brain.ROBOT_BRAIN_EVENTS.RASA_ANSWER, this.RASAAnswerHandler.bind(this));
        this.brainEvents.on(Brain.ROBOT_BRAIN_EVENTS.NEW_CHAT_DURATION, this.newChatDurationCalculatedHandler.bind(this));

    }

    /* Exit function is executed whenever the state is left. */
    exitFunction(){

        /* Turn off event listener if state is exited. */
        this.gesturePostureProcessor.gesturePostureEvent.removeAllListeners('ClosestBodyDistance', this.closestBodyRecognition);
        this.speechProcessor.speechEvent.removeAllListeners('FinalResult', this.finalResultHandler);
        this.chatProcessor.chatEvents.removeAllListeners(Brain.ROBOT_BRAIN_EVENTS.RASA_ANSWER, this.RASAAnswerHandler);
        this.brainEvents.removeAllListeners(Brain.ROBOT_BRAIN_EVENTS.NEW_CHAT_DURATION, this.newChatDurationCalculatedHandler);
    }

    finalResultHandler(result){
        console.log("tts result:" + result);
        if(result.length > 1){
            this.chatProcessor.sendMessage(result);
        }
    }

    newChatDurationCalculatedHandler(duration){
        
        if(this.lastRASAPayload.length > 1){
            this.nextNonverbalSignals = JSON.parse(this.lastRASAPayload[1].image.toString().replace(/'/g, '"'));
                    
            if(this.nextNonverbalSignals.action != "none"){
                this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_STATE_CHANGE, this.nextNonverbalSignals.action);
            }
        }
        else{
            this.nextNonverbalSignals = null;
        }

        if(this.nextNonverbalSignals != null){
            this.chatDuration = duration * 1000;
            this.setNonverbalSignals(this.nextNonverbalSignals);
            console.log(this.nextNonverbalSignals);
            console.log(this.nextNonverbalSignals);
            console.log(this.nextNonverbalSignals);
        }
    }

    RASAAnswerHandler(payload){
        console.log("res:");      
        var payloadTTS = {
            "mode" : "tts",
            "text" : payload[0].text
        }
        this.lastRASAPayload = payload;
        this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.TTS_ACTION, payloadTTS);

    }

    closestBodyRecognition(distance){
        if(distance > globalStore.welcomeDistance){

            /* Emit the state change event. */
            this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_STATE_CHANGE, "callToAction");
        }
    }

    setNonverbalSignals(action){
        console.log(action.face)
        if(action.face != "none"){
            var payloadFace = {
                "mode" : "setEmotion",
                "data" : action.face
            }
            this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_FACE_ACTION, payloadFace);
    
            this.chatEmotionTimeout = setTimeout(() => {
                console.log(this.chatDuration);
                var payloadFace = {
                    "mode" : "setEmotion",
                    "data" : "neutral"
                }
                this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_FACE_ACTION, payloadFace);
    
                clearTimeout(this.chatEmotionTimeout);
            }, this.chatDuration);
        }
        /*if(action.length > 1){
            var payloadBody = {
                "mode" : "setMode",
                "activity" : action[1]
            }
            this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_BODY_ACTION, payloadBody)
        }*/
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
}