import { State, Actions, Transition, StateWrap } from './BaseState.js';
import { Brain } from '../brain.js';
import logger from '../../tools/logger.js';
import globalStore from '../../tools/globals.js';

export class Off extends StateWrap{
    constructor(emotionProcessor, gesturePostureProcessor, stateChangeEvent){ 
        super("off", emotionProcessor, gesturePostureProcessor, stateChangeEvent);
        
        this.state.actions.onEnter = this.enterFunction.bind(this);

        this.state.transitions.push(new Transition("callToAction", "callToAction", () => {
            console.log('transition action for "off" in "callToAction" state')
        }));
        
        this.state.transitions.push(new Transition("off", "off", () => {
            console.log('transition action for "off" in "off" state')
        }));  
    }

    enterFunction(){
        this.stateChangeInitiated = false;
        console.log('off: onEnter')
        this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_STATE_CHANGE, "callToAction");
    }

}