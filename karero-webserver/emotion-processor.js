export class EmotionProcessor {

    constructor(facialExpressionsInterpretation=true, bodyLanguageInterpretation=false) {

        this.facialExpressionsInterpretation = facialExpressionsInterpretation;
        this.bodyLanguageInterpretation = bodyLanguageInterpretation;

        this.facialEmotionInputBuffer = new Array();
        this.emotionCounter = new Array();
    }

    keyValueInput(value){
        if(this.facialExpressionsInterpretation == true){
            var emotion = this.processValueAsFacialExpression(value);
        }
        if(this.bodyLanguageInterpretation == true){
            this.processValueAsBodyLanguage(value);
        }

        return emotion;
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
        var valence = ((count + 1) / EMOTION_BUFFER_LEN) * 10 / NUM_VALENCE_CLASSES;
        var valenceClass = Math.floor(valence) - 1;
        if(valenceClass < 0)valenceClass = 0;
        //console.log(emotion + ": " + valence);
        //console.log(emotion + ": " + valenceClass);
        switch(emotion){
            case "Anger":
                emotion = BEmotion.Anger[valenceClass];
                break;
            case "Anticipation":
                emotion = BEmotion.Anticipation[valenceClass];
                break;
            case "Happiness":
                emotion = BEmotion.Happiness[valenceClass];
                break;
            case "Trust":
                emotion = BEmotion.Trust[valenceClass];
                break;
            case "Fear":
                emotion = BEmotion.Fear[valenceClass];
                break;
            case "Surprise":
                emotion = BEmotion.Surprise[valenceClass];
                break;
            case "Sadness":
                emotion = BEmotion.Sadness[valenceClass];
                break;
            case "Disgust":
                emotion = BEmotion.Disgust[valenceClass];
                break;
            case "Contempt":
                emotion = BEmotion.Contempt[valenceClass];
                break;
            default:
                emotion = "Neutral";
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
const EMOTION_BUFFER_LEN = 12;
const BEmotion = {

    "Anger" : ['Annoyance','Anger', 'Rage']
    ,
    "Anticipation" : ['Interest','Anticipation','Vigilance']
    ,
    "Happiness" :  ['Serenity','Joy','Ecstasy']
    ,
    "Trust" : ['Acceptance', 'Trust', 'Admiration']
    ,
    "Fear" : ['Apprehension', 'Fear', 'Terror']
    ,
    "Surprise" : ['Distraction','Surprise','Amazement']
    ,
    "Sadness" : ['Pensiveness', 'Sadness', 'Grief']
    ,
    "Disgust" : ['Boredom', 'Disgust','Loathing']
    ,
    "Contempt" : ['Contempt', 'Contempt','Contempt']
}