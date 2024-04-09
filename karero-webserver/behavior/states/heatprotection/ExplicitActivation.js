import { State, Actions, Transition, StateWrap } from '../BaseState.js';
import { Brain } from '../../brain.js';
import keypress from 'keypress';
import globalStore from '../../../tools/globals.js';

/* Robot state class defining the robot behavior within this state */
export class ExplicitActivation extends StateWrap{
    constructor(emotionProcessor, gesturePostureProcessor, speechProcessor, brainEvents){

        /* Call the super constructor and set the identification name for the state class */
        super("explicitActivation", emotionProcessor, gesturePostureProcessor, speechProcessor, brainEvents);

        /* Bind concrete implementation functions for enter and exit of the current state. */
        this.state.actions.onEnter = this.enterFunction.bind(this);
        this.state.actions.onExit = this.exitFunction.bind(this);

        /* Add transitions to the other states to build the graph.
        The transition is called after the state was left but before the new state is entered. */
        this.state.transitions.push(new Transition("subtleActivation", "subtleActivation", () => {
        }));
        this.state.transitions.push(new Transition("informHelp", "informHelp", () => {
        }));

        this.utterancesDrinking = ["Heute ist es wirklich heiss. Hast du schon etwas getrunken?",
                           "Bitte nicht dehydrieren. Hast du genug Flüssigkeit zu dir genommen?",
                           "Es ist heiß draußen. Trinkst du regelmäßig etwas, um nicht auszutrocknen?",
                           "Heute ist es echt warm. Bist du sicher, dass du genug getrunken hast?"];
                           
        this.utterancesVideo = ["Ich habe eine Nachricht von Katja für dich. Ich spiele sie für dich ab!",
        "Katja hat eine Nachricht für dich hinterlassen. Die Wiedergabe ist bereit.",
        "Katja hat eine Nachricht für dich hinterlassen. Ich spiele sie für dich ab."];
    
        this.confirmWords = ["ja", "selbstverständlich", "natürlich", "klar"];

        this.readyForSpeechTO;
        this.closeSpeechInputWindowTO;

        this.drinkingDetected = false;
        this.drinkingMotivationAttempts = 0;
        this.MAX_DRINKING_MOTIVATION_ATTEMPTS = 0;

        this.timerSchedule = [];
    }

    /* Enter function is executed whenever the state is activated. */
    enterFunction(){
        this.drinkingMotivationAttempts = 0;
        this.drinkingDetected = false;
        this.ScreenFace.emotion.neutral();
        this.RoboticBody.followHead();  
        this.animationSchedule();
    }

    animationSchedule(){
        this.animationReset();
        clearTimeout(this.readyForSpeechTO);
        clearTimeout(this.closeSpeechInputWindowTO);
        this.timerSchedule.push(setTimeout(() => {this.drinkMotivationSpeech()}, 100));
        this.timerSchedule.push(setTimeout(() => {this.ScreenFace.emotion.hot()}, 15000));
        this.timerSchedule.push(setTimeout(() => {this.ScreenFace.emotion.neutral()}, 35000));
        this.timerSchedule.push(setTimeout(() => {this.ScreenFace.emotion.joy()}, 38000));
        this.timerSchedule.push(setTimeout(() => {this.videoMotivationSpeech()}, 38000));
        this.timerSchedule.push(setTimeout(() => {this.ScreenFace.emotion.hot()}, 90000));
        this.timerSchedule.push(setTimeout(() => {this.ScreenFace.emotion.neutral()}, 97000));
        this.timerSchedule.push(setTimeout(() => {this.schedulerCallback()}, 97000));
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
            this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_STATE_CHANGE, "informHelp");
        }
        else{
            if(this.drinkingDetected == false){
                this.animationSchedule();
            }
            else{
                this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_STATE_CHANGE, "subtleActivation");
            }
        }
    }

    drinkMotivationSpeech(){
        this.brainEvents.on(Brain.ROBOT_BRAIN_EVENTS.NEW_CHAT_DURATION, this.drinkMotivationOpenForAnswers.bind(this));

        var payloadTTS = {
            "mode" : "tts",
            "text" : this.utterancesDrinking[Math.floor(Math.random()*this.utterancesDrinking.length)]
        }

        this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.TEXT_TO_SPEECH_ACTION, payloadTTS);
    }

    videoMotivationSpeech(){
        this.brainEvents.on(Brain.ROBOT_BRAIN_EVENTS.NEW_CHAT_DURATION, this.videoMotivationOpenForAnswers.bind(this));

        var payloadTTS = {
            "mode" : "tts",
            "text" : this.utterancesVideo[Math.floor(Math.random()*this.utterancesVideo.length)]
        }

        this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.TEXT_TO_SPEECH_ACTION, payloadTTS);
    }

    drinkMotivationOpenForAnswers(duration){
        this.brainEvents.removeAllListeners(Brain.ROBOT_BRAIN_EVENTS.NEW_CHAT_DURATION, this.drinkMotivationOpenForAnswers);
        this.readyForSpeechTO = setTimeout(() => {
            this.speechProcessor.speechEvent.on('FinalResult', this.checkAnswer.bind(this));
        }, duration * 1000);

        this.closeSpeechInputWindowTO = setTimeout(() => {
            this.speechProcessor.speechEvent.removeAllListeners('FinalResult', this.checkAnswer);
        }, (duration * 1000 + 10000));
    }

    videoMotivationOpenForAnswers(duration){     
        this.brainEvents.removeAllListeners(Brain.ROBOT_BRAIN_EVENTS.NEW_CHAT_DURATION, this.videoMotivationOpenForAnswers);

        this.turnHandlerTO = setTimeout(() => {
            this.RoboticBody.followHeadVertical();
        }, (duration * 1000 - 1000));

        this.readyForSpeechTO = setTimeout(() => {
            this.ScreenFace.video.showAndPlay("drinkingMotivation");
        }, (duration * 1000 + 500));

        this.closeSpeechInputWindowTO = setTimeout(() => {
            this.ScreenFace.video.stopAndHide();
            this.RoboticBody.followHead();
        }, (duration * 1000 + 27000));
    }

    checkAnswer(result){
        console.log("tts result:" + result);

        if(this.containsWords(result, this.confirmWords)){
            var payloadTTS = {
                "mode" : "tts",
                "text" : "Alles klar. Super!"
            }
            this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.TEXT_TO_SPEECH_ACTION, payloadTTS);
            this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_STATE_CHANGE, "subtleActivation");     
        }
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
        this.brainEvents.removeAllListeners(Brain.ROBOT_BRAIN_EVENTS.NEW_CHAT_DURATION, this.drinkMotivationOpenForAnswers);
        this.speechProcessor.speechEvent.removeAllListeners('FinalResult', this.checkAnswer);
        clearTimeout(this.readyForSpeechTO);
        clearTimeout(this.closeSpeechInputWindowTO);
        this.animationReset();
    }



    containsWords(str, wordsArray) {
        // Create a regular expression pattern from the array of words
        const pattern = new RegExp(wordsArray.join('|'), 'i');
      
        // Test if the string contains any of the words
        return pattern.test(str);
    }


}