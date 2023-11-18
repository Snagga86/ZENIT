import { State, Actions, Transition, StateWrap } from './BaseState.js';
import { Brain } from '../brain.js';
import logger from '../../tools/logger.js';
import globalStore from '../../tools/globals.js';

/* Robot state class defining the robot behavior within this state */
export class CallToAction extends StateWrap{
    constructor(chatProcessor, emotionProcessor, gesturePostureProcessor, speechProcessor, brainEvents){

        /* Call the super constructor and set the identification name for the state class */
        super("callToAction", emotionProcessor, gesturePostureProcessor, speechProcessor, brainEvents);

        /* Bind concrete implementation functions for enter and exit of the current state. */
        this.state.actions.onEnter = this.enterFunction.bind(this);
        this.state.actions.onExit = this.exitFunction.bind(this);

        this.chatProcessor = chatProcessor;

        /* Add transitions to the other states to build the graph.
        The transition is called after the state was left but before the new state is entered. */
        this.state.transitions.push(new Transition("chatBase", "chatBase", () => {
            console.log('transition action for "callToAction" in "chatBase" state')
        }));

        this.timeout;
    }

    /* Enter function is executed whenever the state is activated. */
    enterFunction(){

        /* Set the payload for robot mode activation over websocket.
        mode: setMode | DataSupply
        activity: The strategy interpreted and executed by the connected robot device */

        /* Add the event listener to listen on GesturePostureDetection events.
        Execute gesturePostureRecognition function on received detections. */
        this.gesturePostureProcessor.gesturePostureEvent.on('ClosestBodyDistance', this.closestBodyRecognition.bind(this));
        //this.emotionProcessor.emotionEvent.on('EmotionDetection', this.emotionRecognition.bind(this));
        this.ScreenFace.emotion.neutral();
        this.followHead();
    }

    /* Exit function is executed whenever the state is left. */
    exitFunction(){

        this.chatProcessor.sendMessage("/greet");
        /* Turn off event listener if state is exited. */
        this.gesturePostureProcessor.gesturePostureEvent.removeAllListeners('ClosestBodyDistance', this.closestBodyRecognition);
        clearTimeout(this.timeout);
        //this.emotionProcessor.emotionEvent.removeAllListeners('EmotionDetection', this.emotionRecognition);
    }

    /* Interpretion function of received data coming from Azure Kinectic Space. */
    closestBodyRecognition(distance){
        /* If the arnold gesture was detected the robot changes its state to attack. */
        if(distance <= globalStore.welcomeDistance){

            /* Emit the attack state change event. */
            this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_STATE_CHANGE, "chatBase");
        }
    }

    seekAttention(){
        this.RoboticBody.seekAttantion();

        this.timeout = setTimeout(() => {
            this.followHead();
        }, 4500);
    }

    followHead(){
        this.RoboticBody.followHead();

        this.timeout = setTimeout(() => {
            this.seekAttention();
        }, 7000);
    }
}