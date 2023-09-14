import EventEmitter from 'events';

export class SpeechToTextProcessor {

    constructor() {

        this.speechEvent = new EventEmitter();

    }

    digest(textInput) {
        console.log(textInput);
    }
}