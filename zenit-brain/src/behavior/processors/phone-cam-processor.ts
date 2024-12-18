/**
 * PhoneCamProcessor
 * 
 * A module for processing and interpreting data from a phone camera. This class
 * handles facial emotion recognition, facial position and size, processes input data, and emits events 
 * related to detected emotions.
 * 
 * Dependencies:
 * - `EventEmitter` from the `events` module for event-driven programming.
 * 
 * Interfaces:
 * - `PhoneCamRecognition`: Represents the structure of phone camera recognition data.
 */

import EventEmitter from 'events';

/**
 * Interface defining the structure of recognition data.
 */
interface PhoneCamRecognition {
    emotion: string; // Emotion detected
    face: string; // Face detection status
    percent_x: number; // X-coordinate percentage of face
    percent_y: number; // Y-coordinate percentage of face
}

/**
 * PhoneCamProcessor class to handle phone camera recognition data.
 */
export class PhoneCamProcessor {

    /** Static events related to emotion processing */
    public static EMOTION_EVENTS = {
        EMOTION_TRIGGERED: 'EMOTION_TRIGGERED'
    };

    emotionEvent: EventEmitter; // EventEmitter for emotion events
    facialExpressionsInterpretation: boolean; // Flag for interpreting facial expressions
    bodyLanguageInterpretation: boolean; // Flag for interpreting body language
    facialEmotionInputBuffer: Array<string>; // Buffer for facial emotion inputs
    emotionCounter: Record<string, number>; // Counter for emotion occurrences
    lastPhoneCamRecognition: PhoneCamRecognition; // Last processed recognition data
    NUM_AROUSAL_LEVELS: number; // Number of arousal levels for emotion classification
    EMOTION_BUFFER_LEN: number; // Length of emotion buffer
    BEmotion: Record<string, string[]>; // Emotion mapping for arousal lvel

    /**
     * Constructor to initialize PhoneCamProcessor.
     * 
     * @param {boolean} facialExpressionsInterpretation - Enables facial expression interpretation.
     * @param {boolean} bodyLanguageInterpretation - Enables body language interpretation.
     */
    constructor(facialExpressionsInterpretation = true, bodyLanguageInterpretation = false) {

        this.facialExpressionsInterpretation = facialExpressionsInterpretation;
        this.bodyLanguageInterpretation = bodyLanguageInterpretation;

        this.facialEmotionInputBuffer = [];
        this.emotionCounter = {};

        this.emotionEvent = new EventEmitter();

        this.lastPhoneCamRecognition = {
            emotion: "0",
            face: "False",
            percent_x: 0,
            percent_y: 0
        };

        this.NUM_AROUSAL_LEVELS = 3.333;
        this.EMOTION_BUFFER_LEN = 12; // frames (5fps currently)
        this.BEmotion = {
            anger: ['annoyance', 'anger', 'rage'],
            anticipation: ['interest', 'anticipation', 'vigilance'],
            happiness: ['serenity', 'joy', 'ecstasy'],
            trust: ['acceptance', 'trust', 'admiration'],
            fear: ['apprehension', 'fear', 'terror'],
            surprise: ['distraction', 'surprise', 'amazement'],
            sadness: ['pensiveness', 'sadness', 'grief'],
            disgust: ['boredom', 'disgust', 'loathing'],
            contempt: ['contempt', 'contempt', 'contempt']
        };
    }

    /**
     * Retrieves the last phone camera recognition data.
     * 
     * @returns {PhoneCamRecognition} The last recognition data.
     */
    public getCurrentRecognition(): PhoneCamRecognition {
        return this.lastPhoneCamRecognition;
    }

    /**
     * Processes raw phone camera recognition data and emits an emotion event.
     * 
     * @param {string} rawPhoneCamRecognition - Raw recognition data in JSON string format.
     */
    public digest(rawPhoneCamRecognition: string): void {
        const phoneCamRecognition: PhoneCamRecognition = JSON.parse(rawPhoneCamRecognition) as PhoneCamRecognition;
        let emotion = "";

        if (this.facialExpressionsInterpretation) {
            emotion = this.processValueAsFacialExpression(phoneCamRecognition.emotion.toLowerCase());
        }

        if (this.bodyLanguageInterpretation) {
            this.processValueAsBodyLanguage(phoneCamRecognition.emotion.toLowerCase());
        }

        this.emotionEvent.emit(PhoneCamProcessor.EMOTION_EVENTS.EMOTION_TRIGGERED, emotion);
        this.lastPhoneCamRecognition = phoneCamRecognition;
    }

    /**
     * Processes a facial expression value and determines the most likely emotion.
     * 
     * @param {string} value - The facial expression value.
     * @returns {string} The classified emotion and arousal class.
     */
    private processValueAsFacialExpression(value: string): string {
        this.facialEmotionInputBuffer.push(value);

        if (this.facialEmotionInputBuffer.length > this.EMOTION_BUFFER_LEN) {
            this.facialEmotionInputBuffer.shift();
        }

        this.facialEmotionInputBuffer.forEach(element => {
            this.emotionCounter[element] = (this.emotionCounter[element] || 0) + 1;
        });

        const currentEmotion = this.maxKeyValue(this.emotionCounter);
        const arousal = this.getArousal(currentEmotion[0], currentEmotion[1]);
        this.emotionCounter = {};

        return arousal;
    }

    /**
     * Maps an emotion and count to a level of arousal.
     * 
     * @param {string} emotion - The emotion to classify.
     * @param {number} count - The occurrence count of the emotion.
     * @returns {string} The classified emotion with arousal level.
     */
    private getArousal(emotion: string, count: number): string {
        const avgLevel = ((count + 1) / this.EMOTION_BUFFER_LEN) * 10 / this.NUM_AROUSAL_LEVELS;
        const arousalLevel = Math.max(0, Math.floor(avgLevel) - 1);

        switch (emotion) {
            case "anger":
                return this.BEmotion.anger[arousalLevel];
            case "anticipation":
                return this.BEmotion.anticipation[arousalLevel];
            case "happiness":
                return this.BEmotion.happiness[arousalLevel];
            case "trust":
                return this.BEmotion.trust[arousalLevel];
            case "fear":
                return this.BEmotion.fear[arousalLevel];
            case "surprise":
                return this.BEmotion.surprise[arousalLevel];
            case "sadness":
                return this.BEmotion.sadness[arousalLevel];
            case "disgust":
                return this.BEmotion.disgust[arousalLevel];
            case "contempt":
                return this.BEmotion.contempt[arousalLevel];
            default:
                return "neutral";
        }
    }

    /**
     * Retrieves the key-value pair with the highest value from a record.
     * 
     * @param {Record<string, number>} data - The data to evaluate.
     * @returns {[string, number]} The key-value pair with the maximum value.
     */
    private maxKeyValue(data: Record<string, number>): [string, number] {
        let lastValue = 0;
        let lastKey = "";

        for (const [key, value] of Object.entries(data)) {
            if (value > lastValue) {
                lastValue = value;
                lastKey = key;
            }
        }

        return [lastKey, lastValue];
    }

    /**
     * Processes body language values (placeholder for future implementation).
     * 
     * @param {string} value - The body language data.
     */
    private processValueAsBodyLanguage(value: string): void {
        // Placeholder for future body language interpretation logic
    }
}
