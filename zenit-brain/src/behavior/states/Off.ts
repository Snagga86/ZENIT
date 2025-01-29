import { StateController, Actions, Transition, ZENITState } from './zenit-state.js';
import { Brain } from '../brain.js';
import readline from 'readline';
import { PhoneCamProcessor } from '../processors/phone-cam-processor.js';
import { BodyLanguageProcessor } from '../processors/body-language-processor.js';
import { SpeechProcessor } from '../processors/speech-processor.js';

export class Off extends ZENITState{

    constructor(emotionProcessor : PhoneCamProcessor, gesturePostureProcessor : BodyLanguageProcessor, speechProcessor : SpeechProcessor, stateChangeEvent : any){ 
        super("off", emotionProcessor, gesturePostureProcessor, speechProcessor, stateChangeEvent);
        
        this.state.actions.onEnter = this.enterFunction.bind(this);
        this.state.actions.onExit = this.exitFunction.bind(this);

        this.state.transitions.push(new Transition("idleAnchor", "idleAnchor", () => {
            console.log('transition action for "off" in "idleAnchor" state')
        }));
        this.state.transitions.push(new Transition("talkative", "talkative", () => {
            console.log('transition action for "off" in "talkative" state')
        }));
        this.state.transitions.push(new Transition("followHead", "followHead", () => {
            console.log('transition action for "off" in "followHead" state')
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
                this.speechProcessor.resume();
        // Optionally, reset raw mode if needed
        if (process.stdin.isTTY) {
            process.stdin.setRawMode(false);
        }
    }

    keypressHandler(str : any, key : any) {
        console.log("pressed");
        if (key.name === 's') {
            console.log("s pressed");
            this.brainEvents?.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_STATE_CHANGE, "talkative");
        }

        // Exit on Ctrl+C or Ctrl+D
        if (key.ctrl && (key.name === 'c' || key.name === 'd')) {
            console.log('Exiting...');
            process.exit();
        }
    }
}