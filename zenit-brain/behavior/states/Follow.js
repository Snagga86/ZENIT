import { State, Actions, Transition, StateWrap } from './BaseState.js';
import { Brain } from '../brain.js';
import logger from '../../tools/logger.js';
import globalStore from '../../tools/globals.js';

/* Robot state class defining the robot behavior within this state */
export class Follow extends StateWrap{
    constructor(emotionProcessor, gesturePostureProcessor, speechProcessor, brainEvents){

        /* Call the super constructor and set the identification name for the state class */
        super("follow", emotionProcessor, gesturePostureProcessor, speechProcessor, brainEvents);

        /* Bind concrete implementation functions for enter and exit of the current state. */
        this.state.actions.onEnter = this.enterFunction.bind(this);
        this.state.actions.onExit = this.exitFunction.bind(this);

        /* Add transitions to the other states to build the graph.
        The transition is called after the state was left but before the new state is entered. */
        this.state.transitions.push(new Transition("dance", "dance", () => {
            console.log('transition action for "follow" in "dance" state')
        }));
        this.state.transitions.push(new Transition("attack", "attack", () => {
            console.log('transition action for "follow" in "attack" state')
        }));
    }

    /* Enter function is executed whenever the state is activated. */
    enterFunction(){

        /* Set the payload for robot mode activation over websocket.
        mode: setMode | DataSupply
        activity: The strategy interpreted and executed by the connected robot device */
        var payload = {
            "mode" : "setMode",
            "activity" : "followHead"
        }

        /* Send the activity change to the KARERO brain. */
        this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_BODY_ACTION, payload)

        /* Add the event listener to listen on GesturePostureDetection events.
        Execute gesturePostureRecognition function on received detections. */
        this.bodyLanguageProcessor.gesturePostureEvent.on('GesturePostureDetection', this.GesturePostureDetection.bind(this));
        this.emotionProcessor.emotionEvent.on('EmotionDetection', this.emotionRecognition.bind(this));
    }

    /* Exit function is executed whenever the state is left. */
    exitFunction(){

        /* Turn off event listener if state is exited. */
        this.bodyLanguageProcessor.gesturePostureEvent.removeAllListeners('GesturePostureDetection', this.GesturePostureDetection);
        this.emotionProcessor.emotionEvent.removeAllListeners('EmotionDetection', this.emotionRecognition);
    }

    /* Interpretion function of received data coming from Azure Kinectic Space. */
    GesturePostureDetection(receivedGesture){

        /* If the arnold gesture was detected the robot changes its state to attack. */
        if(receivedGesture == "a3" || receivedGesture == "arnold2" || receivedGesture == "arnold"){

            /* Emit the attack state change event. */
            this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_STATE_CHANGE, "attack");
        }
    }

    /* Interpretion function of received data coming from Emotion Detection Algorithm. */
    emotionRecognition(receivedEmotion){
        console.log("detect emotion");
        var payload = {
            "mode" : "setEmotion",
            "data" : receivedEmotion
        }
        this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_FACE_ACTION, payload);
        /* If the ecstasy emotion was detected the robot changes it's state to dance. */
        if(receivedEmotion == "Ecstasy"){

            /* Emit the attack state change event. */
            this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_STATE_CHANGE, "dance");
        }
    }
}