import { State, Actions, Transition, StateWrap } from '../BaseState.js';
import { Brain } from '../../brain.js';
import keypress from 'keypress';
import globalStore from '../../../tools/globals.js';
import { FunctionScheduler } from '../../../tools/functionScheduler.js';

/* Robot state class defining the robot behavior within this state */
export class SubtleActivation extends StateWrap{
    constructor(emotionProcessor, gesturePostureProcessor, speechProcessor, brainEvents){

        /* Call the super constructor and set the identification name for the state class */
        super("subtleActivation", emotionProcessor, gesturePostureProcessor, speechProcessor, brainEvents);

        /* Bind concrete implementation functions for enter and exit of the current state. */
        this.state.actions.onEnter = this.enterFunction.bind(this);
        this.state.actions.onExit = this.exitFunction.bind(this);

        /* Add transitions to the other states to build the graph.
        The transition is called after the state was left but before the new state is entered. */
        this.state.transitions.push(new Transition("explicitActivation", "explicitActivation", () => {
        }));
        this.state.transitions.push(new Transition("heatProtectionEntry", "heatProtectionEntry", () => {
        }));

        this.drinkingDetected = false;
        this.drinkingMotivationAttempts = 0;
        this.MAX_DRINKING_MOTIVATION_ATTEMPTS = 3;

        this.timerSchedule = [];
    }

    /* Enter function is executed whenever the state is activated. */
    enterFunction(){
        
        process.stdin.addListener('keypress', this.keyPressHandler);

        this.drinkingDetected = false;
        this.ScreenFace.emotion.neutral();
        this.animationSchedule();
    }

    animationSchedule(){    
        this.timerSchedule.push(setTimeout(() => {this.ScreenFace.emotion.hot()}, 100));
        this.timerSchedule.push(setTimeout(() => {this.RoboticBody.sadness()}, 15000));
        this.timerSchedule.push(setTimeout(() => {this.RoboticBody.followHead()}, 25000));
        this.timerSchedule.push(setTimeout(() => {this.ScreenFace.emotion.thirsty()}, 35000));
        this.timerSchedule.push(setTimeout(() => {this.ScreenFace.sound.nameAndPlay("drinking")}, 37000));
        this.timerSchedule.push(setTimeout(() => {this.ScreenFace.emotion.neutral()}, 55000));
        this.timerSchedule.push(setTimeout(() => {this.RoboticBody.followHead()}, 60000));
        this.timerSchedule.push(setTimeout(() => {this.schedulerCallback()}, 60000));
    }

    animationReset(){
        var i = 0;
        while(i < this.timerSchedule.length){
            clearTimeout(this.timerSchedule[i]);
            i++;
        }
    }

    schedulerCallback(){
        this.animationReset();
        this.drinkingMotivationAttempts++;
        if(this.drinkingMotivationAttempts > this.MAX_DRINKING_MOTIVATION_ATTEMPTS){
            this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_STATE_CHANGE, "explicitActivation");
        }
        else{
            if(this.drinkingDetected == false){
                this.animationSchedule();
            }
            else{
                this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_STATE_CHANGE, "heatProtectionEntry");
            }
        }
    }

    /* Exit function is executed whenever the state is left. */
    exitFunction(){

        /* Turn off event listener if state is exited. */
        process.stdin.removeListener('keypress', this.keyPressHandler);

        // Stop listening for input
        process.stdin.pause();
    }
    
    keyPressHandler = (ch, key) =>{
        if (key && key.name === 'g') {
            // 'Enter' key was pressed, react accordingly
            console.log('g key pressed');
            process.stdin.pause();
            this.drinkingDetected = true;
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
}