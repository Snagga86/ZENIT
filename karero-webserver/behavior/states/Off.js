import { State, Actions, Transition, StateWrap } from './BaseState.js';
import { Brain } from '../brain.js';
import logger from '../../tools/logger.js';
import globalStore from '../../tools/globals.js';

export class Off extends StateWrap{
    constructor(emotionProcessor, gesturePostureProcessor, speechProcessor, stateChangeEvent){ 
        super("off", emotionProcessor, gesturePostureProcessor, speechProcessor, stateChangeEvent);
        
        this.state.actions.onEnter = this.enterFunction.bind(this);

        this.state.transitions.push(new Transition("callToAction", "callToAction", () => {
            console.log('transition action for "off" in "callToAction" state')
        }));
        
        this.state.transitions.push(new Transition("off", "off", () => {
            console.log('transition action for "off" in "off" state')
        }));  

        this.state.transitions.push(new Transition("chatBase", "chatBase", () => {
            console.log('transition action for "off" in "chatBase" state')
        }));  
    }

    enterFunction(){
        this.stateChangeInitiated = false;
        this.timeout = setTimeout(() => {
            this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_STATE_CHANGE, "chatBase");
        }, 4000);
        
    }

}