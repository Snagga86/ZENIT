import { State, Actions, Transition, StateWrap } from './BaseState.js';
import { Brain } from '../brain.js';
import logger from '../../tools/logger.js';
import globalStore from '../../tools/globals.js';

/* Robot state class defining the robot behavior within this state */
export class IntermediateAward extends StateWrap{
    constructor(emotionProcessor, gesturePostureProcessor, brainEvents){

        /* Call the super constructor and set the identification name for the state class */
        super("intermediateAward", emotionProcessor, gesturePostureProcessor, brainEvents);


        /* ToDo: This implementation has to be improved in the future. */
        /* We cannot make sure how long the animation duration of the robot arm lasts.
        Thus, we anticipate that the animation of the robot arm has been successfully
        executed after a specified time. If this is not the case the animation will
        be overridden by the following. */
        this.ANTICIPATED_ANIMATION_DURATION = 4000; /* Time duration in milliseconds. */

        this.timeout = null;

        /* Bind concrete implementation functions for enter and exit of the current state. */
        this.state.actions.onEnter = this.enterFunction.bind(this);

        /* Add transitions to the other states to build the graph.
        The transition is called after the state was left but before the new state is entered. */
        this.state.transitions.push(new Transition("performanceAnchor", "performanceAnchor", () => {
        }));
    }

    /* Enter function is executed whenever the state is activated. */
    enterFunction(){

        logger(globalStore.filename, "StateChange", "IntermediateAward");
        /* Set the payload for robot mode activation over websocket.
        mode: setMode | DataSupply
        activity: The strategy interpreted and executed by the connected robot device */
        var v_face_payload = {
            "mode" : "setSound",
            "data" : "nameAndPlay",
            "extra" : "intermediate-award"
        }
        if(globalStore.currentCommunicationLevel != "only_nonverbal"){
            this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_FACE_ACTION, v_face_payload);
        }

        var nv_body_payload = {
            "mode" : "setMode",
            "activity" : "dance"
        }

        /* Send the activity change to the KARERO brain. */
        if(globalStore.currentCommunicationLevel != "only_verbal"){
            this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_BODY_ACTION, nv_body_payload);
        }

        var nv_face_payload = {
            "mode" : "setEmotion",
            "data" : "Ecstasy"
        }

        if(globalStore.currentCommunicationLevel != "only_verbal"){
            this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_FACE_ACTION, nv_face_payload);
        }

        /* Go back to follow state after the anticipated execution time of attack. */
        this.timeout = setTimeout(() => {
            /* Emit the attack state change event. */
            this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_STATE_CHANGE, "performanceAnchor");
            clearTimeout(this.timeout);
        }, this.ANTICIPATED_ANIMATION_DURATION);
    }

    exitFunction(){

        /* Turn off event listener if state is exited. */
        clearTimeout(this.timeout);
    }
}