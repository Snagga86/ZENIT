import { State, Actions, Transition, StateWrap } from './BaseState.js';
import { Brain } from '../brain.js';
import keypress from 'keypress';
import logger from '../../tools/logger.js';
import globalStore from '../../tools/globals.js';

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

        this.timeoutSquad;
        this.timeoutIntermediateMotivation;
        this.timeoutAppreciation;
        this.squadCounter = 0;

        keypress(process.stdin);
    }

    /* Enter function is executed whenever the state is activated. */
    enterFunction(){

        logger(globalStore.filename, "StateChange", "PerformanceAnchor");
        /* Add the event listener to listen on GesturePostureDetection events.
        Execute gesturePostureRecognition function on received detections. */
        this.gesturePostureProcessor.gesturePostureEvent.on('ClosestBodyDistance', this.closestBodyRecognition.bind(this));
        this.gesturePostureProcessor.gesturePostureEvent.on('GesturePostureDetection', this.gesturePostureDetection.bind(this));
        //this.emotionProcessor.emotionEvent.on('EmotionDetection', this.emotionRecognition.bind(this));

        this.intermediateMotivationTimeout();
        this.appreciationTimeout();

        var nv_body_payload = {
            "mode" : "setMode",
            "activity" : "followHead"
        }

        /* Send the activity change to the KARERO brain. */
        this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_BODY_ACTION, nv_body_payload);
    
        var nv_face_payload = {
            "mode" : "setEmotion",
            "data" : "Idle1"
        }
        this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_FACE_ACTION, nv_face_payload);

        process.stdin.on('keypress', this.keyPressHandler);
        process.stdin.resume();
    }  


    keyPressHandler = (ch, key) =>{
        if (key && key.name === 'a') {
            // 'Enter' key was pressed, react accordingly
            console.log('a key pressed');
            this.gesturePostureDetection("squad");
            // You can perform other actions here
        } else if (key && key.ctrl && key.name === 'c') {
            // Ctrl + C was pressed, exit the program
            process.exit();
        } else {
            // Other key presses
            console.log(`Key pressed: ${ch}`);
        }
        console.log('Press Enter or any other key (Ctrl + C to exit):');
    }

    /* Exit function is executed whenever the state is left. */
    exitFunction(){

        process.stdin.removeListener('keypress', this.keyPressHandler);
        process.stdin.pause();
        /* Turn off event listener if state is exited. */
        this.gesturePostureProcessor.gesturePostureEvent.removeAllListeners('ClosestBodyDistance', this.closestBodyRecognition);
        this.gesturePostureProcessor.gesturePostureEvent.removeAllListeners('GesturePostureDetection', this.gesturePostureDetection);
        clearTimeout(this.timeoutAppreciation);
        clearTimeout(this.timeoutIntermediateMotivation);
        clearTimeout(this.timeoutSquad);
    }

    intermediateMotivationTimeout(){
        this.timeoutIntermediateMotivation = setTimeout(() => {
            var facePayload = {
                "mode" : "setSound",
                "data" : "nameAndPlay",
                "extra" : "intermediate-motivation"
            }
    
            /* Send the activity change to the KARERO brain. */
            if(globalStore.communicationLevel != "only_nonverbal"){
                this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_FACE_ACTION, facePayload);
            }
            

            var facePayload = {
                "mode" : "setEmotion",
                "data" : "Sadness"
            }

            if(globalStore.communicationLevel != "only_verbal"){
                this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_FACE_ACTION, facePayload);
            }
            this.intermediateMotivationTimeout();
            logger(globalStore.filename, "IntermediateMotivation", "none");
        }, 7000);
    }

    appreciationTimeout(){
        this.timeoutAppreciation = setTimeout(() => {
            this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_STATE_CHANGE, "appreciation");
        }, 18000);
    }

    squadTimeout(){
        this.timeoutSquad = setTimeout(() => {
            var payload = {
                "mode" : "setMode",
                "activity" : "followHead"
            }
            this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_BODY_ACTION, payload);
        }, 2500);
    }

    gesturePostureDetection(receivedGesture){

        /* If the arnold gesture was detected the robot changes its state to attack. */
        if(receivedGesture == "squad"){
            clearTimeout(this.timeoutAppreciation);
            clearTimeout(this.timeoutIntermediateMotivation);
            clearTimeout(this.timeoutSquad);
            
            /* Emit the attack state change event. */
            this.squadCounter++;
            logger(globalStore.filename, "Squad", this.squadCounter);
            var nv_body_payload = {
                "mode" : "setMode",
                "activity" : "squad"
            }

            if(globalStore.communicationLevel != "only_verbal"){
                this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_BODY_ACTION, nv_body_payload);
            }

            var v_face_payload = {
                "mode" : "setSound",
                "data" : "nameAndPlay",
                "extra" : this.squadCounter
            }
    
            if(globalStore.communicationLevel != "only_nonverbal"){
                this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_FACE_ACTION, v_face_payload);
            }

            var nv_face_payload = {
                "mode" : "setEmotion",
                "data" : "Idle1"
            }

            if(globalStore.communicationLevel != "only_verbal"){
                this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_FACE_ACTION, nv_face_payload);
            }

            this.intermediateMotivationTimeout();
            this.appreciationTimeout();

            this.squadTimeout();
        }

        if(this.squadCounter >= 5){
            this.squadCounter = 0;
            this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_STATE_CHANGE, "intermediateAward");
        }


    }

    /* Interpretion function of received data coming from Azure Kinectic Space. */
    closestBodyRecognition(distance){

        /* If the arnold gesture was detected the robot changes its state to attack. */
        if(distance > globalStore.welcomeDistance){

            /* Emit the attack state change event. */
            this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_STATE_CHANGE, "appreciation");
        }
    }
}