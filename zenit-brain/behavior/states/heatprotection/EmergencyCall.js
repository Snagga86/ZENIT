import { State, Actions, Transition, StateWrap } from '../BaseState.js';
import { Brain } from '../../brain.js';
import keypress from 'keypress';
import globalStore from '../../../tools/globals.js';

/* Robot state class defining the robot behavior within this state */
export class EmergencyCall extends StateWrap{
    constructor(emotionProcessor, gesturePostureProcessor, speechProcessor, brainEvents){

        /* Call the super constructor and set the identification name for the state class */
        super("emergencyCall", emotionProcessor, gesturePostureProcessor, speechProcessor, brainEvents);

        /* Bind concrete implementation functions for enter and exit of the current state. */
        this.state.actions.onEnter = this.enterFunction.bind(this);
        this.state.actions.onExit = this.exitFunction.bind(this);

        /* Add transitions to the other states to build the graph.
        The transition is called after the state was left but before the new state is entered. */
        this.state.transitions.push(new Transition("chatBase", "chatBase", () => {
        }));

        this.utterances = [];
        this.breakWords = ["stop", "stoppen", "aufhören", "schluss","unterhalten"];

        this.timeout;
        keypress(process.stdin);
    }

    /* Enter function is executed whenever the state is activated. */
    enterFunction(){

        var facePayload = {
            "mode" : "setEmotion",
            "data" : "neutral"
        }
        this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_FACE_ACTION, facePayload);

        /* Add the event listener to listen on GesturePostureDetection events.
        Execute gesturePostureRecognition function on received detections. */

        this.gesturePostureProcessor.gesturePostureEvent.on('ClosestBodyDistance', this.closestBodyRecognition.bind(this));
        this.brainEvents.on(Brain.ROBOT_BRAIN_EVENTS.NEW_CHAT_DURATION, this.newChatDurationCalculatedHandler.bind(this));
        this.speechProcessor.speechEvent.on('FinalResult', this.finalResultHandler.bind(this));

        var payloadTTS = {
            "mode" : "tts",
            "text" : this.utterances[Math.floor(Math.random()*this.utterances.length)]
        }

        this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.TEXT_TO_SPEECH_ACTION, payloadTTS);
    }

    /*keyPressHandler = (ch, key) =>{
        if (key && key.name === 'a') {
            // 'Enter' key was pressed, react accordingly
            console.log('a key pressed');
            process.stdin.pause();
            this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_STATE_CHANGE, "briefingForExercise");
            // You can perform other actions here
        } else if (key && key.ctrl && key.name === 'c') {
            // Ctrl + C was pressed, exit the program
            process.exit();
        } else {
            // Other key presses
            console.log(`Key pressed: ${ch}`);
        }
        console.log('Press Enter or any other key (Ctrl + C to exit):');
    }*/

    /* Exit function is executed whenever the state is left. */
    exitFunction(){

        /* Turn off event listener if state is exited. */
        //process.stdin.removeListener('keypress', this.keyPressHandler);

        // Stop listening for input
        //process.stdin.pause();
        this.gesturePostureProcessor.gesturePostureEvent.removeAllListeners('ClosestBodyDistance', this.closestBodyRecognition);
        this.brainEvents.removeAllListeners(Brain.ROBOT_BRAIN_EVENTS.NEW_CHAT_DURATION, this.newChatDurationCalculatedHandler);
        this.speechProcessor.speechEvent.removeAllListeners('FinalResult', this.finalResultHandler);
        clearTimeout(this.timeout);
    }

    finalResultHandler(result){
        console.log("tts result:" + result);

        if(this.containsWords(result, this.breakWords)){
            var payloadTTS = {
                "mode" : "tts",
                "text" : "Alles klar. Kein Problem!"
            }
            this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.TEXT_TO_SPEECH_ACTION, payloadTTS);
            this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_STATE_CHANGE, "chatBase");     
        }
    }

    containsWords(str, wordsArray) {
        // Create a regular expression pattern from the array of words
        const pattern = new RegExp(wordsArray.join('|'), 'i');
      
        // Test if the string contains any of the words
        return pattern.test(str);
    }

    newChatDurationCalculatedHandler(duration){
        this.timeout = setTimeout(() => {
            this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_STATE_CHANGE, "briefingForExercise");
        }, duration * 1000);
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