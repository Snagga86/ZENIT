import EventEmitter from 'events';

export class GesturePostureProcessor {

    constructor() {
        this.ONLY_SWEETSPOT_BODY = true;
        this.gesturePostureEvent = new EventEmitter();
        this.currentGesture = "";
        this.closestBody;
        this.closestBodyDistance = 100000000;
    }

    digest(kinectData) {
        if(this.ONLY_SWEETSPOT_BODY == true){
            var closestBody = this.getClosestBody(kinectData.translatedBodies)
            this.gesturePostureEvent.emit('GesturePostureDetection', closestBody.trackedGesture);
            this.gesturePostureEvent.emit('ClosestBodyDistance', this.closestBodyDistance);
            this.currentGesture = closestBody.trackedGesture;
        }
    }

    getCurrentRecognition(){
        return this.currentGesture;
    }

    debounceGesture(){
        var data = JSON.parse(message.args)
        if(Date.now() - TIME_THRESHHOLD > timeDetected){
            recentlyDetected = false;
        }
    }

    getClosestBody(bodies){
        closestDistance = 1000000;
        var closestBody = null;
        bodies.forEach(element => {
            var distance = calcDistance(element.positionTracked.x, element.positionTracked.y, element.positionTracked.z);
            if(distance < closestDistance){
                closestDistance = distance;
                closestBody = element;
            }
        });
        this.closestBody = closestBody;
        this.closestBodyDistance = closestDistance;
    }

    calcDistance(x,y,z){
        const dx = x - sweetSpotX;
        const dy = y - sweetSpotY;
        const dz = z - sweetSpotZ;
        // return Math.sqrt(dx*dx + dy*dy + dz*dz);
        return Math.sqrt(dx*dx + dz*dz);
    }
}