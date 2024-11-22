import { State, Actions, Transition, StateWrap } from '../BaseState.js';
import { Brain } from '../../brain.js';


/* Robot state class defining the robot behavior within this state */
export class Nap extends StateWrap{
    constructor(emotionProcessor, gesturePostureProcessor, speechProcessor, brainEvents){

        /* Call the super constructor and set the identification name for the state class */
        super("nap", emotionProcessor, gesturePostureProcessor, speechProcessor, brainEvents);

        this.breakWords = ["zenit", "hopp", "hop", "aufwachen","zenith"];

        /* ToDo: This implementation has to be improved in the future. */
        /* We cannot make sure how long the animation duration of the robot arm lasts.
        Thus, we anticipate that the animation of the robot arm has been successfully
        executed after a specified time. If this is not the case the animation will
        be overridden by the following. */
        this.ANTICIPATED_ANIMATION_DURATION = 4000000; /* Time duration in milliseconds. */

        this.timeout = null;

        /* Bind concrete implementation functions for enter and exit of the current state. */
        this.state.actions.onEnter = this.enterFunction.bind(this);
        this.state.actions.onExit = this.exitFunction.bind(this);

        /* Add transitions to the other states to build the graph.
        The transition is called after the state was left but before the new state is entered. */
        this.state.transitions.push(new Transition("idleAnchor", "idleAnchor", () => {
            console.log('transition action for "nap" in "idleAnchor"');
        }));
        this.state.transitions.push(new Transition("napWake", "napWake", () => {
            console.log('transition action for "nap" in "napWake"');
        }));
    }

    /* Enter function is executed whenever the state is activated. */
    enterFunction(){

        /* Set the payload for robot mode activation over websocket.
        mode: setMode | DataSupply
        activity: The strategy interpreted and executed by the connected robot device */

        //this.ScreenFace.emotion.rage();
        this.RoboticBody.nap();
        this.ScreenFace.emotion.sleepy();

        this.speechProcessor.speechEvent.on('FinalResult', this.finalResultHandler.bind(this));

        /* Go back to follow state after the anticipated execution time of attack. */
        this.timeout = setTimeout(() => {
            /* Emit the attack state change event. */
            this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_STATE_CHANGE, "idleAnchor");
            clearTimeout(this.timeout);
        }, this.ANTICIPATED_ANIMATION_DURATION);
    }

    exitFunction(){
        clearTimeout(this.timeout);
        this.speechProcessor.speechEvent.removeAllListeners('FinalResult', this.finalResultHandler);
    }

    finalResultHandler(result){
        if(this.containsWords(result, this.breakWords)){
            this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_STATE_CHANGE, "napWake");     
        }
    }

    containsWords(str, wordsArray) {
        const pattern = new RegExp(wordsArray.join('|'), 'i');
        return pattern.test(str);
    }
}