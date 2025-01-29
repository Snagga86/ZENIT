import { StateController, Actions, Transition, ZENITState } from './../zenit-state.js';
import { Brain } from '../../brain.js';
import { ChatProcessor } from '../../processors/chat-processor.js';
import { SpeechProcessor } from '../../processors/speech-processor.js';
import { DisplayProcessor } from '../../processors/display-processor.js';
import { BodyLanguageProcessor } from '../../processors/body-language-processor.js';
import { PhoneCamProcessor } from '../../processors/phone-cam-processor.js';
import { EventEmitter } from 'stream';

/* Robot state class defining the robot behavior within this state */
export class ExplicitActivation extends ZENITState{

    chatProcessor : ChatProcessor;
    displayProcessor : DisplayProcessor;
    drinkingDetected : Boolean;
    drinkingMotivationAttempts : number;
    MAX_DRINKING_MOTIVATION_ATTEMPTS : number;
    confirmWords : Array<String>;
    utterancesDrinking : Array<String>;
    utterancesVideo : Array<String>;
    utterancesHelp : Array<String>;
    timerSchedule : Array<any>;

    videoPlayTO : any;
    turnHandlerTO : any;
    closeSpeechInputWindowTO : any;

    constructor(chatProcessor : ChatProcessor, phoneCamProcessor : PhoneCamProcessor, bodyLanguageProcessor : BodyLanguageProcessor, speechProcessor : SpeechProcessor, displayProcessor : DisplayProcessor, brainEvents : EventEmitter){

        /* Call the super constructor and set the identification name for the state class */
        super("explicitActivation", phoneCamProcessor, bodyLanguageProcessor, speechProcessor, brainEvents);

        this.chatProcessor = chatProcessor;
        this.displayProcessor = displayProcessor;

        /* Bind concrete implementation functions for enter and exit of the current state. */
        this.state.actions.onEnter = this.enterFunction.bind(this);
        this.state.actions.onExit = this.exitFunction.bind(this);

        /* Add transitions to the other states to build the graph.
        The transition is called after the state was left but before the new state is entered. */
        this.state.transitions.push(new Transition("subtleActivation", "subtleActivation", () => {
        }));

        this.utterancesDrinking = ["Heute ist es wirklich sehr heiss. Hast du schon etwas getrunken?",
                           "Bitte nicht dehydrieren. Hast du genug Flüssigkeit zu dir genommen?",
                           "Es ist es wirklich richtig heiß draußen. Trinkst du regelmäßig etwas, um nicht auszutrocknen?",
                           "Heute ist es echt richtig warm. Bist du sicher, dass du genug getrunken hast?"];
                           
        this.utterancesVideo = ["Ich habe eine Nachricht von Nina für dich. Ich spiele sie für dich ab!",
        "Nina hat eine Nachricht für dich hinterlassen. Die Wiedergabe ist bereit.",
        "Nina hat eine Nachricht für dich hinterlassen. Ich spiele sie für dich ab."];
    
        this.utterancesHelp = ["Große Hitze ist gefährlich. Ich habe leider nicht erkennen können ob du ausreichend getrunken hast, deshalb habe ich Betreuungspersonal informiert. Es wird sich in kürze jemand bei dir melden!",
            "Extreme Hitze birgt Gefahren. Leider konnte ich nicht feststellen, ob du ausreichend Flüssigkeit zu dir genommen hast. Daher habe ich das Betreuungspersonal informiert, das sich in Kürze bei dir melden wird!"];

        this.confirmWords = ["ja", "selbstverständlich", "natürlich", "klar"];

        this.videoPlayTO;
        this.closeSpeechInputWindowTO;

        this.drinkingDetected = false;
        this.drinkingMotivationAttempts = 0;
        this.MAX_DRINKING_MOTIVATION_ATTEMPTS = 20;

        this.timerSchedule = [];
    }

    /* Enter function is executed whenever the state is activated. */
    enterFunction(){
        this.drinkingMotivationAttempts = 0;
        this.drinkingDetected = false;
        this.ScreenFace.emotion.neutral();
        this.RoboticBody.followHead();
        this.speechProcessor.suspend();
        this.animationSchedule();
    }

