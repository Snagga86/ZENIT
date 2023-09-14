import EventEmitter from 'events';

export class SpeechProcessor {

    constructor(facialExpressionsInterpretation=true, bodyLanguageInterpretation=false) {

        this.facialExpressionsInterpretation = facialExpressionsInterpretation;
        this.bodyLanguageInterpretation = bodyLanguageInterpretation;

        this.facialEmotionInputBuffer = new Array();
        this.emotionCounter = new Array();

        this.emotionEvent = new EventEmitter();

        this.currentEmotion = "";
    }

    digest(textInput) {

    }
}