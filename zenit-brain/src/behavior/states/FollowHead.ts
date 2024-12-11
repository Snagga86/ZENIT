import { State, Actions, Transition, StateWrap } from './BaseState.js';
import { Brain } from '../brain.js';
import { ChatProcessor } from '../processors/chat-processor.js';
import { SpeechProcessor } from '../processors/speech-processor.js';
import { DisplayProcessor } from '../processors/display-processor.js';
import { BodyLanguageProcessor } from '../processors/body-language-processor.js';
import { PhoneCamProcessor } from '../processors/phone-cam-processor.js';
import { EventEmitter } from 'stream';

/* Robot state class defining the robot behavior within this state */
export class FollowHead extends StateWrap{

    chatProcessor : ChatProcessor;
    displayProcessor : DisplayProcessor;
    sleepWords : Array<String>;
    chatEmotionTimeout : any | null;

    lastLLMPayload : any | null;
    lastEmotion : string;
    freezedEmotion : Boolean;

    constructor(chatProcessor : ChatProcessor, phoneCamProcessor : PhoneCamProcessor, bodyLanguageProcessor : BodyLanguageProcessor, speechProcessor : SpeechProcessor, displayProcessor : DisplayProcessor, brainEvents : EventEmitter){

        /* Call the super constructor and set the identification name for the state class */
        super("talkative", phoneCamProcessor, bodyLanguageProcessor, speechProcessor, brainEvents);

        console.log(displayProcessor);

        this.sleepWords = ["geschlafen", "Geh schlafen", "Gute Nacht", "Zenit aus", "Zenith aus", "wir schlafen"];

        this.chatProcessor = chatProcessor;
        this.displayProcessor = displayProcessor;

        this.chatEmotionTimeout = null;

        this.lastLLMPayload = {
            answer : "",
            emotion : "neutral"
        };

        this.lastEmotion = "";
        this.freezedEmotion = false;

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
    }

    /* Enter function is executed whenever the state is activated. */
    public enterFunction(){
        this.emotionProcessor.emotionEvent.on(PhoneCamProcessor.EMOTION_EVENTS.EMOTION_TRIGGERED, this.emotionTriggeredHandler.bind(this));
        this.RoboticBody.followHeadPercentages();
    }
    
    /* Exit function is executed whenever the state is left. */
    public exitFunction(){
        this.emotionProcessor.emotionEvent.removeAllListeners(PhoneCamProcessor.EMOTION_EVENTS.EMOTION_TRIGGERED);
    }

    private emotionTriggeredHandler(emotion : string){
        if(!this.freezedEmotion){
            this.lastEmotion = emotion;
            this.ScreenFace.emotion.setEmotion(this.lastEmotion);
        }
    }
}