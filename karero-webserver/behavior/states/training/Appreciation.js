import { State, Actions, Transition, StateWrap } from '../BaseState.js';
import { Brain } from '../../brain.js';
import logger from '../../../tools/logger.js';
import globalStore from '../../../tools/globals.js';

/* Robot state class defining the robot behavior within this state */
export class Appreciation extends StateWrap{
    constructor(emotionProcessor, gesturePostureProcessor, brainEvents){

        /* Call the super constructor and set the identification name for the state class */
        super("appreciation", emotionProcessor, gesturePostureProcessor, brainEvents);

        /* Bind concrete implementation functions for enter and exit of the current state. */
        this.state.actions.onEnter = this.enterFunction.bind(this);
        this.state.actions.onExit = this.exitFunction.bind(this);

        /* Add transitions to the other states to build the graph.
        The transition is called after the state was left but before the new state is entered. */
        this.state.transitions.push(new Transition("farewell", "farewell", () => {
            console.log('transition action for "appreciation" in "farewell" state');
        }));

        this.timeout;
    }

    /* Enter function is executed whenever the state is activated. */
    enterFunction(){

        logger(globalStore.filename, "StateChange", "Appreciation");
        /* Set the payload for robot mode activation over websocket.
        mode: setMode | DataSupply
        activity: The strategy interpreted and executed by the connected robot device */
        var payload = {
            "mode" : "setMode",
            "activity" : "followHead"
        }

        /* Send the activity change to the KARERO brain. */
        this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_BODY_ACTION, payload)

        var facePayload = {
            "mode" : "setSound",
            "data" : "nameAndPlay",
            "extra" : "appreciation"
        }

        /* Send the activity change to the KARERO brain. */
        this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_FACE_ACTION, facePayload);

        var facePayload = {
            "mode" : "setEmotion",
            "data" : "Joy"
        }
        this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_FACE_ACTION, facePayload);

        /* Add the event listener to listen on GesturePostureDetection events.
        Execute gesturePostureRecognition function on received detections. */
        this.gesturePostureProcessor.gesturePostureEvent.on('ClosestBodyDistance', this.closestBodyRecognition.bind(this));
        //this.emotionProcessor.emotionEvent.on('EmotionDetection', this.emotionRecognition.bind(this));

        this.timeout = setTimeout(() => {
            this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_STATE_CHANGE, "farewell");
        }, 7500);
    }

    /* Exit function is executed whenever the state is left. */
    exitFunction(){

        /* Turn off event listener if state is exited. */
        this.gesturePostureProcessor.gesturePostureEvent.removeAllListeners('ClosestBodyDistance', this.closestBodyRecognition);
        clearTimeout(this.timeout);
    }

    /* Interpretion function of received data coming from Azure Kinectic Space. */
    closestBodyRecognition(distance){

        /* If the arnold gesture was detected the robot changes its state to attack. */
        if(distance > globalStore.welcomeDistance){

            /* Emit the attack state change event. */
            this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_STATE_CHANGE, "farewell");
        }
    }
}