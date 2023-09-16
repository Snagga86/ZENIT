import EventEmitter from 'events';

export class SpeechProcessor {

    constructor() {

        this.speechEvent = new EventEmitter();
        this.agentIsTalking = false;
        this.talkingStart = 0;
        this.talkingEnd = 0;

    }

    agentStartTalking(duration){
        this.agentIsTalking = true;
        console.log(this.agentIsTalking);
        this.talkingStart = Date.now();
        var timeToAddSeconds = parseInt(duration);

        // Convert the Unix timestamp from milliseconds to seconds
        var unixTimestampSeconds = this.talkingStart / 1000;

        // Add the time in seconds
        var newUnixTimestampSeconds = unixTimestampSeconds + timeToAddSeconds;

        // Convert the result back to milliseconds
        this.talkingEnd = Math.floor(newUnixTimestampSeconds * 1000);
    }

    digest(textInput) {
        //console.log("digest");
        //console.log(Date.now());
        //console.log(this.talkingEnd);
        if(Date.now() >= this.talkingEnd){
            this.agentIsTalking = false;
            console.log("this.agentIsTalking = false");
        }

        if(!this.agentIsTalking){
            
            var splitText = textInput.split(' : ');
            if(splitText[0].includes("partial")){
                if(splitText[1].includes("zenit") || splitText[1].includes("zenith")){
                    this.speechEvent.emit("WakeUp");
                }
            }
            else if(splitText[0].includes("text")){
                {
                    this.speechEvent.emit("FinalResult", splitText[1].substring(1, splitText[1].length-3));
                }
            }
        }
    }
}