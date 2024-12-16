/**
 * DisplayProcessor
 * 
 * A module to process display-related events, specifically handling actions
 * from the robot display system. This class listens for incoming data, parses
 * it, and emits relevant events.
 * 
 * Dependencies:
 * - `EventEmitter` from the `events` module for event-driven communication.
 */

import EventEmitter from 'events';

/**
 * DisplayProcessor class to handle robot display-related actions and events.
 */
export class DisplayProcessor {

    /** Static events related to display processing */
    static DISPLAY_EVENTS = {
        ROBOT_SPEECH_ENDED: 'ROBOT_SPEECH_ENDED' // Event triggered when robot speech ends
    };

    displayEvents: EventEmitter; // EventEmitter for display-related events

    /**
     * Constructor to initialize the DisplayProcessor.
     */
    constructor() {
        this.displayEvents = new EventEmitter();
    }

    /**
     * Processes incoming data related to display actions.
     * 
     * @param {any} data - The raw data received (expected to be a JSON string).
     */
    digest(data: any): void {
        const parsedData = JSON.parse(data.toString());
        if (parsedData.action === "speechEnded") {
            this.displayEvents.emit(DisplayProcessor.DISPLAY_EVENTS.ROBOT_SPEECH_ENDED);
        }
    }
}
