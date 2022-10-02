import { clear } from 'node:console';
import dgram from 'node:dgram';

export class Mecharm{

    constructor(ip="192.168.0.102", port=6789, baseRotationDeg = -90) {

        this.serverRobot = dgram.createSocket('udp4');
        this.rIp = ip;
        this.rPort = port;
        this.baseRotationDeg = baseRotationDeg;
        this.x = 0;
        this.z = 0;
        this.serverRobot.on('message', (msg, _) => {
            //console.log("here");
            console.log(msg.toString());
        });
    }

    send_angle(id, degree, speed){
        this.serverRobot.send("send_angle," + id + "," + degree + "," + speed, this.rPort, this.rIp);
    }

    send_angles(degrees, speed){
        this.serverRobot.send("send_angles," + degrees +  "," + speed, this.rPort, this.rIp);
    }

    send_angles_single(singleAngles){
        var i = 0;
        while(i < singleAngles.length){
            this.send_angle(singleAngles[i][0],singleAngles[i][1],singleAngles[i][2]);
            i++;
        }
    }

    get_radians(){
        this.serverRobot.send("get_radians", this.rPort, this.rIp);
    }

    sync_send_angles(degrees, speed, timeout=7){
        this.serverRobot.send("sync_send_angles," + degrees +  "," + speed + "," + timeout, this.rPort, this.rIp);
    }

    rotateBaseToTarget(x, z){
        //console.log(this.x, this.z);
        //console.log(x, z);
        var xDirecton = this.x * 100 - x;
        var zDirection = this.z * 100 - z;
        //console.log(xDirecton, zDirection);

        var x1 = this.x * 100;
        var x2 = x;
        var z1 = this.z * 100;
        var z2 = z;

        //console.log("Robot Pos: [" + x1 + "|" + z1 + "]");
        //console.log("My Pos: [" + x2 + "|" + z2 + "]");

        /*var x1 = 100;
        var z1 = 100;
        var x2 = 200;    
        var z2 = 200;*/

        var angle = Math.atan2(z2 - z1, x2 - x1) * 180 / Math.PI - 90;
        if (angle < 0) angle = angle + 360;
        //console.log("angle: " + angle );
        angle = angle + this.baseRotationDeg;
        return -1 * angle;
    }

    setCoordinates(x, z){
        this.x = x;
        this.z = z;
    }
}