    animationSchedule(){
        this.animationReset();
        clearTimeout(this.videoPlayTO);
        clearTimeout(this.closeSpeechInputWindowTO);
        this.timerSchedule.push(setTimeout(() => {this.drinkMotivationSpeech()}, 100));
        this.timerSchedule.push(setTimeout(() => {this.ScreenFace.emotion.hot()}, 15000));
        this.timerSchedule.push(setTimeout(() => {this.ScreenFace.emotion.neutral()}, 35000));
        this.timerSchedule.push(setTimeout(() => {this.ScreenFace.emotion.joy()}, 38000));
        this.timerSchedule.push(setTimeout(() => {this.videoMotivationSpeech()}, 38000));
        this.timerSchedule.push(setTimeout(() => {this.ScreenFace.emotion.hot()}, 90000));
        this.timerSchedule.push(setTimeout(() => {this.ScreenFace.emotion.neutral()}, 97000));
        this.timerSchedule.push(setTimeout(() => {this.informReminderSpeech()}, 97000));
        this.timerSchedule.push(setTimeout(() => {this.schedulerCallback()}, 117000));
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
            console.log("Inform HLP");
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

    informReminderSpeech(){
        var payloadTTS = {
            "mode" : "tts",
            "text" : this.utterancesHelp[Math.floor(Math.random()*this.utterancesHelp.length)]
        }

        this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.TEXT_TO_SPEECH_ACTION, payloadTTS);
        this.ScreenFace.emotion.sadness();
        this.ScreenFace.text.show();
        this.ScreenFace.text.text("Betreuendes Personal wurde informiert!");
    }

    drinkMotivationSpeech(){
        this.displayProcessor.displayEvents.on(DisplayProcessor.DISPLAY_EVENTS.ROBOT_SPEECH_ENDED, this.drinkMotivationSpeechEndedHandler.bind(this));

        var payloadTTS = {
            "mode" : "tts",
            "text" : this.utterancesDrinking[Math.floor(Math.random()*this.utterancesDrinking.length)]
        }

        this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.TEXT_TO_SPEECH_ACTION, payloadTTS);
    }

    drinkMotivationSpeechEndedHandler(){
        this.displayProcessor.displayEvents.removeAllListeners(DisplayProcessor.DISPLAY_EVENTS.ROBOT_SPEECH_ENDED);
        this.speechProcessor.resume();
        this.speechProcessor.speechEvents.on(SpeechProcessor.SPEECH_EVENTS.FINAL_RESULT_RECEIVED, this.checkAnswer.bind(this));
        this.closeSpeechInputWindowTO = setTimeout(() => {
            this.speechProcessor.speechEvents.removeAllListeners(SpeechProcessor.SPEECH_EVENTS.FINAL_RESULT_RECEIVED);
            this.speechProcessor.suspend();
        }, (5000));
    }

    videoMotivationSpeech(){
        this.displayProcessor.displayEvents.on(DisplayProcessor.DISPLAY_EVENTS.ROBOT_SPEECH_ENDED, this.videoMotivationSpeechEndedHandler.bind(this));

        var payloadTTS = {
            "mode" : "tts",
            "text" : this.utterancesVideo[Math.floor(Math.random()*this.utterancesVideo.length)]
        }

        this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.TEXT_TO_SPEECH_ACTION, payloadTTS);
    }

    videoMotivationSpeechEndedHandler(){
        this.displayProcessor.displayEvents.removeAllListeners(DisplayProcessor.DISPLAY_EVENTS.ROBOT_SPEECH_ENDED);
        this.ScreenFace.video.showAndPlay("drinkingMotivation");
        this.videoPlayTO = setTimeout(() => {
            this.ScreenFace.video.stopAndHide();
            this.RoboticBody.followHead();
        }, (33000));
    }

    checkAnswer(result : any){

        if(this.containsWords(result, this.confirmWords)){
            var payloadTTS = {
                "mode" : "tts",
                "text" : "Alles klar. Super!"
            }
            this.displayProcessor.displayEvents.addListener(DisplayProcessor.DISPLAY_EVENTS.ROBOT_SPEECH_ENDED, this.speechEndedHandler.bind(this));
            this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.TEXT_TO_SPEECH_ACTION, payloadTTS);
        }
    }

    speechEndedHandler(){
        this.displayProcessor.displayEvents.removeAllListeners(DisplayProcessor.DISPLAY_EVENTS.ROBOT_SPEECH_ENDED);
        this.speechProcessor.resume();
        this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_STATE_CHANGE, "subtleActivation");     
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
        this.ScreenFace.text.hide();
        this.speechProcessor.speechEvents.removeAllListeners(SpeechProcessor.SPEECH_EVENTS.FINAL_RESULT_RECEIVED);
        clearTimeout(this.videoPlayTO);
        clearTimeout(this.closeSpeechInputWindowTO);
        this.animationReset();
    }



    containsWords(str : any, wordsArray : any) {
        // Create a regular expression pattern from the array of words
        const pattern = new RegExp(wordsArray.join('|'), 'i');
      
        // Test if the string contains any of the words
        return pattern.test(str);
    }


}