import { State, Actions, Transition, StateWrap } from './BaseState.js';
import { Brain } from '../brain.js';
import logger from '../../tools/logger.js';
import globalStore from '../../tools/globals.js';
import readline from 'readline';
import { ChatProcessor } from '../processors/chat-processor.js';
import { SpeechProcessor } from '../processors/speech-processor.js';
import { DisplayProcessor } from '../processors/display-processor.js';
import { BodyLanguageProcessor } from '../processors/body-language-processor.js';



/* Robot state class defining the robot behavior within this state */
export class Talkative extends StateWrap{
    constructor(chatProcessor, emotionProcessor, bodyLanguageProcessor, speechProcessor, displayProcessor, brainEvents){

        /* Call the super constructor and set the identification name for the state class */
        super("talkative", emotionProcessor, bodyLanguageProcessor, speechProcessor, brainEvents);

        console.log(displayProcessor);

        this.sleepWords = ["geschlafen", "Geh schlafen", "Gute Nacht", "Zenit aus", "Zenith aus", "wir schlafen"];

        this.chatProcessor = chatProcessor;
        this.displayProcessor = displayProcessor;

        this.chatEmotionTimeout = null;

        this.nextNonverbalSignals = null;
        this.lastLLMPayload = {
            answer : "",
            emotion : "neutral"
        };

        /* Bind concrete implementation functions for enter and exit of the current state. */
        this.state.actions.onEnter = this.enterFunction.bind(this);
        this.state.actions.onExit = this.exitFunction.bind(this);

        /* Add transitions to the other states to build the graph.
        The transition is called after the state was left but before the new state is entered. */
        this.state.transitions.push(new Transition("idleAnchor", "idleAnchor", () => {
            console.log('transition action for "talkative" in "idleAnchor" state')
        }));
        this.state.transitions.push(new Transition("nap", "nap", () => {
            console.log('transition action for "talkative" in "nap" state')
        }));
        
        this.feedbackTimer = null;
        this.chatDuration = 0;
    }

    /* Enter function is executed whenever the state is activated. */
    enterFunction(){
        this.nextNonverbalSignals = null;
        this.lastLLMPayload = {
            answer : "",
            emotion : "neutral"
        };
        this.speechProcessor.speechEvent.on(SpeechProcessor.SPEECH_EVENTS.FINAL_RESULT_RECEIVED, this.finalResultHandler.bind(this));
        this.speechProcessor.speechEvent.on(SpeechProcessor.SPEECH_EVENTS.TEMP_WORD_LENGTH_RECEIVED, this.recognizedWordLengthHandler.bind(this));
        this.speechProcessor.speechEvent.on(SpeechProcessor.SPEECH_EVENTS.SOUND_CREATED, this.newSpeechSoundCreatedHandler.bind(this))
        this.chatProcessor.chatEvents.on(ChatProcessor.CHAT_EVENTS.LLM_ANSWER, this.LLMAnswerHandler.bind(this));
        this.displayProcessor.displayEvents.on(DisplayProcessor.DISPLAY_EVENTS.ROBOT_SPEECH_ENDED, this.robotSpeechEndedHandler.bind(this));
        this.bodyLanguageProcessor.bodyLanguageEvent.on(BodyLanguageProcessor.BODY_LANGUAGE_EVENTS.ALL_BODIES_LEFT_INTERACTION_ZONE, this.bodiesLeftHandler.bind(this));

        this.RoboticBody.followHead();
    }
    
