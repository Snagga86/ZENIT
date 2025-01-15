/**
 * SpeechProcessor
 * 
 * A module for handling speech processing events and interfacing with the robot brain.
 * This class manages events related to speech-to-text operations and sound creation. 
 * It is designed to emit and handle specific events for seamless integration with other components.
 * 
 * Dependencies:
 * - `EventEmitter` from the `events` module for event-driven programming.
 * - `Brain` module for interacting with the robot's brain.
 */

import EventEmitter from 'events';
import { Brain } from '../brain.js';

export class SpeechProcessor {

    /**
     * Static property for defining speech-related events.
     */
    static SPEECH_EVENTS = {
        FINAL_RESULT_RECEIVED: 'FINAL_RESULT_RECEIVED',
        TEMP_WORD_LENGTH_RECEIVED: 'TEMP_WORD_LENGTH_RECEIVED',
        SOUND_CREATED: 'SOUND_CREATED'
    }

    /**
     * @property {EventEmitter} brainEvents - An EventEmitter instance for robot brain communication.
     * @property {EventEmitter} speechEvents - An EventEmitter instance for emitting speech-related events.
     * @property {number} lastWordLength - Tracks the length of the last processed word.
     */
    brainEvents: EventEmitter;
    speechEvents: EventEmitter;
    lastWordLength: number;

    /**
     * Constructor for SpeechProcessor.
     * 
     * @param {EventEmitter} brainEvents - EventEmitter instance for brain events.
     */
    constructor(brainEvents: EventEmitter) {
        this.brainEvents = brainEvents;
        this.speechEvents = new EventEmitter();
        this.lastWordLength = 0;
    }

    /**
     * Emits an event when a sound is created.
     * 
     * @param {string} name - Name of the soundfile.
     * @param {number} duration - Duration of the soundfile in milliseconds.
     */
    public soundCreated(name: string, duration: number): void {
        const soundData = {
            soundName: name,
            soundDuration: duration
        };
        this.speechEvents.emit(SpeechProcessor.SPEECH_EVENTS.SOUND_CREATED, soundData);
    }

    /**
     * Suspends the speech-to-text functionality by emitting a stop action to the remote speech recognition.
     */
    public suspend(): void {
        const payload = {
            mode: "listen",
            status: "stop",
            duration: "0"
        };
        this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.SPEECH_TO_TEXT_ACTION, payload);
    }

    /**
     * Resumes the speech-to-text functionality by emitting a resume action to the remote speech recognition.
     */
    public resume(): void {
        const payload = {
            mode: "listen",
            status: "resume",
            duration: "0"
        };
        this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.SPEECH_TO_TEXT_ACTION, payload);
    }

    /**
     * Processes and digests incoming text input.
     * Handles two scenarios:
     * 1. Transcribed text input is received.
     * 2. Temporary word length data is updated.
     * 
     * @param {string} textInput - The raw text input received from the speech-to-text system.
     */
    public digest(textInput: string): void {
        const splitText = textInput.split(' : ');

        // Handle transcribed text input
        if (splitText[0].includes("text") || splitText[0].includes("partial")) {
            const contentString = splitText[1].substring(1, splitText[1].length - 3);
            console.log("Transcribed Text Input: ", contentString);
            console.log("emit speeech final result event");
            this.speechEvents.emit(SpeechProcessor.SPEECH_EVENTS.FINAL_RESULT_RECEIVED, contentString);
        }

        // Handle temporary word length updates
        else if (splitText[0].includes("length")) {
            const currentLength = parseInt(splitText[1]);
            if (currentLength > 0 && currentLength !== this.lastWordLength) {
                let tmpLength = currentLength - this.lastWordLength;
                if (tmpLength < 0) {
                    tmpLength *= -1;
                }
                this.speechEvents.emit(SpeechProcessor.SPEECH_EVENTS.TEMP_WORD_LENGTH_RECEIVED, tmpLength);
            }
            this.lastWordLength = currentLength;
        }
    }
}
