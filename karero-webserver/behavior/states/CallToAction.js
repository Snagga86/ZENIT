import { State, Actions, Transition, StateWrap } from './BaseState.js';
import { Brain } from '../brain.js';
import logger from '../../tools/logger.js';
import globalStore from '../../tools/globals.js';
import readline from 'readline';



/* Robot state class defining the robot behavior within this state */
export class CallToAction extends StateWrap{
    constructor(emotionProcessor, gesturePostureProcessor, speechProcessor, brainEvents){

        /* Call the super constructor and set the identification name for the state class */
        super("callToAction", emotionProcessor, gesturePostureProcessor, speechProcessor, brainEvents);

        /* Bind concrete implementation functions for enter and exit of the current state. */
        this.state.actions.onEnter = this.enterFunction.bind(this);
        this.state.actions.onExit = this.exitFunction.bind(this);

        /* Add transitions to the other states to build the graph.
        The transition is called after the state was left but before the new state is entered. */
        this.state.transitions.push(new Transition("welcoming", "welcoming", () => {
            console.log('transition action for "callToAction" in "welcoming" state')
        }));

        this.timeout;

        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
          });
    }

    getTextInput() {
        this.rl.question('Enter some text (or type "exit" to quit): ', (text) => {
          if (text.toLowerCase() === 'exit') {
            this.rl.close();
          } else {
            var payload = {
                "mode":"tts",
                "text": text
            }
            console.log("before emit");
            this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.TTS_ACTION, payload);
            this.getTextInput(); // Repeat the prompt
          }
        });
      }

    /* Enter function is executed whenever the state is activated. */
    enterFunction(){

        logger(globalStore.filename, "StateChange", "CallToAction");
        /* Set the payload for robot mode activation over websocket.
        mode: setMode | DataSupply
        activity: The strategy interpreted and executed by the connected robot device */

        /* Add the event listener to listen on GesturePostureDetection events.
        Execute gesturePostureRecognition function on received detections. */
        this.gesturePostureProcessor.gesturePostureEvent.on('ClosestBodyDistance', this.closestBodyRecognition.bind(this));
        //this.emotionProcessor.emotionEvent.on('EmotionDetection', this.emotionRecognition.bind(this));
        var payload = {
            "mode" : "setEmotion",
            "data" : "Idle1"
        }
        this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_FACE_ACTION, payload);

        this.speechProcessor.speechEvent.on('WakeUp', this.wakeUpAgent.bind(this));
        this.speechProcessor.speechEvent.on('FinalResult', this.finalResultProcessing.bind(this));

        this.followHead();

        //this.getTextInput();
        //process.stdin.on('keypress', this.keyPressHandler);
        //process.stdin.resume();

    }

    wakeUpAgent(){
        var facePayload = {
            "mode" : "setSound",
            "data" : "nameAndPlay",
            "extra" : "wakeUpSound"
        }

        console.log("Sending Wake Up Text to speak to display device...")
        this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_FACE_ACTION, facePayload)
    }

    finalResultProcessing(resultText){
        console.log("final result: " + resultText );
        var payload = {
            "mode" : "tts",
            "text" : resultText
        }
        this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.TTS_ACTION, payload);
    }

    keyPressHandler = (ch, key) =>{
        if (key && key.name === 'a') {
            // 'Enter' key was pressed, react accordingly
            console.log('a key pressed');
            var payload = [{
                "mode" : "tts",
                "text" : "Hallo, ich bin Fred das Kuscheltier."
            },
            {
                "mode" : "tts",
                "text" : "Ich mag mit dir tanzen."
            },
            {
                "mode" : "tts",
                "text" : "Ich bin Zenieth, wie geht es dir?"
            },
            {
                "mode" : "tts",
                "text" : "Wer ein glückliches Leben führen will, muss sich selbst kennen. Die Frage „Wer bin ich?“ ist deshalb zentral für beruflichen Erfolg ebenso wie für persönlichen. Zu wissen, wer man ist, was man wirklich will und wohin – das sind die wichtigsten Erkenntnisse im Leben überhaupt. Die Antworten darauf zu finden, ist allerdings nicht leicht. Oft gleicht es einem lebenslangen Prozess."
            }];

            // Generate a random number between 1 and 5 (inclusive)
            const randomNumber = Math.floor(Math.random() * 4);

            console.log(randomNumber);


            this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.TTS_ACTION, payload[randomNumber]);
            // You can perform other actions here
        } else if (key && key.ctrl && key.name === 'c') {
            // Ctrl + C was pressed, exit the program
            process.exit();
        } else {
            // Other key presses
            console.log(`Key pressed: ${ch}`);
        }
        console.log('Press Enter or any other key (Ctrl + C to exit):');
    }

    /* Exit function is executed whenever the state is left. */
    exitFunction(){

        /* Turn off event listener if state is exited. */
        this.gesturePostureProcessor.gesturePostureEvent.removeAllListeners('ClosestBodyDistance', this.closestBodyRecognition);
        clearTimeout(this.timeout);
        //this.emotionProcessor.emotionEvent.removeAllListeners('EmotionDetection', this.emotionRecognition);
    }

    /* Interpretion function of received data coming from Azure Kinectic Space. */
    closestBodyRecognition(distance){
        /* If the arnold gesture was detected the robot changes its state to attack. */
        if(distance <= globalStore.welcomeDistance){

            /* Emit the attack state change event. */
            this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_STATE_CHANGE, "welcoming");
        }
    }

    seekAttention(){
        var payload = {
            "mode" : "setMode",
            "activity" : "seekAttention"
        }

        /* Send the activity change to the KARERO brain. */
        this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_BODY_ACTION, payload);

        this.timeout = setTimeout(() => {
            this.followHead();
        }, 4500);
    }

    followHead(){
        var payload = {
            "mode" : "setMode",
            "activity" : "followHead"
        }

        /* Send the activity change to the KARERO brain. */
        this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_BODY_ACTION, payload)

        this.timeout = setTimeout(() => {
            this.seekAttention();
        }, 7000);
    }
}