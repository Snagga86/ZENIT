import { Mecharm } from "./mecharm.js";
import { ANIMATIONS} from "./static-arm-animations.js";
import pkg from  "osc-js";

const neutralPose = [0,-45,10,0,35,0];
const lurkPose = [0,-45,10,90,35,-90];
const sadPose = [0,-45,45,10,44,-20];
const happyPose = [25,-45,45,10,44,-20];
const angryPose = [25,-45,45,10,44,-20];

const danceLeftUp = [-20,-25,-30,-10,15,-5];

var mecharm = new Mecharm();
mecharm.setCoordinates(1.15,0.35);

//console.log(ANIMATIONS);
/*
mecharm.sync_send_angles(ANIMATIONS.DANCE_STD[0], 25);

mecharm.sync_send_angles(ANIMATIONS.DANCE_STD[1], 25);
mecharm.sync_send_angles(ANIMATIONS.DANCE_STD[2], 25);
*/

mecharm.send_angles(neutralPose, 0);
/*
//sss();
function sss(){
    setTimeout(() => {
        mecharm.send_angle(1, 90, 44);
        setTimeout(() => {
            //mecharm.send_angles_single([[1,90, 88],[2, 40, 88]]);
            //sss();
            mecharm.send_angle(1, 0, 44);
            setTimeout(() => {
                //mecharm.send_angles_single([[1,90, 88],[2, 40, 88]]);
                //sss();
                mecharm.send_angle(2, 20, 44);
             }, 20);
         }, 500);
     }, 1500);
}*/

const osc = new pkg() // defaults to WebsocketClientPlugin
osc.open({ host: '127.0.0.1', port: 9123 })
console.log(osc.status);

var rota = 0;

osc.on('/data', message => {
    //console.log(message.args); // prints the message arguments
    var data = JSON.parse(message.args)
    rota = mecharm.rotateBaseToTarget(Number(data.translatedBodies[0].x) * 100, Number(data.translatedBodies[0].z) * 100)
});

follow();

function follow(){
    setTimeout(() => {
        //mecharm.send_angles_single([[1,90, 88],[2, 40, 88]]);
        //sss();
        mecharm.send_angle(1,  Math.floor(rota), 44);
        follow();
     }, 1500);
};


//animate("DANCE_STD");

//mecharm.send_angle(1, 90, 0);

//mecharm.send_angles_single([[1,-10, 0],[2, 40, 0]]);
//mecharm.send_angle(2,30,0);
//mecharm.send_angles(neutralPose, 100);
/*setTimeout(() => {
    console.log("angles 2");
    
    mecharm.send_angle(6, -90, 100);
 }, 800);
console.log("reset");
setTimeout(() => { 
    console.log("angles 1");
    mecharm.send_angle(1, -90, 44);
    mecharm.send_angle(2, 0, 0);
    mecharm.send_angle(3, -30, 100);
    mecharm.send_angle(4, 40, 50);

    setTimeout(() => {
        console.log("angles 2");
        mecharm.send_angle(1, 60, 100);
        mecharm.send_angle(2, 20, 10);
     }, 800);

}, 3000); */



function animate(movementPattern, method="send_angles", timeMultiplier=1.0){
    console.log(ANIMATIONS[movementPattern]);
}

//setTimeout(centerOne, 500);

function leftUp(){
    mecharm.send_angles(ANIMATIONS.DANCE_STD[0][0], ANIMATIONS.DANCE_STD[1][0]);
    setTimeout(centerOne, 800);
}

function rightUp(){
    mecharm.send_angles(ANIMATIONS.DANCE_STD[0][2], ANIMATIONS.DANCE_STD[1][0]);
    setTimeout(centerTwo, 800);
}

function centerOne(){
    mecharm.send_angles(ANIMATIONS.DANCE_STD[0][1], ANIMATIONS.DANCE_STD[1][0]);
    setTimeout(rightUp, 800);
}

function centerTwo(){
    mecharm.send_angles(ANIMATIONS.DANCE_STD[0][1], ANIMATIONS.DANCE_STD[1][0]);
    setTimeout(leftUp, 800);
}

/*
setTimeout(() => { 
    mecharm.sync_send_angles(sadPose, 5);
    mecharm.send_angle(1, -50, 55);
}, 3000);

setTimeout(() => {  
    mecharm.send_angle(1, 0, 55);
}, 2000);


setTimeout(() => {  
    mecharm.sync_send_angles(sadPose, 30);
}, 1500);

setTimeout(() => {  
    mecharm.send_angle(1, -50, 55);
}, 2000);*/
