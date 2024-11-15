import { State, Actions, Transition, StateWrap } from '../BaseState.js';
import { Brain } from '../../brain.js';


/* Robot state class defining the robot behavior within this state */
export class IdleAnchor extends StateWrap{
    constructor(emotionProcessor, gesturePostureProcessor, speechProcessor, brainEvents){

        /* Call the super constructor and set the identification name for the state class */
        super("idleAnchor", emotionProcessor, gesturePostureProcessor, speechProcessor, brainEvents);

        /* ToDo: This implementation has to be improved in the future. */
        /* We cannot make sure how long the animation duration of the robot arm lasts.
        Thus, we anticipate that the animation of the robot arm has been successfully
        executed after a specified time. If this is not the case the animation will
        be overridden by the following. */
        this.ANTICIPATED_ANIMATION_DURATION = 2100; /* Time duration in milliseconds. */

        this.idlingStyles = ["jawn", "look", "nap", "relax", "stretch"];

        this.timeout = null;

        /* Bind concrete implementation functions for enter and exit of the current state. */
        this.state.actions.onEnter = this.enterFunction.bind(this);

        /* Add transitions to the other states to build the graph.
        The transition is called after the state was left but before the new state is entered. */
        this.state.transitions.push(new Transition("off", "off", () => {
            console.log('transition action for "idlingBase" in "off" state');
        }));
        this.state.transitions.push(new Transition("jawn", "jawn", () => {
            console.log('transition action for "idlingBase" in "jawn" state');
        }));
        this.state.transitions.push(new Transition("look", "look", () => {
            console.log('transition action for "idlingBase" in "look" state');
        }));
        this.state.transitions.push(new Transition("nap", "nap", () => {
            console.log('transition action for "idlingBase" in "nap" state');
        }));
        this.state.transitions.push(new Transition("relax", "relax", () => {
            console.log('transition action for "idlingBase" in "relax" state');
        }));
        this.state.transitions.push(new Transition("stretch", "stretch", () => {
            console.log('transition action for "idlingBase" in "stretch" state');
        }));
    }

    /* Enter function is executed whenever the state is activated. */
    enterFunction(){
        console.log("Enter indleAnchor!");
        console.log( this.idlingStyles[0]);

        this.RoboticBody.neutral();

        var action = this.getRandomInt(0, 4);
        this.timeout = setTimeout(() => {
            /* Emit the attack state change event. */
            this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_STATE_CHANGE, "nap");
            clearTimeout(this.timeout);
        }, this.ANTICIPATED_ANIMATION_DURATION);
        
    }

    getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}