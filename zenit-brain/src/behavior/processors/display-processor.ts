import http from "http"
import EventEmitter from 'events';
import { Brain } from '../brain.js';

export class DisplayProcessor {

    static DISPLAY_EVENTS = {
        ROBOT_SPEECH_ENDED: 'ROBOT_SPEECH_ENDED'
    }

    displayEvents : EventEmitter;

    constructor() {
        this.displayEvents = new EventEmitter();
    }

    digest(data : any){
        var data = JSON.parse(data.toString());
        if(data.action == "speechEnded"){
            this.displayEvents.emit(DisplayProcessor.DISPLAY_EVENTS.ROBOT_SPEECH_ENDED);
        }
    }
}