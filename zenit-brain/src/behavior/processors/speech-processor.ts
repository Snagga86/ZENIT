import EventEmitter from 'events';
import { Brain } from '../brain.js';

export class SpeechProcessor {

    static SPEECH_EVENTS = {
        FINAL_RESULT_RECEIVED: 'FINAL_RESULT_RECEIVED',
        TEMP_WORD_LENGTH_RECEIVED: 'TEMP_WORD_LENGTH_RECEIVED',
        SOUND_CREATED: 'SOUND_CREATED'
    }

    brainEvents : EventEmitter;
    speechEvents : EventEmitter;
    lastWordLength : number;

    constructor(brainEvents : EventEmitter) {
        this.brainEvents = brainEvents;
        this.speechEvents = new EventEmitter();
        this.lastWordLength = 0;
    }

    soundCreated(name : String, duration : number){
        var soundData = {
            "soundName" : name,
            "soundDuration" : duration
        }
        this.speechEvents.emit(SpeechProcessor.SPEECH_EVENTS.SOUND_CREATED, soundData);
    }
          
    suspend(){
        var payload = {
            "mode" : "listen",
            "status" : "stop",
            "duration" : "0"
        }
        this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.SPEECH_TO_TEXT_ACTION, payload);
    }

    resume(){
        var payload = {
            "mode" : "listen",
            "status" : "resume",
            "duration" : "0"
        }
        this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.SPEECH_TO_TEXT_ACTION, payload);
    }

    digest(textInput : String) {
        var splitText = textInput.split(' : ');
        if(splitText[0].includes("text") || splitText[0].includes("partial")){
            {
                var contentString = splitText[1].substring(1, splitText[1].length-3)
                console.log("Transcribed Text Input: ", contentString)
                this.speechEvents.emit(SpeechProcessor.SPEECH_EVENTS.FINAL_RESULT_RECEIVED, contentString);
            }
        }
        else if(splitText[0].includes("length")){
            var currentLength = parseInt(splitText[1]);
            if(currentLength > 0 && currentLength != this.lastWordLength){
                var tmpLength = currentLength - this.lastWordLength;
                if(tmpLength < 0){
                    tmpLength = tmpLength *-1;
                }
                this.speechEvents.emit(SpeechProcessor.SPEECH_EVENTS.TEMP_WORD_LENGTH_RECEIVED, tmpLength);
            }
            this.lastWordLength = currentLength;
        }
    }
}