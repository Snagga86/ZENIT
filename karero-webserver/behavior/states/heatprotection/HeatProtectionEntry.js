import { State, Actions, Transition, StateWrap } from '../BaseState.js';
import { Brain } from '../../brain.js';
import keypress from 'keypress';
import globalStore from '../../../tools/globals.js';

/* Robot state class defining the robot behavior within this state */
export class HeatProtectionEntry extends StateWrap{
    constructor(emotionProcessor, gesturePostureProcessor, speechProcessor, brainEvents){

        /* Call the super constructor and set the identification name for the state class */
        super("heatProtectionEntry", emotionProcessor, gesturePostureProcessor, speechProcessor, brainEvents);

        /* Bind concrete implementation functions for enter and exit of the current state. */
        this.state.actions.onEnter = this.enterFunction.bind(this);
        this.state.actions.onExit = this.exitFunction.bind(this);

        /* Add transitions to the other states to build the graph.
        The transition is called after the state was left but before the new state is entered. */
        this.state.transitions.push(new Transition("subtleActivation", "subtleActivation", () => {
            console.log('transition action for "heatProtectionEntry" in "subtleActivation" state')
        }));
        this.state.transitions.push(new Transition("chatBase", "chatBase", () => {
            console.log('transition action for "heatProtectionEntry" in "chatBase" state')
        }));

        this.breakWords = ["stop", "stoppen", "aufhören", "schluss","unterhalten"];

        this.timeout;
    }

    /* Enter function is executed whenever the state is activated. */
    enterFunction(){

        process.stdin.addListener('keypress', this.keyPressHandler);

        console.log("Hitzeschutzmodus Demo: Press Key 'k' to simulate critical local climate.")

        /* Add the event listener to listen on GesturePostureDetection events.
        Execute gesturePostureRecognition function on received detections. */

        this.speechProcessor.speechEvent.on('FinalResult', this.finalResultHandler.bind(this));

        this.ScreenFace.emotion.neutral();
        this.RoboticBody.followHead();
    }

    keyPressHandler = (ch, key) =>{
        if (key && key.name === 'k') {
            // 'Enter' key was pressed, react accordingly
            console.log('k key pressed');
            process.stdin.pause();
            this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_STATE_CHANGE, "subtleActivation");
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

        /* Turn off event listener if state is exited. */
        process.stdin.removeListener('keypress', this.keyPressHandler);

        // Stop listening for input
        process.stdin.pause();

        this.speechProcessor.speechEvent.removeAllListeners('FinalResult', this.finalResultHandler);
        clearTimeout(this.timeout);
    }

    finalResultHandler(result){
        if(this.containsWords(result, this.breakWords)){
            var payloadTTS = {
                "mode" : "tts",
                "text" : "Alles klar. Kein Problem!"
            }
            this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.TTS_ACTION, payloadTTS);
            this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_STATE_CHANGE, "chatBase");     
        }
    }

    containsWords(str, wordsArray) {
        // Create a regular expression pattern from the array of words
        const pattern = new RegExp(wordsArray.join('|'), 'i');
      
        // Test if the string contains any of the words
        return pattern.test(str);
    }
}