import EventEmitter from 'events';
import * as fs from 'fs';

export class BodyLanguageProcessor {

    static BODY_LANGUAGE_EVENTS = {
        ALL_BODIES_LEFT_INTERACTION_ZONE: 'ALL_BODIES_LEFT_INTERACTION_ZONE',
        BODY_ENTERED_INTERACTION_ZONE: 'BODY_ENTERED_INTERACTION_ZONE',
        GESTURE_OR_POSTURE_DETECTED: 'GESTURE_OR_POSTURE_DETECTED'
    }

    ONLY_SWEETSPOT_BODY : Boolean;
    bodyLanguageEvent : EventEmitter;
    currentGesture : String;
    closestBody : any;
    closestBodyDistance : number;
    bodyIsInInteractionZone : Boolean;

    rawdata : any;
    serverConf : any;

    TIME_THRESHHOLD : number;
    timeDetected : number;
    recentlyDetected : Boolean;

    lastKinectUpdateTime : any;

    bodiesAbsent : Boolean;

    constructor(configPath : string) {
        this.ONLY_SWEETSPOT_BODY = true;
        this.bodyLanguageEvent = new EventEmitter();
        this.currentGesture = "";
        this.closestBody;
        this.closestBodyDistance = 100000000;
        this.bodyIsInInteractionZone = false;

        const rawdata = fs.readFileSync(configPath);
        this.serverConf = JSON.parse(rawdata.toString());

        this.TIME_THRESHHOLD = 2600;
        this.timeDetected = 0;
        this.recentlyDetected = false;

        this.lastKinectUpdateTime = null;
        this.bodiesAbsent = true;

        setInterval(() => {
            this.checkLastKinectData();
        }, 1000);
    }

    /* Trigger and event if no bodies were found by the kinect in the previous second. */
    checkLastKinectData(){
        if(Date.now() - this.lastKinectUpdateTime >= 1000 && this.bodiesAbsent == false){
            this.closestBodyDistance = 100000000;
            console.log("All bodies left interaction zone.");
            this.bodiesAbsent = true;
            this.bodyIsInInteractionZone = false;
            this.bodyLanguageEvent.emit(BodyLanguageProcessor.BODY_LANGUAGE_EVENTS.ALL_BODIES_LEFT_INTERACTION_ZONE, this.closestBodyDistance);
        }
    }

    digest(kinectData : any) {
        this.lastKinectUpdateTime = Date.now();
        this.bodiesAbsent = false;
        if(this.ONLY_SWEETSPOT_BODY == true){
            this.getClosestBody(kinectData.translatedBodies);
            if(this.recentlyDetected == false && this.closestBody.trackedGesture != ""){
                this.recentlyDetected = true;
                this.timeDetected = Date.now();
                this.bodyLanguageEvent.emit(BodyLanguageProcessor.BODY_LANGUAGE_EVENTS.GESTURE_OR_POSTURE_DETECTED, this.closestBody.trackedGesture);
            }
            this.debounceGesture();
            //console.log(this.closestBodyDistance);
            //console.log(kinectData.translatedBodies);
            //this.bodyLanguageEvent.emit('ClosestBodyDistance', this.closestBodyDistance);
            if(this.closestBodyDistance < this.serverConf.config.interactionRadius && this.bodyIsInInteractionZone == false){
                this.bodyIsInInteractionZone = true;
                this.bodyLanguageEvent.emit(BodyLanguageProcessor.BODY_LANGUAGE_EVENTS.BODY_ENTERED_INTERACTION_ZONE, this.closestBodyDistance);
            }
            if(this.closestBodyDistance >= this.serverConf.config.interactionRadius && this.bodyIsInInteractionZone == true){
                this.bodyIsInInteractionZone = false;
                this.bodyLanguageEvent.emit(BodyLanguageProcessor.BODY_LANGUAGE_EVENTS.ALL_BODIES_LEFT_INTERACTION_ZONE, this.closestBodyDistance);
            }
            //this.currentGesture = this.closestBody.trackedGesture;
        }
    }

    debounceGesture(){
        if(Date.now() - this.TIME_THRESHHOLD > this.timeDetected){
            this.recentlyDetected = false;
        }
    }

    getClosestBody(bodies : any){
        /* Only target closest body */
        this.closestBodyDistance = 1000000;
        var distance = 0;
        bodies.forEach((body : any) => {
            var xDistance = this.serverConf.config.robotPosition.baseX - body.x;
            var yDistance = this.serverConf.config.robotPosition.baseY - body.y;
            var zDistance = this.serverConf.config.robotPosition.baseZ - body.z;

            distance = Math.sqrt(
                Math.pow(xDistance, 2) +
                Math.pow(yDistance, 2) +
                Math.pow(zDistance, 2)
            );
            
            if(distance < this.closestBodyDistance){
                this.closestBody = body;
                this.closestBodyDistance = distance;
            }
        });
    }
}