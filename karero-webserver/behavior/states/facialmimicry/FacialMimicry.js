import { State, Actions, Transition, StateWrap } from '../BaseState.js';
import { Brain } from '../../brain.js';
import logger from '../../../tools/logger.js';
import globalStore from '../../../tools/globals.js';

/* Robot state class defining the robot behavior within this state */
export class FacialMimicry extends StateWrap{
    constructor(emotionProcessor, gesturePostureProcessor, speechProcessor, brainEvents){

        /* Call the super constructor and set the identification name for the state class */
        super("facialMimicry", emotionProcessor, gesturePostureProcessor, speechProcessor, brainEvents);

        /* Bind concrete implementation functions for enter and exit of the current state. */
        this.state.actions.onEnter = this.enterFunction.bind(this);
        this.state.actions.onExit = this.exitFunction.bind(this);

        /* Add transitions to the other states to build the graph.
        The transition is called after the state was left but before the new state is entered. */
        this.state.transitions.push(new Transition("chatBase", "chatBase", () => {
        }));

        this.breakWords = ["stop", "stoppen", "aufhören", "chatten","unterhalten"];

        this.chatEmotionTimeout;
    }

    /* Enter function is executed whenever the state is activated. */
    enterFunction(){
        
        /* Add the event listener to listen on GesturePostureDetection events.
        Execute gesturePostureRecognition function on received detections. */
        this.gesturePostureProcessor.gesturePostureEvent.on('ClosestBodyDistance', this.closestBodyRecognition.bind(this));
        this.brainEvents.on(Brain.ROBOT_BRAIN_EVENTS.NEW_CHAT_DURATION, this.newChatDurationCalculatedHandler.bind(this));
        this.emotionProcessor.emotionEvent.on("EmotionDetection", this.emotionProcessing.bind(this));
        this.speechProcessor.speechEvent.on('FinalResult', this.finalResultHandler.bind(this));
        /* Set the payload for robot mode activation over websocket.
        mode: setMode | DataSupply
        activity: The strategy interpreted and executed by the connected robot device */

        this.RoboticBody.followHead();
        this.ScreenFace.emotion.neutral();
    }

    /* Exit function is executed whenever the state is left. */
    exitFunction(){

        /* Turn off event listener if state is exited. */
        this.gesturePostureProcessor.gesturePostureEvent.removeAllListeners('ClosestBodyDistance', this.closestBodyRecognition);
        this.brainEvents.removeAllListeners(Brain.ROBOT_BRAIN_EVENTS.NEW_CHAT_DURATION, this.newChatDurationCalculatedHandler);
        this.speechProcessor.speechEvent.removeAllListeners('FinalResult', this.finalResultHandler);
        this.emotionProcessor.emotionEvent.removeAllListeners("EmotionDetection", this.emotionProcessing.bind(this));
        clearTimeout(this.chatEmotionTimeout);
    }

    finalResultHandler(result){
        console.log("tts result:" + result);

        if(this.containsWords(result, this.breakWords)){
            var payloadTTS = {
                "mode" : "tts",
                "text" : "Alles klar. Kein Problem!"
            }
            this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.TEXT_TO_SPEECH_ACTION, payloadTTS);
            console.log("goto chatBase");
            this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_STATE_CHANGE, "chatBase");     
        }
    }

    containsWords(str, wordsArray) {
        // Create a regular expression pattern from the array of words
        const pattern = new RegExp(wordsArray.join('|'), 'i');
      
        // Test if the string contains any of the words
        return pattern.test(str);
    }

    emotionProcessing(emotion){
        console.log("emotion check:", emotion);
        this.ScreenFace.emotion.setEmotion(emotion.toLowerCase());
    }

    newChatDurationCalculatedHandler(duration){
        this.chatEmotionTimeout = setTimeout(() => {

            this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_STATE_CHANGE, "chatBase");
    
            clearTimeout(this.chatEmotionTimeout);
        }, this.chatDuration);
    }

    /* Interpretion function of received data coming from Azure Kinectic Space. */
    closestBodyRecognition(distance){
        /* If the arnold gesture was detected the robot changes its state to attack. */
        if(distance > globalStore.welcomeDistance){

            /* Emit the attack state change event. */
            this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_STATE_CHANGE, "callToAction");
        }
    }
}