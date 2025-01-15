import { StateController, Actions, Transition, ZENITState } from '../zenit-state.js';
import { Brain } from '../../brain.js';
import { PhoneCamProcessor } from '../../processors/phone-cam-processor.js';
import { BodyLanguageProcessor } from '../../processors/body-language-processor.js';
import { SpeechProcessor } from '../../processors/speech-processor.js';
import { EventEmitter } from 'stream';


/* Robot state class defining the robot behavior within this state */
export class IdleAnchor extends ZENITState{

    ANTICIPATED_ANIMATION_DURATION : number;
    idlingStyles : Array<String>;
    lastState : String;
    timeout : NodeJS.Timeout | null;

    constructor(emotionProcessor : PhoneCamProcessor, bodyLanguageProcessor : BodyLanguageProcessor, speechProcessor : SpeechProcessor, brainEvents : EventEmitter){

        /* Call the super constructor and set the identification name for the state class */
        super("idleAnchor", emotionProcessor, bodyLanguageProcessor, speechProcessor, brainEvents);

        /* ToDo: This implementation has to be improved in the future. */
        /* We cannot make sure how long the animation duration of the robot arm lasts.
        Thus, we anticipate that the animation of the robot arm has been successfully
        executed after a specified time. If this is not the case the animation will
        be overridden by the following. */
        this.ANTICIPATED_ANIMATION_DURATION = 1000; /* Time duration in milliseconds. */

        this.idlingStyles = ["jawn", "look", "nap"];
        this.lastState = "";

        this.timeout = null;

        /* Bind concrete implementation functions for enter and exit of the current state. */
        this.state.actions.onEnter = this.enterFunction.bind(this);

        /* Add transitions to the other states to build the graph.
        The transition is called after the state was left but before the new state is entered. */
        this.state.transitions.push(new Transition("jawn", "jawn", () => {
            console.log('transition action for "idleAnchor" in "jawn" state');
        }));
        this.state.transitions.push(new Transition("look", "look", () => {
            console.log('transition action for "idleAnchor" in "look" state');
        }));
        this.state.transitions.push(new Transition("nap", "nap", () => {
            console.log('transition action for "idleAnchor" in "nap" state');
        }));
    }

    /* Enter function is executed whenever the state is activated. */
    enterFunction(){
        console.log("Enter indleAnchor!");

        this.RoboticBody.neutral();
        this.ScreenFace.emotion.neutral();

        var action = this.getRandomInt(0, this.idlingStyles.length - 1);

        console.log("Randomly chosen state:" + this.idlingStyles[action].toString());
        var state = this.idlingStyles[action].toString();

        if(this.lastState == "jawn"){
            while(state == "jawn"){
                var action = this.getRandomInt(0, this.idlingStyles.length - 1);
                state = this.idlingStyles[action].toString();
                console.log("state chosen:" + state);
            }
        }
        this.lastState = state;

        this.timeout = setTimeout(() => {
            /* Emit the attack state change event. */
            this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_STATE_CHANGE, state);
            clearTimeout(this.timeout as NodeJS.Timeout);
        }, this.ANTICIPATED_ANIMATION_DURATION);
        
    }

    exitFunction(){
        clearTimeout(this.timeout as NodeJS.Timeout);
    }

    getRandomInt(min : number, max : number) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}