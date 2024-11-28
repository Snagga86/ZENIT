import { State, Actions, Transition, StateWrap } from '../BaseState.js';
import { Brain } from '../../brain.js';
import { EventEmitter } from 'stream';
import { EmotionProcessor } from '../../processors/emotion-processor.js';
import { BodyLanguageProcessor } from '../../processors/body-language-processor.js';
import { SpeechProcessor } from '../../processors/speech-processor.js';

/* Robot state class defining the robot behavior within this state */
export class Look extends StateWrap{

    private LOOK1_ANTICIPATED_ANIMATION_DURATION : number;
    private LOOK2_ANTICIPATED_ANIMATION_DURATION : number;
    private LOOK3_ANTICIPATED_ANIMATION_DURATION : number;
    private timeout : NodeJS.Timeout | null;

    constructor(emotionProcessor : EmotionProcessor, bodyLanguageProcessor : BodyLanguageProcessor, speechProcessor : SpeechProcessor, brainEvents : EventEmitter){

        /* Call the super constructor and set the identification name for the state class */
        super("look", emotionProcessor, bodyLanguageProcessor, speechProcessor, brainEvents);


        /* ToDo: This implementation has to be improved in the future. */
        /* We cannot make sure how long the animation duration of the robot arm lasts.
        Thus, we anticipate that the animation of the robot arm has been successfully
        executed after a specified time. If this is not the case the animation will
        be overridden by the following. */
        this.LOOK1_ANTICIPATED_ANIMATION_DURATION = 7500; /* Time duration in milliseconds. */
        this.LOOK2_ANTICIPATED_ANIMATION_DURATION = 10500; /* Time duration in milliseconds. */
        this.LOOK3_ANTICIPATED_ANIMATION_DURATION = 9500; /* Time duration in milliseconds. */

        this.timeout = null;

        /* Bind concrete implementation functions for enter and exit of the current state. */
        this.state.actions.onEnter = this.enterFunction.bind(this);
        this.state.actions.onExit = this.exitFunction.bind(this);
        /* Add transitions to the other states to build the graph.
        The transition is called after the state was left but before the new state is entered. */
        this.state.transitions.push(new Transition("idleAnchor", "idleAnchor", () => {
            console.log('transition action for "look" in "idleAnchor" state');
        }));
        this.state.transitions.push(new Transition("talkative", "talkative", () => {
            console.log('transition action for "look" in "talkative" state');
        }));
    }

    /* Enter function is executed whenever the state is activated. */
    enterFunction(){

        /* Set the payload for robot mode activation over websocket.
        mode: setMode | DataSupply
        activity: The strategy interpreted and executed by the connected robot device */

        this.ScreenFace.emotion.neutral();

        console.log("in look state");
        this.timeout = setTimeout(() => {
            clearTimeout(this.timeout as NodeJS.Timeout);
            if(this.bodyLanguageProcessor.bodyIsInInteractionZone == true){
                this.progressToTalkative();
            }
            else{
                this.look1Procedure();
            }
        },200);
    }

    exitFunction(){
        clearTimeout(this.timeout as NodeJS.Timeout);
    }

    progressToTalkative(){
        clearTimeout(this.timeout as NodeJS.Timeout);
        var payloadTTS = {
            "mode" : "tts",
            "text" : "Moin!"
        }
        this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.TEXT_TO_SPEECH_ACTION, payloadTTS);
        this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_STATE_CHANGE, "talkative");
    }

    look1Procedure(){
        console.log("look procedure 1");
        this.RoboticBody.look1();
        this.timeout = setTimeout(() => {
            clearTimeout(this.timeout as NodeJS.Timeout);
            if(this.bodyLanguageProcessor.bodyIsInInteractionZone == true){
                this.progressToTalkative();
            }
            else{
                this.look2Procedure();
            }
        }, this.LOOK1_ANTICIPATED_ANIMATION_DURATION);
    }

    look2Procedure(){
        console.log("look procedure 2");
        this.RoboticBody.look2();
        this.timeout = setTimeout(() => {
            clearTimeout(this.timeout as NodeJS.Timeout);
            if(this.bodyLanguageProcessor.bodyIsInInteractionZone == true){
                this.progressToTalkative();
            }
            else{
                this.look3Procedure();
            }
        }, this.LOOK2_ANTICIPATED_ANIMATION_DURATION);
    }

    look3Procedure(){
        console.log("look procedure 3");
        this.RoboticBody.look3();
        this.timeout = setTimeout(() => {
            clearTimeout(this.timeout as NodeJS.Timeout);
            if(this.bodyLanguageProcessor.bodyIsInInteractionZone == true){
                this.progressToTalkative();
            }
            else{
                this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_STATE_CHANGE, "idleAnchor");
            }
        }, this.LOOK3_ANTICIPATED_ANIMATION_DURATION);
    }
}