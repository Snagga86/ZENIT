import EventEmitter from 'events';

export class EmotionProcessor {

    constructor(facialExpressionsInterpretation=true, bodyLanguageInterpretation=false) {

        this.facialExpressionsInterpretation = facialExpressionsInterpretation;
        this.bodyLanguageInterpretation = bodyLanguageInterpretation;

        this.facialEmotionInputBuffer = new Array();
        this.emotionCounter = new Array();

        this.emotionEvent = new EventEmitter();

        this.currentEmotion = "";
    }

    getCurrentRecognition(){
        return this.currentEmotion;
    }

    /*keyValueInput(value){
        if(this.facialExpressionsInterpretation == true){
            var emotion = this.processValueAsFacialExpression(value);
        }
        if(this.bodyLanguageInterpretation == true){
            this.processValueAsBodyLanguage(value);
        }
        this.currentEmotion = emotion;
        return emotion;
    }*/

    digest(currentEmotionInput) {
        console.log(currentEmotionInput);
        if(this.facialExpressionsInterpretation == true){
            var emotion = this.processValueAsFacialExpression(currentEmotionInput.toLowerCase());
        }
        if(this.bodyLanguageInterpretation == true){
            this.processValueAsBodyLanguage(currentEmotionInput.toLowerCase());
        }
        //console.log(emotion);
        this.emotionEvent.emit('EmotionDetection', emotion);
        this.currentEmotion = emotion;
    }

    processValueAsFacialExpression(value){
        this.facialEmotionInputBuffer.push(value);
        if(this.facialEmotionInputBuffer.length > EMOTION_BUFFER_LEN){
            this.facialEmotionInputBuffer.shift();
        }
        this.facialEmotionInputBuffer.forEach(element => {
            this.emotionCounter[element] = (this.emotionCounter[element] || 0) + 1;
        });

        var currentEmotion = this.maxKeyValue(this.emotionCounter);
        //console.log("currentEmotion: " + currentEmotion[0]);
        var emotionAndValenceClass = this.getEmotionAndValence(currentEmotion[0],currentEmotion[1]);
        this.emotionCounter = new Array();

        return emotionAndValenceClass;
    }

    getEmotionAndValence(emotion, count){
        //var valence = ((count + 1) / EMOTION_BUFFER_LEN) * 10 / NUM_VALENCE_CLASSES;
        //var valenceClass = Math.floor(valence) - 1;
        var valenceClass = 1;
        if(valenceClass < 0)valenceClass = 0;
        //console.log(emotion + ": " + valence);
        //console.log(emotion + ": " + valenceClass);
        switch(emotion){
            case "anger":
                emotion = BEmotion.anger[valenceClass];
                break;
            case "anticipation":
                emotion = BEmotion.anticipation[valenceClass];
                break;
            case "happiness":
                emotion = BEmotion.happiness[valenceClass];
                break;
            case "trust":
                emotion = BEmotion.trust[valenceClass];
                break;
            case "fear":
                emotion = BEmotion.fear[valenceClass];
                break;
            case "surprise":
                emotion = BEmotion.surprise[valenceClass];
                break;
            case "sadness":
                emotion = BEmotion.sadness[valenceClass];
                break;
            case "disgust":
                emotion = BEmotion.disgust[valenceClass];
                break;
            case "contempt":
                emotion = BEmotion.contempt[valenceClass];
                break;
            default:
                emotion = "neutral";
        }
        //console.log("Emotion:" + emotion);
        return emotion;
    }

    maxKeyValue(data){
        var lastValue = 0;
        var lastKey = "";

        for (const [key, value] of Object.entries(data)) {
            if(value > lastValue){
                lastValue = value;
                lastKey = key;
            }
        }
        return [lastKey, lastValue];
    }

    processValueAsBodyLanguage(value){

    }
}

const NUM_VALENCE_CLASSES = 3.333;
const EMOTION_BUFFER_LEN = 1;
const BEmotion = {

    "anger" : ['annoyance','anger', 'rage']
    ,
    "anticipation" : ['interest','anticipation','vigilance']
    ,
    "happiness" :  ['serenity','joy','ecstasy']
    ,
    "trust" : ['acceptance', 'trust', 'admiration']
    ,
    "fear" : ['apprehension', 'fear', 'terror']
    ,
    "surprise" : ['distraction','surprise','amazement']
    ,
    "sadness" : ['pensiveness', 'sadness', 'grief']
    ,
    "disgust" : ['boredom', 'disgust','loathing']
    ,
    "contempt" : ['contempt', 'contempt','contempt']
}