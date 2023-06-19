import { State, Actions, Transition, StateWrap } from './BaseState.js';
import { Brain } from '../brain.js';

/* Robot state class defining the robot behavior within this state */
export class PerformanceAnchor extends StateWrap{
    constructor(emotionProcessor, gesturePostureProcessor, brainEvents){

        /* Call the super constructor and set the identification name for the state class */
        super("performanceAnchor", emotionProcessor, gesturePostureProcessor, brainEvents);

        /* Bind concrete implementation functions for enter and exit of the current state. */
        this.state.actions.onEnter = this.enterFunction.bind(this);
        this.state.actions.onExit = this.exitFunction.bind(this);

        /* Add transitions to the other states to build the graph.
        The transition is called after the state was left but before the new state is entered. */
        this.state.transitions.push(new Transition("intermediateAward", "intermediateAward", () => {
        }));
        this.state.transitions.push(new Transition("appreciation", "appreciation", () => {
        }));

        this.timeout;
        this.timeoutIntermediateMotivation;
        this.squadCounter = 0;
    }

    /* Enter function is executed whenever the state is activated. */
    enterFunction(){


        /* Add the event listener to listen on GesturePostureDetection events.
        Execute gesturePostureRecognition function on received detections. */
        this.gesturePostureProcessor.gesturePostureEvent.on('ClosestBodyDistance', this.closestBodyRecognition.bind(this));
        this.gesturePostureProcessor.gesturePostureEvent.on('GesturePostureDetection', this.gesturePostureDetection.bind(this));
        //this.emotionProcessor.emotionEvent.on('EmotionDetection', this.emotionRecognition.bind(this));

        this.timeout = setTimeout(() => {
            this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_STATE_CHANGE, "appreciation");
        }, 15000);

        this.timeoutIntermediateMotivation = setTimeout(() => {
            var facePayload = {
                "mode" : "setSound",
                "data" : "nameAndPlay",
                "extra" : "intermediate-motivation"
            }
    
            /* Send the activity change to the KARERO brain. */
            this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_FACE_ACTION, facePayload)
        }, 5000);
    }

    /* Exit function is executed whenever the state is left. */
    exitFunction(){

        /* Turn off event listener if state is exited. */
        this.gesturePostureProcessor.gesturePostureEvent.removeAllListeners('ClosestBodyDistance', this.closestBodyRecognition);
        this.gesturePostureProcessor.gesturePostureEvent.removeAllListeners('GesturePostureDetection', this.gesturePostureDetection);
        clearTimeout(this.timeout);
        clearTimeout(this.timeoutIntermediateMotivation);
    }

    gesturePostureDetection(receivedGesture){

        /* If the arnold gesture was detected the robot changes its state to attack. */
        if(receivedGesture == "squad"){
            this.timeout.clear();
            this.timeout = setTimeout(() => {
                this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_STATE_CHANGE, "appreciation");
            }, 15000);
            /* Emit the attack state change event. */
            this.squadCounter++;
            var payload = {
                "mode" : "setMode",
                "activity" : "squad"
            }
            this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_BODY_ACTION, payload);

            var facePayload = {
                "mode" : "setSound",
                "data" : "nameAndPlay",
                "extra" : this.squadCounter
            }
    
            /* Send the activity change to the KARERO brain. */
            this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_FACE_ACTION, facePayload)
        }
        if(this.squadCounter >= 5){
            this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_STATE_CHANGE, "intermediateAward");
        }
    }

    /* Interpretion function of received data coming from Azure Kinectic Space. */
    closestBodyRecognition(distance){

        /* If the arnold gesture was detected the robot changes its state to attack. */
        if(distance > 1.5){

            /* Emit the attack state change event. */
            this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_STATE_CHANGE, "farewell");
        }
    }
}