    /* Exit function is executed whenever the state is left. */
    exitFunction(){
        /* Turn off event listener if state is exited. */
        clearTimeout(this.chatEmotionTimeout);
        this.speechProcessor.speechEvent.removeAllListeners(SpeechProcessor.SPEECH_EVENTS.FINAL_RESULT_RECEIVED, this.finalResultHandler);
        this.speechProcessor.speechEvent.removeAllListeners(SpeechProcessor.SPEECH_EVENTS.TEMP_WORD_LENGTH_RECEIVED, this.recognizedWordLengthHandler);
        this.speechProcessor.speechEvent.removeAllListeners(SpeechProcessor.SPEECH_EVENTS.SOUND_CREATED, this.newSpeechSoundCreatedHandler)
        this.chatProcessor.chatEvents.removeAllListeners(ChatProcessor.CHAT_EVENTS.LLM_ANSWER, this.LLMAnswerHandler);
        this.displayProcessor.displayEvents.removeAllListeners(DisplayProcessor.DISPLAY_EVENTS.ROBOT_SPEECH_ENDED, this.robotSpeechEndedHandler);
        this.bodyLanguageProcessor.bodyLanguageEvent.removeAllListeners(BodyLanguageProcessor.BODY_LANGUAGE_EVENTS.ALL_BODIES_LEFT_INTERACTION_ZONE, this.bodiesLeftHandler);
    }

    recognizedWordLengthHandler(wordLength){
        this.ScreenFace.addSpeechVisual(wordLength);
    }

    finalResultHandler(result){
        if(result.length > 1){
            if(this.isSleepWord(result)){
                //this.ScreenFace.blink();
                this.ScreenFace.sound.nameAndPlay("confirmSpeechInput");
                this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_STATE_CHANGE, "nap");
            }
            else{
                this.chatProcessor.LLMSendMessage(result);
                this.ScreenFace.calculate();
                this.ScreenFace.sound.nameAndPlay("confirmSpeechInput");
                this.speechProcessor.suspend();
            }
        }
    }

    LLMAnswerHandler(llmReply){
        if (this.isValidJSON(llmReply)) {
            console.log("The content is valid JSON.");
            console.log(llmReply.answer);
            this.lastLLMPayload = llmReply;
            this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.TEXT_TO_SPEECH_ACTION, Brain.payload_TEXT_TO_SPEECH(llmReply.answer));
          }
    }

    isValidJSON(payload) {
        return payload && typeof payload === 'object' && !Array.isArray(payload);
      }

    isSleepWord(input) {
        return this.sleepWords.some(word => word.toLowerCase() === input.toLowerCase());
    }

    robotSpeechEndedHandler(){
        console.log("robot speech ended handler");
        this.ScreenFace.emotion.neutral();
        this.RoboticBody.followHead();
        this.speechProcessor.resume();
    }

    bodiesLeftHandler(){
        //this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_STATE_CHANGE, "idleAnchor");
    }

    newSpeechSoundCreatedHandler(data){

        var duration = data.soundDuration;

        this.ScreenFace.stopCalculate();
        this.ScreenFace.emotion.setEmotion(this.lastLLMPayload.emotion);

        var robotAnimationDuration = 0;
        switch(this.lastLLMPayload.emotion){
            case "joy": robotAnimationDuration = Brain.ROBOT_MOTION_DURATIONS.JOY;
            break;
            case "anger": robotAnimationDuration = Brain.ROBOT_MOTION_DURATIONS.ANGER;
            break;
            case "contempt": robotAnimationDuration = Brain.ROBOT_MOTION_DURATIONS.CONTEMPT;
            break;
            case "sadness": robotAnimationDuration = Brain.ROBOT_MOTION_DURATIONS.SADNESS;
            break;
            case "fear": robotAnimationDuration = Brain.ROBOT_MOTION_DURATIONS.FEAR;
            break;
            case "disgust": robotAnimationDuration = Brain.ROBOT_MOTION_DURATIONS.DISGUST;
            break;
            case "surprise": robotAnimationDuration = Brain.ROBOT_MOTION_DURATIONS.SURPRISE;
            break;
        }

        if(duration * 1000 >= robotAnimationDuration + Brain.ROBOT_MOTION_DURATIONS.BUFFER_DURATION){
            if(this.lastLLMPayload.emotion != "neutral"){
                this.RoboticBody.bodyAction(this.lastLLMPayload.emotion);
            }
        }
    }
}