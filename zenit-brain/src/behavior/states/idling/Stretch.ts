import { State, Actions, Transition, StateWrap } from '../BaseState.js';
import { Brain } from '../../brain.js';
import { EventEmitter } from 'stream';
import { EmotionProcessor } from '../../processors/emotion-processor.js';
import { BodyLanguageProcessor } from '../../processors/body-language-processor.js';
import { SpeechProcessor } from '../../processors/speech-processor.js';


/* Robot state class defining the robot behavior within this state */
export class Stretch extends StateWrap{

    ANTICIPATED_ANIMATION_DURATION : number;
    timeout : NodeJS.Timeout | null;

    constructor(emotionProcessor : EmotionProcessor, bodyLanguageProcessor : BodyLanguageProcessor, speechProcessor : SpeechProcessor, brainEvents : EventEmitter){

        /* Call the super constructor and set the identification name for the state class */
        super("stretch", emotionProcessor, bodyLanguageProcessor,speechProcessor, brainEvents);


        /* ToDo: This implementation has to be improved in the future. */
        /* We cannot make sure how long the animation duration of the robot arm lasts.
        Thus, we anticipate that the animation of the robot arm has been successfully
        executed after a specified time. If this is not the case the animation will
        be overridden by the following. */
        this.ANTICIPATED_ANIMATION_DURATION = 6500; /* Time duration in milliseconds. */

        this.timeout = null;

        /* Bind concrete implementation functions for enter and exit of the current state. */
        this.state.actions.onEnter = this.enterFunction.bind(this);

        /* Add transitions to the other states to build the graph.
        The transition is called after the state was left but before the new state is entered. */
        this.state.transitions.push(new Transition("idlingBase", "idlingBase", () => {
            console.log('transition action for "stretch" in "idlingBase" state');
        }));
    }

    /* Enter function is executed whenever the state is activated. */
    enterFunction(){

        /* Set the payload for robot mode activation over websocket.
        mode: setMode | DataSupply
        activity: The strategy interpreted and executed by the connected robot device */

        this.ScreenFace.emotion.rage();
        this.RoboticBody.anger();

        /* Go back to follow state after the anticipated execution time of attack. */
        this.timeout = setTimeout(() => {
            /* Emit the attack state change event. */
            this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_STATE_CHANGE, "idlingBase");
            clearTimeout(this.timeout as NodeJS.Timeout);
        }, this.ANTICIPATED_ANIMATION_DURATION);
    }
}