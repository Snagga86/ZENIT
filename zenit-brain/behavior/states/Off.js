import { State, Actions, Transition, StateWrap } from './BaseState.js';
import { Brain } from '../brain.js';
import logger from '../../tools/logger.js';
import globalStore from '../../tools/globals.js';
import readline from 'readline';

export class Off extends StateWrap{
    constructor(emotionProcessor, gesturePostureProcessor, speechProcessor, stateChangeEvent){ 
        super("off", emotionProcessor, gesturePostureProcessor, speechProcessor, stateChangeEvent);
        
        this.state.actions.onEnter = this.enterFunction.bind(this);
        this.state.actions.onExit = this.exitFunction.bind(this);

        this.state.transitions.push(new Transition("idleAnchor", "idleAnchor", () => {
            console.log('transition action for "off" in "idleAnchor" state')
        }));

        this.state.transitions.push(new Transition("llmBase", "llmBase", () => {
            console.log('transition action for "off" in "llmBase"')
        }));
    }

    /* Enter function is executed whenever the state is activated. */
    enterFunction() {
        readline.emitKeypressEvents(process.stdin);
        if (process.stdin.isTTY) {
            process.stdin.setRawMode(true);
        }

        this.keypressHandler = this.keypressHandler.bind(this);

        console.log("Press 's' to start procedure");

        // Listen for keypress events
        process.stdin.on('keypress', this.keypressHandler);
    }

    exitFunction() {
        // Turn off event listener if state is exited.
        process.stdin.removeListener('keypress', this.keypressHandler);

        // Optionally, reset raw mode if needed
        if (process.stdin.isTTY) {
            process.stdin.setRawMode(false);
        }
    }

    keypressHandler(str, key) {
        console.log("pressed");
        if (key.name === 's') {
            console.log("s pressed");
            this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_STATE_CHANGE, "llmBase");
        }

        // Exit on Ctrl+C or Ctrl+D
        if (key.ctrl && (key.name === 'c' || key.name === 'd')) {
            console.log('Exiting...');
            process.exit();
        }
    }
}