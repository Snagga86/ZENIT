import EventEmitter from 'events';

export class TextToSpeechProcessor {

    constructor() {

        this.speechEvent = new EventEmitter();

    }

    digest(textInput) {
        console.log(textInput);
    }
}