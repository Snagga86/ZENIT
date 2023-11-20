import { State, Actions, Transition, StateWrap } from '../BaseState.js';
import { Brain } from '../../brain.js';
import keypress from 'keypress';
import globalStore from '../../../tools/globals.js';
import { FunctionScheduler } from '../../../tools/functionScheduler.js';

/* Robot state class defining the robot behavior within this state */
export class SubtleActivation extends StateWrap{
    constructor(emotionProcessor, gesturePostureProcessor, speechProcessor, brainEvents){

        /* Call the super constructor and set the identification name for the state class */
        super("subtleActivation", emotionProcessor, gesturePostureProcessor, speechProcessor, brainEvents);

        /* Bind concrete implementation functions for enter and exit of the current state. */
        this.state.actions.onEnter = this.enterFunction.bind(this);
        this.state.actions.onExit = this.exitFunction.bind(this);

        /* Add transitions to the other states to build the graph.
        The transition is called after the state was left but before the new state is entered. */
        this.state.transitions.push(new Transition("explicitActivation", "explicitActivation", () => {
        }));
        this.state.transitions.push(new Transition("chatBase", "chatBase", () => {
        }));
        /*this.state.transitions.push(new Transition("heatProtectionEntry", "heatProtectionEntry", () => {
        }));*/

        this.drinkingDetected = false;
        this.drinkingMotivationAttempts = 0;
        this.MAX_DRINKING_MOTIVATION_ATTEMPTS = 0;

        this.breakWords = ["stop", "stoppen", "aufhören", "schluss","unterhalten"];
        this.timerSchedule = [];
    }

    /* Enter function is executed whenever the state is activated. */
    enterFunction(){
        //process.stdin.resume();
        //process.stdin.addListener('keypress', this.keyPressHandler);
        this.drinkingMotivationAttempts = 0;
        this.drinkingDetected = false;
        this.ScreenFace.emotion.neutral();
        this.animationSchedule();
        this.speechProcessor.speechEvent.on('FinalResult', this.finalResultHandler.bind(this));
    }

    animationSchedule(){    
        this.animationReset();
        this.timerSchedule.push(setTimeout(() => {this.ScreenFace.emotion.hot()}, 100));
        this.timerSchedule.push(setTimeout(() => {this.RoboticBody.sadness()}, 15000));
        this.timerSchedule.push(setTimeout(() => {this.RoboticBody.followHead()}, 25000));
        this.timerSchedule.push(setTimeout(() => {this.ScreenFace.emotion.thirsty()}, 35000));
        this.timerSchedule.push(setTimeout(() => {this.ScreenFace.sound.nameAndPlay("drinking")}, 37000));
        this.timerSchedule.push(setTimeout(() => {this.ScreenFace.emotion.neutral()}, 55000));
        this.timerSchedule.push(setTimeout(() => {this.RoboticBody.followHead()}, 60000));
        this.timerSchedule.push(setTimeout(() => {this.schedulerCallback()}, 60000));
    }

    animationReset(){
        var i = 0;
        while(i < this.timerSchedule.length){
            clearTimeout(this.timerSchedule[i]);
            i++;
        }
    }

    schedulerCallback(){
        this.animationReset();
        this.drinkingMotivationAttempts++;
        if(this.drinkingMotivationAttempts > this.MAX_DRINKING_MOTIVATION_ATTEMPTS){
            this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_STATE_CHANGE, "explicitActivation");
        }
        else{
            if(this.drinkingDetected == false){
                this.animationSchedule();
            }
            else{
                this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_STATE_CHANGE, "heatProtectionEntry");
            }
        }
    }

    /* Exit function is executed whenever the state is left. */
    exitFunction(){

        /* Turn off event listener if state is exited. */
        //process.stdin.removeListener('keypress', this.keyPressHandler);

        // Stop listening for input
        //process.stdin.pause();
        this.animationReset();
        this.speechProcessor.speechEvent.removeAllListeners('FinalResult', this.finalResultHandler);
    }
    
    finalResultHandler(result){
        console.log("tts result:" + result);

        if(this.containsWords(result, this.breakWords)){
            var payloadTTS = {
                "mode" : "tts",
                "text" : "Alles klar. Kein Problem!"
            }
            this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.TTS_ACTION, payloadTTS);
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
}