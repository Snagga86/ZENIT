import { State, Actions, Transition, StateWrap } from './BaseState.js';
import { Brain } from '../brain.js';
import logger from '../../tools/logger.js';
import globalStore from '../../tools/globals.js';
import readline from 'readline';



/* Robot state class defining the robot behavior within this state */
export class LLMBase extends StateWrap{
    constructor(chatProcessor, emotionProcessor, gesturePostureProcessor, speechProcessor, brainEvents){

        /* Call the super constructor and set the identification name for the state class */
        super("llmBase", emotionProcessor, gesturePostureProcessor, speechProcessor, brainEvents);

        this.chatProcessor = chatProcessor;

        this.nextNonverbalSignals = null;
        this.lastLLMPayload = null;

        /* Bind concrete implementation functions for enter and exit of the current state. */
        this.state.actions.onEnter = this.enterFunction.bind(this);
        this.state.actions.onExit = this.exitFunction.bind(this);

        /* Add transitions to the other states to build the graph.
        The transition is called after the state was left but before the new state is entered. */
        this.state.transitions.push(new Transition("exerciseEntry", "exerciseEntry", () => {
            console.log('transition action for "ChatBase" in "exerciseEntry" state')
        }));
        
        this.feedbackTimer = null;
        this.chatDuration = 0;
    }

    /* Enter function is executed whenever the state is activated. */
    enterFunction(){
        this.nextNonverbalSignals = null;
        this.lastLLMPayload = null;
        this.speechProcessor.speechEvent.on('FinalResult', this.finalResultHandler.bind(this));
        this.chatProcessor.chatEvents.on(Brain.ROBOT_BRAIN_EVENTS.LLAMA_ANSWER, this.LLMAnswerHandler.bind(this));
        this.brainEvents.on(Brain.ROBOT_BRAIN_EVENTS.NEW_CHAT_DURATION, this.newChatDurationCalculatedHandler.bind(this));
        //this.ScreenFace.calculate();

        /*this.gesturePostureProcessor.gesturePostureEvent.on('ClosestBodyDistance', this.closestBodyRecognition.bind(this));
        
        this.chatProcessor.chatEvents.on(Brain.ROBOT_BRAIN_EVENTS.RASA_ANSWER, this.RASAAnswerHandler.bind(this));
        this.brainEvents.on(Brain.ROBOT_BRAIN_EVENTS.NEW_CHAT_DURATION, this.newChatDurationCalculatedHandler.bind(this));
        this.gesturePostureProcessor.gesturePostureEvent.on('GesturePostureDetection', this.gesturePostureDetection.bind(this)); */

        // Create an interface for input and output
        const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false
        });

        // Prompt the user
        console.log('Enter text (type "exit" to quit):');

        // Listen for the 'line' event, which is triggered when the Enter key is pressed
        rl.on('line', (input) => {
        if (input.toLowerCase() === 'exit') {
            console.log('Goodbye!');
            rl.close(); // Close the interface
        } else {
            console.log(`You entered: ${input}`);
            this.chatProcessor.LLMSendMessage(input);
        }
        });
    }

    finalResultHandler(result){
        console.log("tts result:" + result);
        if(result.length > 1){
            this.chatProcessor.LLMSendMessage(result);
            this.ScreenFace.calculate();
            this.ScreenFace.sound.nameAndPlay("confirmSpeechInput");
        }
    }

    LLMAnswerHandler(llmReply){

        console.log(llmReply);
        if (this.isValidJSON(llmReply)) {
            console.log("The content is valid JSON.");
            var payloadTTS = {
                "mode" : "tts",
                "text" : llmReply.answer
            }
            this.lastLLMPayload = llmReply;
    
            console.log(llmReply.answer);
            console.log(llmReply.emotion);
            this.ScreenFace.emotion.setEmotion(llmReply.emotion);
            this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.TEXT_TO_SPEECH_ACTION, payloadTTS);
          }
    }

    isValidJSON(payload) {
        // Check if the input is an object and not null
        return payload && typeof payload === 'object' && !Array.isArray(payload);
      }

    /* Exit function is executed whenever the state is left. */
    exitFunction(){

        /* Turn off event listener if state is exited. */
        /*this.gesturePostureProcessor.gesturePostureEvent.removeAllListeners('ClosestBodyDistance', this.closestBodyRecognition);
        this.speechProcessor.speechEvent.removeAllListeners('FinalResult', this.finalResultHandler);
        this.chatProcessor.chatEvents.removeAllListeners(Brain.ROBOT_BRAIN_EVENTS.RASA_ANSWER, this.RASAAnswerHandler);
        this.brainEvents.removeAllListeners(Brain.ROBOT_BRAIN_EVENTS.NEW_CHAT_DURATION, this.newChatDurationCalculatedHandler);
        this.gesturePostureProcessor.gesturePostureEvent.removeAllListeners('GesturePostureDetection', this.gesturePostureDetection);
        clearTimeout(this.feedbackTimer); */
    }

    

    /*
    gesturePostureDetection(gesture){
        if(gesture == "stop"){
            this.ScreenFace.sound.stop();
            var payload = {
                "mode" : "listen",
                "status" : "resume",
                "duration" : "none"
            }
            this.feedbackTimer = setTimeout(() => {this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.SPEECH_TO_TEXT_ACTION, payload);}, 1500);         
            this.ScreenFace.sound.speak("Ich bin still.");
        }
    }*/

    

    /*setNonverbalSignals(action){
        console.log(action.face)
        if(action.face != "none"){

            this.ScreenFace.emotion.setEmotion(action.face);
    
            this.chatEmotionTimeout = setTimeout(() => {
                console.log(this.chatDuration);
                this.ScreenFace.emotion.neutral();
    
                clearTimeout(this.chatEmotionTimeout);
            }, this.chatDuration);
        }
    } */
        
    newChatDurationCalculatedHandler(duration){
        this.chatDuration = duration * 1000;
        this.chatEmotionTimeout = setTimeout(() => {
            console.log(this.chatDuration);
            this.ScreenFace.emotion.neutral();

            clearTimeout(this.chatEmotionTimeout);
        }, this.chatDuration);
    }
/*
    RASAAnswerHandler(payload){
        console.log("res:");      
        var payloadTTS = {
            "mode" : "tts",
            "text" : payload[0].text
        }
        this.lastRASAPayload = payload;
        this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.TEXT_TO_SPEECH_ACTION, payloadTTS);

    }

    closestBodyRecognition(distance){
        if(distance > globalStore.welcomeDistance){

            this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_STATE_CHANGE, "callToAction");
        }
    }*/

    
}