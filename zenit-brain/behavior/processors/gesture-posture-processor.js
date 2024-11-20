import EventEmitter from 'events';
import * as fs from 'fs';


export class GesturePostureProcessor {

    constructor() {
        this.ONLY_SWEETSPOT_BODY = true;
        this.gesturePostureEvent = new EventEmitter();
        this.currentGesture = "";
        this.closestBody;
        this.closestBodyDistance = 100000000;
        this.INTERACTION_DISTANCE = 1500;

        this.rawdata = fs.readFileSync('./server-conf.json');
        this.serverConf = JSON.parse(this.rawdata);

        this.TIME_THRESHHOLD = 2600;
        this.timeDetected = 0;
        this.recentlyDetected = false;
    }

    digest(kinectData) {
        if(this.ONLY_SWEETSPOT_BODY == true){
            this.getClosestBody(kinectData.translatedBodies);
            if(this.recentlyDetected == false && this.closestBody.trackedGesture != ""){
                this.recentlyDetected = true;
                this.timeDetected = Date.now();
                this.gesturePostureEvent.emit('GesturePostureDetection', this.closestBody.trackedGesture);
            }
            this.debounceGesture();
            this.gesturePostureEvent.emit('ClosestBodyDistance', this.closestBodyDistance);
            if(this.closestBodyDistance < this.INTERACTION_DISTANCE && this.bodyIsInInteractionZone == false){
                this.bodyIsInInteractionZone = true;
                this.gesturePostureEvent.emit('BodiesEnteredInteractionZone', this.closestBodyDistance);
            }
            if(this.closestBodyDistance >= this.INTERACTION_DISTANCE && this.bodyIsInInteractionZone == true){
                this.bodyIsInInteractionZone = false;
                this.gesturePostureEvent.emit('BodiesLeftInteractionZone', this.closestBodyDistance);
            }
            //this.currentGesture = this.closestBody.trackedGesture;
        }
    }

    debounceGesture(){
        if(Date.now() - this.TIME_THRESHHOLD > this.timeDetected){
            this.recentlyDetected = false;
        }
    }

    getClosestBody(bodies){
        /* Only target closest body */
        this.closestBodyDistance = 1000000;
        var distance = 0;
        bodies.forEach(body => {
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
                //
            }
        });
    }
}