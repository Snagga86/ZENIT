/**
 * ChatProcessor
 * 
 * A module to handle chat interactions with external systems such as Rasa and LLM (Large Language Models).
 * This class manages sending and receiving messages and emits events based on the received responses.
 * 
 * Dependencies:
 * - `http` module for making HTTP requests.
 * - `EventEmitter` from the `events` module for event-driven programming.
 * - `Brain` module for robot brain interactions.
 */

import http from "http";
import EventEmitter from 'events';
import { Brain } from '../brain.js';

/**
 * Interface defining the structure of LLM replies.
 */
interface LLMReply {
    answer: string; // The response text from the LLM
    emotion: string; // The associated emotion with the response
}

/**
 * ChatProcessor class to handle interactions with Rasa and LLM systems.
 */
export class ChatProcessor {

    /** Static events related to chat processing */
    public static CHAT_EVENTS = {
        LLM_ANSWER: 'LLM_ANSWER',
        RASA_ANSWER: 'RASA_ANSWER'
    };

    private defaultLLMReply: LLMReply; // Default response for LLM in case of errors
    public chatEvents: EventEmitter; // EventEmitter for chat events

    /**
     * Constructor to initialize the ChatProcessor.
     */
    constructor() {
        this.chatEvents = new EventEmitter();
        this.defaultLLMReply = {
            answer: "Uups, da hat mein Sprachmodel eine invalide Antwort geliefert. Das kommt leider vor.",
            emotion: "sadness"
        };
    }

    /**
     * Sends a message to the Rasa NLU and emits an event with the response.
     * 
     * @param {string} text - The message text to send.
     */
    public NLUSendMessage(text: string): void {
        const postData = JSON.stringify({
            sender: "test_user",
            message: text
        });

        console.log(postData);

        const options = {
            hostname: '127.0.0.1',
            port: 5005,
            path: '/webhooks/rest/webhook',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            console.log('statusCode:', res.statusCode);
            res.on('data', (d) => {
                const result = JSON.parse(d.toString());
                this.chatEvents.emit(ChatProcessor.CHAT_EVENTS.RASA_ANSWER, result);
            });
        });

        req.on('error', (e) => {
            console.error(e);
        });

        req.write(postData);
        req.end();
    }

    /**
     * Sends a message to the LLM system and emits an event with the response.
     * 
     * @param {string} text - The prompt text to send.
     */
    public LLMSendMessage(text: string): void {
        const data = JSON.stringify({ prompt: text });
        const options = {
            hostname: '127.0.0.1',
            port: 12345,
            path: '/ask',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Content-Length': Buffer.byteLength(data, 'utf-8')
            }
        };

        const req = http.request(options, (res) => {
            res.on('data', (d) => {
                const utf8Content: string = Buffer.from(d, 'utf-8').toString('utf-8');
                console.log(utf8Content);
                let result;
                try {
                    const parsed: any = JSON.parse(utf8Content);
                    parsed.emotion = this.repairLLMEmotion(parsed.emotion);
                    console.log(parsed);
                    result = parsed;
                } catch (e) {
                    result = null;
                }

                this.chatEvents.emit(ChatProcessor.CHAT_EVENTS.LLM_ANSWER, result);
            });
        });

        req.on('error', (e) => {
            console.error(e);
        });

        req.write(data);
        req.end();
    }

    /**
     * Repairs and maps guessed emotions from the LLM to valid values.
     * 
     * @param {string} guessedEmotion - The guessed emotion from the LLM.
     * @returns {string} The repaired emotion value.
     */
    private repairLLMEmotion(guessedEmotion: string): string {
        console.log("Guessed emotion:" + guessedEmotion);
        let emotion = "neutral";

        switch (guessedEmotion.toLowerCase()) {
            case "joy":
                emotion = "joy";
                break;
            case "surprise":
                emotion = "surprise";
                break;
            case "anger":
                emotion = "anger";
                break;
            case "contempt":
                emotion = "contempt";
                break;
            case "fear":
                emotion = "fear";
                break;
            case "disgust":
                emotion = "disgust";
                break;
            case "sadness":
                emotion = "sadness";
                break;
            case "neutral":
                emotion = "neutral";
                break;
            case "unangemessen":
                emotion = "contempt";
                break;
            case "enttäuschung":
                emotion = "sadness";
                break;
            case "mitgefühl":
                emotion = "sadness";
                break;
            case "besorgnis":
                emotion = "fear";
                break;
            case "neugier":
                emotion = "neutral";
                break;
            case "curiosity":
                emotion = "neutral";
                break;
            case "frustration":
                emotion = "sadness";
                break;
            case "verachtung":
                emotion = "contempt";
                break;
            case "angst":
                emotion = "fear";
                break;
            case "wütend":
                emotion = "anger";
                break;
            case "angry":
                emotion = "anger";
                break;
            case "wut":
                emotion = "anger";
                break;
            case "überraschung":
                emotion = "surprise";
                break;
            case "stolz":
                emotion = "joy";
                break;
            case "lust":
                emotion = "joy";
                break;
            case "lustig":
                emotion = "joy";
                break;
            case "ängstlich":
                emotion = "fear";
                break;
            case "ecstasy":
                emotion = "joy";
                break;
            case "arrogance":
                emotion = "contempt";
                break;
            case "arrogance":
                emotion = "contempt";
                break;
            case "wut":
                emotion = "anger";
                break;
            case "freude":
                emotion = "joy";
                break;
            case "verachtung":
                emotion = "contempt";
                break;
            case "überraschung":
                emotion = "surprise";
                break;
            case "ekel":
                emotion = "disgust";
                break;
            case "angst":
                emotion = "fear";
                break;
            default:
                emotion = "neutral";
        }

        return emotion;
    }
}
