import EventEmitter from 'events';

export class SpeechProcessor {

    constructor() {

        this.speechEvent = new EventEmitter();

    }

    digest(textInput) {
        console.log(textInput);
    }
}