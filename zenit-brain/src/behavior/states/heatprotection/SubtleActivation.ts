import { StateController, Actions, Transition, ZENITState } from './../zenit-state.js';
import { Brain } from '../../brain.js';
import { ChatProcessor } from '../../processors/chat-processor.js';
import { SpeechProcessor } from '../../processors/speech-processor.js';
import { DisplayProcessor } from '../../processors/display-processor.js';
import { BodyLanguageProcessor } from '../../processors/body-language-processor.js';
import { PhoneCamProcessor } from '../../processors/phone-cam-processor.js';
import { EventEmitter } from 'stream';

/* Robot state class defining the robot behavior within this state */
export class SubtleActivation extends ZENITState{

    chatProcessor : ChatProcessor;
    displayProcessor : DisplayProcessor;
    drinkingDetected : Boolean;
    drinkingMotivationAttempts : number;
    MAX_DRINKING_MOTIVATION_ATTEMPTS : number;
    breakWords : Array<String>;
    timerSchedule : Array<any>;

    constructor(chatProcessor : ChatProcessor, phoneCamProcessor : PhoneCamProcessor, bodyLanguageProcessor : BodyLanguageProcessor, speechProcessor : SpeechProcessor, displayProcessor : DisplayProcessor, brainEvents : EventEmitter){

        /* Call the super constructor and set the identification name for the state class */
        super("subtleActivation", phoneCamProcessor, bodyLanguageProcessor, speechProcessor, brainEvents);

        this.chatProcessor = chatProcessor;
        this.displayProcessor = displayProcessor;

        /* Bind concrete implementation functions for enter and exit of the current state. */
        this.state.actions.onEnter = this.enterFunction.bind(this);
        this.state.actions.onExit = this.exitFunction.bind(this);

        /* Add transitions to the other states to build the graph.
        The transition is called after the state was left but before the new state is entered. */
        this.state.transitions.push(new Transition("explicitActivation", "explicitActivation", () => {
        }));
        this.state.transitions.push(new Transition("talkative", "talkative", () => {
        }));
        /*this.state.transitions.push(new Transition("heatProtectionEntry", "heatProtectionEntry", () => {
        }));*/

        this.drinkingDetected = false;
        this.drinkingMotivationAttempts = 0;
        this.MAX_DRINKING_MOTIVATION_ATTEMPTS = 0;

        this.breakWords = ["stop", "stopp", "stoppen", "aufhören", "schluss","unterhalten"];
        this.timerSchedule = [];
    }

    /* Enter function is executed whenever the state is activated. */
    enterFunction(){
        this.speechProcessor.resume();
        this.drinkingMotivationAttempts = 0;
        this.drinkingDetected = false;
        this.ScreenFace.emotion.neutral();
        this.animationSchedule();
        this.speechProcessor.speechEvents.on(SpeechProcessor.SPEECH_EVENTS.FINAL_RESULT_RECEIVED,  this.finalResultHandler.bind(this));
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
                this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_STATE_CHANGE, "subtleActivation");
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
        this.speechProcessor.speechEvents.removeAllListeners(SpeechProcessor.SPEECH_EVENTS.FINAL_RESULT_RECEIVED);
    }
    
    finalResultHandler(result : any){
        if(this.containsWords(result, this.breakWords)){
            var payloadTTS = {
                "mode" : "tts",
                "text" : "Alles klar. Kein Problem!"
            }
            this.displayProcessor.displayEvents.addListener(DisplayProcessor.DISPLAY_EVENTS.ROBOT_SPEECH_ENDED, this.speechEndedHandler.bind(this));
            this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.TEXT_TO_SPEECH_ACTION, payloadTTS);
        }
    }

    speechEndedHandler(){
        this.displayProcessor.displayEvents.removeAllListeners(DisplayProcessor.DISPLAY_EVENTS.ROBOT_SPEECH_ENDED);
        this.speechProcessor.resume();
        this.ScreenFace.emotion.neutral();
        this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_STATE_CHANGE, "talkative");     
    }

    containsWords(str : any, wordsArray : any) {
        // Create a regular expression pattern from the array of words
        const pattern = new RegExp(wordsArray.join('|'), 'i');
      
        // Test if the string contains any of the words
        return pattern.test(str);
    }
}