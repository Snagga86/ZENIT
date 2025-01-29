/**
 * BodyLanguageProcessor
 * 
 * A module for processing data related to body language and gestures detected by Kinect or similar devices. 
 * This class handles interaction zones, gesture detection, and emits events based on body positions 
 * and movements relative to a robot or an interaction zone.
 * 
 * Dependencies:
 * - `EventEmitter` from the `events` module for event-driven communication.
 * - `fs` module for reading configuration files.
 */

import EventEmitter from 'events';
import * as fs from 'fs';

/**
 * BodyLanguageProcessor class to handle body language and gesture-related actions and events.
 */
export class BodyLanguageProcessor {

    /** Static events related to body language processing */
    static BODY_LANGUAGE_EVENTS = {
        ALL_BODIES_LEFT_INTERACTION_ZONE: 'ALL_BODIES_LEFT_INTERACTION_ZONE', // Triggered when all bodies leave the interaction zone
        BODY_ENTERED_INTERACTION_ZONE: 'BODY_ENTERED_INTERACTION_ZONE', // Triggered when a body enters the interaction zone
        GESTURE_OR_POSTURE_DETECTED: 'GESTURE_OR_POSTURE_DETECTED' // Triggered when a gesture or posture is detected
    };

    ONLY_SWEETSPOT_BODY: boolean; // Flag to track the closest body only
    bodyLanguageEvent: EventEmitter; // EventEmitter for body language-related events
    currentGesture: string; // Stores the most recently detected gesture
    closestBody: any; // Stores the closest body data
    closestBodyDistance: number; // Distance of the closest body
    bodyIsInInteractionZone: boolean; // Tracks if any body is in the interaction zone

    rawdata: any; // Raw configuration data
    serverConf: any; // Parsed configuration data

    TIME_THRESHHOLD: number; // Threshold for gesture debounce in milliseconds
    timeDetected: number; // Timestamp of the last detected gesture
    recentlyDetected: boolean; // Tracks if a gesture was recently detected

    lastKinectUpdateTime: any; // Timestamp of the last Kinect update

    bodiesAbsent: boolean; // Tracks if all bodies have left the interaction zone

    /**
     * Constructor to initialize the BodyLanguageProcessor.
     * 
     * @param {string} configPath - Path to the configuration file.
     */
    constructor(configPath: string) {
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

    /**
     * Checks the timestamp of the last Kinect data update and triggers an event if no bodies are detected.
     */
    private checkLastKinectData(): void {
        if (Date.now() - this.lastKinectUpdateTime >= 1000 && this.bodiesAbsent === false) {
            this.closestBodyDistance = 100000000;
            console.log("All bodies left interaction zone.");
            this.bodiesAbsent = true;
            this.bodyIsInInteractionZone = false;
            this.bodyLanguageEvent.emit(BodyLanguageProcessor.BODY_LANGUAGE_EVENTS.ALL_BODIES_LEFT_INTERACTION_ZONE, this.closestBodyDistance);
        }
    }

    /**
     * Processes incoming Kinect data and emits relevant events based on body positions and gestures.
     * 
     * @param {any} kinectData - The raw Kinect data.
     */
    public digest(kinectData: any): void {
        this.lastKinectUpdateTime = Date.now();
        this.bodiesAbsent = false;

        if (this.ONLY_SWEETSPOT_BODY) {
            this.getClosestBody(kinectData.translatedBodies);
            
            if (!this.recentlyDetected && this.closestBody.trackedGesture !== "") {
                this.recentlyDetected = true;
                this.timeDetected = Date.now();
                this.bodyLanguageEvent.emit(BodyLanguageProcessor.BODY_LANGUAGE_EVENTS.GESTURE_OR_POSTURE_DETECTED, this.closestBody.trackedGesture);
            }

            this.debounceGesture();

            if (this.closestBodyDistance < this.serverConf.config.interactionRadius && !this.bodyIsInInteractionZone) {
                this.bodyIsInInteractionZone = true;
                this.bodyLanguageEvent.emit(BodyLanguageProcessor.BODY_LANGUAGE_EVENTS.BODY_ENTERED_INTERACTION_ZONE, this.closestBodyDistance);
            }

            if (this.closestBodyDistance >= this.serverConf.config.interactionRadius && this.bodyIsInInteractionZone) {
                this.bodyIsInInteractionZone = false;
                this.bodyLanguageEvent.emit(BodyLanguageProcessor.BODY_LANGUAGE_EVENTS.ALL_BODIES_LEFT_INTERACTION_ZONE, this.closestBodyDistance);
            }
        }
    }

    /**
     * Debounces gestures to prevent rapid repeated detections.
     */
    private debounceGesture(): void {
        if (Date.now() - this.TIME_THRESHHOLD > this.timeDetected) {
            this.recentlyDetected = false;
        }
    }

    /**
     * Identifies the closest body from the list of detected bodies.
     * 
     * @param {any[]} bodies - List of detected bodies.
     */
    private getClosestBody(bodies: any[]): void {
        this.closestBodyDistance = 1000000;
        let distance = 0;

        bodies.forEach((body: any) => {
            const xDistance = this.serverConf.config.robotPosition.baseX - body.x;
            const yDistance = this.serverConf.config.robotPosition.baseY - body.y;
            const zDistance = this.serverConf.config.robotPosition.baseZ - body.z;
            
            //console.log("xrob: " + this.serverConf.config.robotPosition.baseX + ", yrob: " + this.serverConf.config.robotPosition.baseY + ", zrob: " + this.serverConf.config.robotPosition.baseZ + "\n");
            //console.log("x: " + body.x + ", y: " + body.y + ", z: " + body.z + "\n");
            //console.log("xDistance: " + xDistance + ", :yDistance " + yDistance + ", zDistance: " + zDistance + "\n");

            distance = Math.sqrt(
                Math.pow(xDistance, 2) +
                Math.pow(yDistance, 2) +
                Math.pow(zDistance, 2)
            );

            if (distance < this.closestBodyDistance) {
                this.closestBody = body;
                this.closestBodyDistance = distance;
                console.log(distance);
            }
        });
    }
}
