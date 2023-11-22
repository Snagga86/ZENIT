import { State, Actions, Transition, StateWrap } from '../BaseState.js';
import { Brain } from '../../brain.js';
import keypress from 'keypress';
import logger from '../../../tools/logger.js';
import globalStore from '../../../tools/globals.js';

/* Robot state class defining the robot behavior within this state */
export class PerformanceAnchor extends StateWrap{
    constructor(emotionProcessor, gesturePostureProcessor, speechProcessor, brainEvents){

        /* Call the super constructor and set the identification name for the state class */
        super("performanceAnchor", emotionProcessor, gesturePostureProcessor, speechProcessor, brainEvents);

        /* Bind concrete implementation functions for enter and exit of the current state. */
        this.state.actions.onEnter = this.enterFunction.bind(this);
        this.state.actions.onExit = this.exitFunction.bind(this);

        /* Add transitions to the other states to build the graph.
        The transition is called after the state was left but before the new state is entered. */
        this.state.transitions.push(new Transition("intermediateAward", "intermediateAward", () => {
        }));
        this.state.transitions.push(new Transition("appreciation", "appreciation", () => {
        }));
        this.state.transitions.push(new Transition("chatBase", "chatBase", () => {
        }));

        this.timeoutSquad;
        this.timeoutIntermediateMotivation;
        this.timeoutAppreciation;
        this.squadCounter = 0;

        this.utterances = [
            "Gib jetzt alles und zeig, was in dir steckt!",
            "Konzentriere dich und finde deine innere Stärke!",
            "Du hast noch Reserven, also gib nochmal alles!"
        ];

        this.breakWords = ["stop", "stoppen", "aufhören", "schluss","unterhalten"];
    }

    /* Enter function is executed whenever the state is activated. */
    enterFunction(){
        /* Add the event listener to listen on GesturePostureDetection events.
        Execute gesturePostureRecognition function on received detections. */
        this.gesturePostureProcessor.gesturePostureEvent.on('ClosestBodyDistance', this.closestBodyRecognition.bind(this));
        this.gesturePostureProcessor.gesturePostureEvent.on('GesturePostureDetection', this.gesturePostureDetection.bind(this));
        this.speechProcessor.speechEvent.on('FinalResult', this.finalResultHandler.bind(this));
        //this.emotionProcessor.emotionEvent.on('EmotionDetection', this.emotionRecognition.bind(this));

        this.intermediateMotivationTimeout();
        this.appreciationTimeout();

        this.RoboticBody.followHead();
        this.ScreenFace.emotion.neutral();
    }  

    /* Exit function is executed whenever the state is left. */
    exitFunction(){

        this.squadCounter = 0;
        /* Turn off event listener if state is exited. */
        this.gesturePostureProcessor.gesturePostureEvent.removeAllListeners('ClosestBodyDistance', this.closestBodyRecognition);
        this.gesturePostureProcessor.gesturePostureEvent.removeAllListeners('GesturePostureDetection', this.gesturePostureDetection);
        this.speechProcessor.speechEvent.removeAllListeners('FinalResult', this.finalResultHandler);
        clearTimeout(this.timeoutAppreciation);
        clearTimeout(this.timeoutIntermediateMotivation);
        clearTimeout(this.timeoutSquad);
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

    intermediateMotivationTimeout(){
        this.timeoutIntermediateMotivation = setTimeout(() => {
            var payloadTTS = {
                "mode" : "tts",
                "text" : this.utterances[Math.floor(Math.random()*this.utterances.length)]
            }
    
            this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.TEXT_TO_SPEECH_ACTION, payloadTTS);        

            this.ScreenFace.emotion.sadness();
            
            this.intermediateMotivationTimeout();
        }, 8000);
    }

    appreciationTimeout(){
        this.timeoutAppreciation = setTimeout(() => {
            this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_STATE_CHANGE, "appreciation");
        }, 24000);
    }

    squadTimeout(){
        this.timeoutSquad = setTimeout(() => {
            this.RoboticBody.followHead();
        }, 2000);
    }

    gesturePostureDetection(receivedGesture){

        console.log("receivedGesture:" + receivedGesture);
        /* If the arnold gesture was detected the robot changes its state to attack. */
        if(receivedGesture.includes("squad")){
            clearTimeout(this.timeoutAppreciation);
            clearTimeout(this.timeoutIntermediateMotivation);
            clearTimeout(this.timeoutSquad);
            
            /* Emit the attack state change event. */
            this.squadCounter++;
            logger(globalStore.filename, "Squad", this.squadCounter);    

            if(this.squadCounter < 5){
                var nv_body_payload = {
                    "mode" : "setMode",
                    "activity" : "squad"
                }

                this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_BODY_ACTION, nv_body_payload);

                var squadNumber = "";
                if(this.squadCounter == 1)squadNumber = "Eins";
                if(this.squadCounter == 2)squadNumber = "Zwei";
                if(this.squadCounter == 3)squadNumber = "Drei";
                if(this.squadCounter == 4)squadNumber = "Vier";
                if(this.squadCounter == 5)squadNumber = "Fünf";

                var payloadTTS = {
                    "mode" : "tts",
                    "text" : squadNumber
                }
        
                this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.TEXT_TO_SPEECH_ACTION, payloadTTS); 

                var nv_face_payload = {
                    "mode" : "setEmotion",
                    "data" : "neutral"
                }

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