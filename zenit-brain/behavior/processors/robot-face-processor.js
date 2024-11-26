import http from "http"
import EventEmitter from 'events';
import { Brain } from '../brain.js';

export class RobotFaceProcessor {

    constructor() {
        this.robotFaceEvents = new EventEmitter();
    }

    digest(data){

        console.log("RobotFaceProcessor: " + data.action);
        var data = JSON.parse(data.toString());
        if(data.action == "speechEnded"){
            console.log("here")
            this.robotFaceEvents.emit("robotSpeechEnded");
        }
    }
}