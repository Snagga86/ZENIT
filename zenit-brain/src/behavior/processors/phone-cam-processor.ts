import EventEmitter from 'events';

interface PhoneCamRecognition
{
    emotion: string;
    percent_x: number;
    percent_y: number;
}

export class PhoneCamProcessor {

    public static EMOTION_EVENTS = {
        EMOTION_TRIGGERED: 'EMOTION_TRIGGERED'
    }

    emotionEvent : EventEmitter;
    facialExpressionsInterpretation : Boolean;
    bodyLanguageInterpretation : Boolean;
    facialEmotionInputBuffer : Array<string>;
    emotionCounter : Record<string, number>;
    currentEmotion : String;
    NUM_VALENCE_CLASSES : number;
    EMOTION_BUFFER_LEN : number;
    BEmotion: any;

    constructor(facialExpressionsInterpretation=true, bodyLanguageInterpretation=false) {

        this.facialExpressionsInterpretation = facialExpressionsInterpretation;
        this.bodyLanguageInterpretation = bodyLanguageInterpretation;

        this.facialEmotionInputBuffer = [];
        this.emotionCounter = {};

        this.emotionEvent = new EventEmitter();

        this.currentEmotion = "";

        
        this.NUM_VALENCE_CLASSES = 3.333;
        this.EMOTION_BUFFER_LEN = 10; // frames (5fps currently)
        this.BEmotion = {

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

    digest(rawPhoneCamRecognition : string) {
        //console.log("rawPhoneCamRecognition");
        //console.log(rawPhoneCamRecognition);
        var phoneCamRecognition : PhoneCamRecognition = JSON.parse(rawPhoneCamRecognition) as PhoneCamRecognition;
        var emotion : string = "";
        if(this.facialExpressionsInterpretation == true){
            emotion = this.processValueAsFacialExpression(phoneCamRecognition.emotion.toLowerCase());
            console.log("processed emotion: " + emotion);
        }
        if(this.bodyLanguageInterpretation == true){
            this.processValueAsBodyLanguage(phoneCamRecognition.emotion.toLowerCase());
        }
        //console.log(emotion);
        this.emotionEvent.emit(PhoneCamProcessor.EMOTION_EVENTS.EMOTION_TRIGGERED, emotion);
        this.currentEmotion = emotion;
    }

    processValueAsFacialExpression(value : string){
        this.facialEmotionInputBuffer.push(value);
        if(this.facialEmotionInputBuffer.length > this.EMOTION_BUFFER_LEN){
            this.facialEmotionInputBuffer.shift();
        }
        this.facialEmotionInputBuffer.forEach(element => {
            this.emotionCounter[element] = (this.emotionCounter[element] || 0) + 1;
        });

        var currentEmotion = this.maxKeyValue(this.emotionCounter);
        //console.log("currentEmotion: " + currentEmotion[0]);
        var emotionAndValenceClass = this.getEmotionAndValence(currentEmotion[0] as string, currentEmotion[1]);
        this.emotionCounter = {};

        return emotionAndValenceClass;
    }

    getEmotionAndValence(emotion : string, count : any){
        var valence = ((count + 1) / this.EMOTION_BUFFER_LEN) * 10 / this.NUM_VALENCE_CLASSES;
        var valenceClass = Math.floor(valence) - 1;
        //var valenceClass = 1;
        //if(valenceClass < 0)valenceClass = 0;
        //console.log(emotion + ": " + valence);
        //console.log(emotion + ": " + valenceClass);
        switch(emotion){
            case "anger":
                emotion = this.BEmotion.anger[valenceClass];
                break;
            case "anticipation":
                emotion = this.BEmotion.anticipation[valenceClass];
                break;
            case "happiness":
                emotion = this.BEmotion.happiness[valenceClass];
                break;
            case "trust":
                emotion = this.BEmotion.trust[valenceClass];
                break;
            case "fear":
                emotion = this.BEmotion.fear[valenceClass];
                break;
            case "surprise":
                emotion = this.BEmotion.surprise[valenceClass];
                break;
            case "sadness":
                emotion = this.BEmotion.sadness[valenceClass];
                break;
            case "disgust":
                emotion = this.BEmotion.disgust[valenceClass];
                break;
            case "contempt":
                emotion = this.BEmotion.contempt[valenceClass];
                break;
            default:
                emotion = "neutral";
        }
        //console.log("Emotion:" + emotion);
        return emotion;
    }

    maxKeyValue(data: Record<string, number>): [string, number] {
        let lastValue: number = 0;
        let lastKey: string = "";
    
        for (const [key, value] of Object.entries(data)) {
            if (value > lastValue) {
                lastValue = value;
                lastKey = key;
            }
        }
    
        return [lastKey, lastValue];
    }

    processValueAsBodyLanguage(value : any){

    }
}
