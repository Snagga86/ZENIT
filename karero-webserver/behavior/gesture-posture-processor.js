import EventEmitter from 'events';

export class GesturePostureProcessor {

    constructor() {
        this.gesturePostureEvent = new EventEmitter();
        this.currentGesture = "";
    }

    digest(kinectData) {
        this.gesturePostureEvent.emit('GesturePostureDetection', kinectData.translatedBodies[0].trackedGesture);
        this.currentGesture = kinectData.translatedBodies[0].trackedGesture;
    }

    getCurrentRecognition(){
        return this.currentGesture;
    }
}