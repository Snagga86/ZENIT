import EventEmitter from 'events';
import * as fs from 'fs';


export class GesturePostureProcessor {

    constructor() {
        this.ONLY_SWEETSPOT_BODY = true;
        this.gesturePostureEvent = new EventEmitter();
        this.currentGesture = "";
        this.closestBody;
        this.closestBodyDistance = 100000000;

        this.rawdata = fs.readFileSync('./server-conf.json');
        this.serverConf = JSON.parse(this.rawdata);
    }

    digest(kinectData) {
        if(this.ONLY_SWEETSPOT_BODY == true){
            this.getClosestBody(kinectData.translatedBodies);
            this.gesturePostureEvent.emit('GesturePostureDetection', this.closestBody.trackedGesture);
            this.gesturePostureEvent.emit('ClosestBodyDistance', this.closestBodyDistance);
            this.currentGesture = this.closestBody.trackedGesture;
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