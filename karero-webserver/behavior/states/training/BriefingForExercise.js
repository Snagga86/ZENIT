import { State, Actions, Transition, StateWrap } from '../BaseState.js';
import { Brain } from '../../brain.js';
import logger from '../../../tools/logger.js';
import globalStore from '../../../tools/globals.js';

/* Robot state class defining the robot behavior within this state */
export class BriefingForExercise extends StateWrap{
    constructor(emotionProcessor, gesturePostureProcessor, speechProcessor, brainEvents){

        /* Call the super constructor and set the identification name for the state class */
        super("briefingForExercise", emotionProcessor, gesturePostureProcessor, speechProcessor, brainEvents);

        /* Bind concrete implementation functions for enter and exit of the current state. */
        this.state.actions.onEnter = this.enterFunction.bind(this);
        this.state.actions.onExit = this.exitFunction.bind(this);

        /* Add transitions to the other states to build the graph.
        The transition is called after the state was left but before the new state is entered. */
        this.state.transitions.push(new Transition("performanceAnchor", "performanceAnchor", () => {
            console.log('transition action for "briefingForExercise" in "performanceAnchor" state')
        }));
        this.state.transitions.push(new Transition("farewell", "farewell", () => {
            console.log('transition action for "BriefingForExercise" in "farewell" state')
        }));

        this.utterances = [
            "Breitbeinig stehen, Knie beugen, Hüfte nach hinten und in die Hocke, dann kraftvoll hochkommen und Beine strecken. Wir machen 5 Wiederholungen und starten in 5, 4, 3, 2, 1, Los!",
            "Breiter Stand, Knie beugen, Hüfte nach hinten und in die Hocke gehen, dann wieder hochdrücken. Das Ganze 5 mal. Wir machen 5 Wiederholungen und starten in 5, 4, 3, 2, 1, Los!",
            "Beine schulterbreit, Knie beugen und Hüfte nach hinten, dann in die Hocke gehen. Dann die Beine strecken und aufrichten. Wir machen 5 Wiederholungen und starten in 5, 4, 3, 2, 1, Los!"
        ];

        this.timeout;
        this.videoTimeout;
    }

    /* Enter function is executed whenever the state is activated. */
    enterFunction(){

        logger(globalStore.filename, "StateChange", "BriefingForExercise");
        /* Set the payload for robot mode activation over websocket.
        mode: setMode | DataSupply
        activity: The strategy interpreted and executed by the connected robot device */

        var facePayload = {
            "mode" : "setSound",
            "data" : "nameAndPlay",
            "extra" : "briefing-exercises"
        }

        /* Send the activity change to the KARERO brain. */
        this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_FACE_ACTION, facePayload);

        var facePayload = {
            "mode" : "setVideo",
            "data" : "showAndPlay",
            "extra" : "squads"
        }

        /* Send the activity change to the KARERO brain. */
        this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_FACE_ACTION, facePayload);

        /* Add the event listener to listen on GesturePostureDetection events.
        Execute gesturePostureRecognition function on received detections. */
        this.gesturePostureProcessor.gesturePostureEvent.on('ClosestBodyDistance', this.closestBodyRecognition.bind(this));

        this.brainEvents.on(Brain.ROBOT_BRAIN_EVENTS.NEW_CHAT_DURATION, this.newChatDurationCalculatedHandler.bind(this));
        
        var payloadTTS = {
            "mode" : "tts",
            "text" : this.utterances[Math.floor(Math.random()*this.utterances.length)]
        }

        this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.TTS_ACTION, payloadTTS);
    }

    /* Exit function is executed whenever the state is left. */
    exitFunction(){

        /* Turn off event listener if state is exited. */
        this.gesturePostureProcessor.gesturePostureEvent.removeAllListeners('ClosestBodyDistance', this.closestBodyRecognition);
        this.brainEvents.removeAllListeners(Brain.ROBOT_BRAIN_EVENTS.NEW_CHAT_DURATION, this.newChatDurationCalculatedHandler);
        clearTimeout(this.timeout);
        clearTimeout(this.videoTimeout);
    }

    newChatDurationCalculatedHandler(duration){
        this.timeout = setTimeout(() => {
            var facePayload = {
                "mode" : "setVideo",
                "data" : "stopAndHide"
            }
    
            /* Send the activity change to the KARERO brain. */
            this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_FACE_ACTION, facePayload);
            this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_STATE_CHANGE, "performanceAnchor");
        }, duration * 1000);
    }

    /* Interpretion function of received data coming from Azure Kinectic Space. */
    closestBodyRecognition(distance){

        /* If the arnold gesture was detected the robot changes its state to attack. */
        if(distance > globalStore.welcomeDistance){
            var facePayload = {
                "mode" : "setVideo",
                "data" : "stopAndHide"
            }
    
            /* Send the activity change to the KARERO brain. */
            this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_FACE_ACTION, facePayload)
            /* Emit the attack state change event. */
            this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_STATE_CHANGE, "farewell");
        }
    }
}