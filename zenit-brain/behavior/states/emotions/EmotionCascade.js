import { State, Actions, Transition, StateWrap } from '../BaseState.js';
import { Brain } from '../../brain.js';
import logger from '../../../tools/logger.js';
import globalStore from '../../../tools/globals.js';
import readline from 'readline';



/* Robot state class defining the robot behavior within this state */
export class EmotionCascade extends StateWrap{
    constructor(chatProcessor, emotionProcessor, gesturePostureProcessor, speechProcessor, brainEvents){

        /* Call the super constructor and set the identification name for the state class */
        super("emotionCascade", emotionProcessor, gesturePostureProcessor, speechProcessor, brainEvents);

        this.emotionStates = ['neutral','contempt','joy','anger','disgust','sadness','surprise','fear','neutral','thirsty','hot'];

        this.currentEmotion = 0;
        this.currentMode = 0;

        this.breakWords = ["stop", "stoppen", "aufhören", "chatten","unterhalten"];

        /* Bind concrete implementation functions for enter and exit of the current state. */
        this.state.actions.onEnter = this.enterFunction.bind(this);
        this.state.actions.onExit = this.exitFunction.bind(this);

        /* Add transitions to the other states to build the graph.
        The transition is called after the state was left but before the new state is entered. */
        this.state.transitions.push(new Transition("callToAction", "callToAction", () => {
            console.log('transition action for "emotionCascade" in "callToAction" state')
        }));
        this.state.transitions.push(new Transition("chatBase", "chatBase", () => {
            console.log('transition action for "emotionCascade" in "chatBase" state')
        }));

        this.waitForNextAnimationTimeout;
        this.currentAnimationDuration;
        this.changeAnimationTimeout;
    }

    /* Enter function is executed whenever the state is activated. */
    enterFunction(){
        this.currentEmotion = 0;
        this.bodyLanguageProcessor.gesturePostureEvent.on('ClosestBodyDistance', this.closestBodyRecognition.bind(this));
        this.speechProcessor.speechEvent.on('FinalResult', this.finalResultHandler.bind(this));
        
        this.followHead();
    }

    /* Exit function is executed whenever the state is left. */
    exitFunction(){

        /* Turn off event listener if state is exited. */
        this.bodyLanguageProcessor.gesturePostureEvent.removeAllListeners('ClosestBodyDistance', this.closestBodyRecognition);
        this.speechProcessor.speechEvent.removeAllListeners('FinalResult', this.finalResultHandler);
        clearTimeout(this.waitForNextAnimationTimeout);
        clearTimeout(this.changeAnimationTimeout);
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

    /* Interpretion function of received data coming from Azure Kinectic Space. */
    closestBodyRecognition(distance){
        /* If the arnold gesture was detected the robot changes its state to attack. */
        if(distance >= globalStore.welcomeDistance){

            /* Emit the attack state change event. */
            this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_STATE_CHANGE, "callToAction");
        }
    }

    seekAttention(){
        this.RoboticBody.seekAttention();

        this.waitForNextAnimationTimeout = setTimeout(() => {
            this.followHead();
        }, 4500);
    }

    followHead(){
        console.log("next follow head");
        clearTimeout(this.changeAnimationTimeout);
        clearTimeout(this.waitForNextAnimationTimeout);

        this.ScreenFace.emotion.neutral();
        this.RoboticBody.followHead();

        this.waitForNextAnimationTimeout = setTimeout(() => {
            console.log("changenextEmotionTimeout set nextEmotion");
            this.nextEmotion();
        }, 5000);
    }

    nextEmotion(){
        console.log("next iteration...");
        console.log("Emotion: " + this.emotionStates[this.currentEmotion]);
        clearTimeout(this.changeAnimationTimeout);
        clearTimeout(this.waitForNextAnimationTimeout);

        this.RoboticBody.bodyAction(this.emotionStates[this.currentEmotion]);

        var curEmo = this.emotionStates[this.currentEmotion];
        if(curEmo == "fear"){
            curEmo = "terror";
        }

        this.ScreenFace.emotion.setEmotion(curEmo[0].toUpperCase() + curEmo.slice(1));

        console.log(this.currentEmotion);

        if(this.emotionStates[this.currentEmotion] == 'neutral'){
            this.currentAnimationDuration = 3000;
        }
        if(this.emotionStates[this.currentEmotion] == 'joy'){
            this.currentAnimationDuration = 6000;
        }
        if(this.emotionStates[this.currentEmotion] == 'anger'){
            this.currentAnimationDuration = 6500;
        }
        if(this.emotionStates[this.currentEmotion] == 'disgust'){
            this.currentAnimationDuration = 5000;
        }
        if(this.emotionStates[this.currentEmotion] == 'sadness'){
            this.currentAnimationDuration = 10000;
        }
        if(this.emotionStates[this.currentEmotion] == 'surprise'){
            this.currentAnimationDuration = 6000;
        }
        if(this.emotionStates[this.currentEmotion] == 'fear'){
            this.currentAnimationDuration = 5000;
        }
        if(this.emotionStates[this.currentEmotion] == 'contempt'){
            this.currentAnimationDuration = 5000;
        }
        if(this.emotionStates[this.currentEmotion] == 'hot'){
            this.currentAnimationDuration = 15000;
        }
        if(this.emotionStates[this.currentEmotion] == 'thirsty'){
            this.currentAnimationDuration = 25000;
        }
        
        console.log(this.currentAnimationDuration);

        this.changeAnimationTimeout = setTimeout(() => {
            console.log("changeAnimationTimeout set followhead");
            this.followHead();
        }, this.currentAnimationDuration);

        this.currentEmotion++;
        if(this.currentEmotion >= this.emotionStates.length - 1){
            this.currentMode++;
            console.log(this.currentEmotion);
            this.currentEmotion = 0;
        }
    }
}