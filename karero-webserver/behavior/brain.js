import { EmotionProcessor } from './emotion-processor.js'
import { SpeechProcessor } from './speech-processor.js'
import { GesturePostureProcessor } from './gesture-posture-processor.js'
import EventEmitter from 'events';
import { Off } from './states/Off.js'
import { Follow } from './states/Follow.js'
import { Dance } from './states/Dance.js'
import { Attack } from './states/Attack.js'
import { Appreciation } from './states/Appreciation.js'
import { BriefingForExercise } from './states/BriefingForExercise.js'
import { CallToAction } from './states/CallToAction.js'
import { Farewell } from './states/Farewell.js'
import { GeneralBriefing } from './states/GeneralBriefing.js'
import { IntermediateAward } from './states/IntermediateAward.js'
import { PerformanceAnchor } from './states/PerformanceAnchor.js'
import { Welcoming } from './states/Welcoming.js'

/* KARERO Brain is the busieness logic for the KARERO robot interaction. It receives data
from versatile recognition systems; 1. atm emotional status based on facial expression emotion detection,
2. gestures/postures and Interactor location from Azure Kinetic Space. KARERO Brain is implemented as
a sort of extended state machine. */

export class Brain{

    /* Declate Events for chaning state machine mode, trigger robot movement and face actions. */
    static ROBOT_BRAIN_EVENTS = {
        ROBOT_STATE_CHANGE: 'ROBOT_STATE_CHANGE',
        ROBOT_BODY_ACTION: 'ROBOT_BODY_ACTION',
        ROBOT_FACE_ACTION: 'ROBOT_FACE_ACTION',
        TTS_ACTION: 'TTS_ACTION'
    }
  
    constructor(){

        /* Create emotion processor for emotion processing. */
        this.emotionProcessor = new EmotionProcessor();
        /* Create posture/gesture processor. */
        this.gesturePostureProcessor = new GesturePostureProcessor();
        /* Create speech to text processor. */
        this.speechProcessor = new SpeechProcessor();
        /* Emitter for events within the brain component. */
        this.brainEvents = new EventEmitter();

        /* Websocket connections to send signals to KARERO display and body. */
        this.robotBodyWS = null;
        this.robotFaceWS = null;
        this.ttsService = null;

        /* Creating all state machine states for every behavior. The start state has to be declated
        seperately. */
        this.start = new Off(this.emotionProcessor, this.gesturePostureProcessor, this.speechProcessor, this.brainEvents)
        const off = this.start.getState();
        const follow = new Follow(this.emotionProcessor, this.gesturePostureProcessor, this.speechProcessor, this.brainEvents).getState();
        const dance = new Dance(this.emotionProcessor, this.gesturePostureProcessor, this.speechProcessor, this.brainEvents).getState();
        const attack = new Attack(this.emotionProcessor, this.gesturePostureProcessor, this.speechProcessor, this.brainEvents).getState();

        const appreciation = new Appreciation(this.emotionProcessor, this.gesturePostureProcessor, this.speechProcessor, this.brainEvents).getState();
        const briefingForExercise = new BriefingForExercise(this.emotionProcessor, this.gesturePostureProcessor, this.speechProcessor, this.brainEvents).getState();
        const callToAction = new CallToAction(this.emotionProcessor, this.gesturePostureProcessor, this.speechProcessor, this.brainEvents).getState();
        const farewell = new Farewell(this.emotionProcessor, this.gesturePostureProcessor, this.speechProcessor, this.brainEvents).getState();
        const generalBriefing = new GeneralBriefing(this.emotionProcessor, this.gesturePostureProcessor, this.speechProcessor, this.brainEvents).getState();
        const intermediateAward = new IntermediateAward(this.emotionProcessor, this.gesturePostureProcessor, this.speechProcessor, this.brainEvents).getState();
        const performanceAnchor = new PerformanceAnchor(this.emotionProcessor, this.gesturePostureProcessor, this.speechProcessor, this.brainEvents).getState();
        const welcoming = new Welcoming(this.emotionProcessor, this.gesturePostureProcessor, this.speechProcessor, this.brainEvents).getState();


        this.stateMachineDefinition = {
            initialState: "off", off, follow, dance, attack, appreciation, briefingForExercise, callToAction, farewell, generalBriefing, intermediateAward, performanceAnchor, welcoming
        };
        
        /* Create the state machine with states required. */
        this.machine = this.createMachine(this.stateMachineDefinition);

        /* If a state is changed within the state machine the event is catched here and sets the next state. */
        this.brainEvents.on(Brain.ROBOT_BRAIN_EVENTS.ROBOT_STATE_CHANGE, (transition) => {
            this.state = this.machine.transition(this.state, transition)
            //console.log(`current state: ${this.state}`)
        });

        /* Whenever a state triggers a new body action on the robot arm it is transmitted from here. */
        this.brainEvents.on(Brain.ROBOT_BRAIN_EVENTS.ROBOT_BODY_ACTION, (payload) => {
            if(this.robotBodyWS != null){
                this.robotBodyWS.send(JSON.stringify(payload));
            }
        });

        /* Whenever a state triggers a new face action on the robot display it is transmitted from here. */
        this.brainEvents.on(Brain.ROBOT_BRAIN_EVENTS.ROBOT_FACE_ACTION, (payload) => {
            if(this.robotFaceWS != null){
                console.log("send " + JSON.stringify(payload));
                this.robotFaceWS.send(JSON.stringify(payload));
            }
        });

        /* Whenever a state triggers a new tts action it is transmitted from here. */
        this.brainEvents.on(Brain.ROBOT_BRAIN_EVENTS.TTS_ACTION, (text) => {
            if(this.ttsService != null){
                this.ttsService.send(JSON.stringify(text));
            }
        });

        this.state = this.machine.value;

        this.stateMachineDefinition[this.state].actions.onEnter();
    }

    /* Set the transmission websocket for robot arm action connection. */
    setBrainRobotBodyTransmissionWS(ws){
        this.robotBodyWS = ws;
         
        /* Fire enter on off state when robot arm is connected. */
        /* ToDo: Find a better implementation for this. */
        
        /*this.state = this.machine.value
        this.stateMachineDefinition[this.state].actions.onEnter();*/
    }

    /* Set the transmission websocket for robot face action connection. */
    setBrainRobotFaceTransmissionWS(ws){
        this.robotFaceWS = ws;
    }

    /* Set the transmission websocket for TTS action connection. */
    setTTSTransmissionWS(ws){
        this.ttsService = ws;
    }

    /* Process raw data of gestures/postures detection. */
    processKinectRecognition(data){
        this.gesturePostureProcessor.digest(data);
    }

    /* Process raw data of facial emotion detection. */
    processEmotionRecognition(data){
        this.emotionProcessor.digest(data);
    }

    /* Process raw data of speech detection. */
    processSpeechRecognition(data){
            this.speechProcessor.digest(data);
    }

    agentTalking(textDuration){
        this.speechProcessor.agentStartTalking(textDuration);
    }

    getStateDefinition(state, stateMachineDefinition){
        return stateMachineDefinition[state];
    };

    /* Create the base state machine. */
    createMachine(stateMachineDefinition) {
        const machine = {
            value: stateMachineDefinition.initialState, /* Initial State [String] */

            /* This is called when transitioning to another state. */
            transition(currentState, event) {

                const currentStateDefinition = stateMachineDefinition[currentState]
                var destinationTransition = null;

                /* Look for a transition whithin the current state that matches the event name. */
                currentStateDefinition.transitions.forEach((transition) => {
                    if(transition.name == event){
                        destinationTransition = transition;
                    }
                });

                /* If no transition was found break. This must not happen. */
                if (!destinationTransition) {
                    console.log("No matching transition found...")
                    return
                }
                const destinationState = destinationTransition.target;
                const destinationStateDefinition = stateMachineDefinition[destinationState];

                /* Start transition transition to target state. */
                destinationTransition.action();

                /* First call onExit when exiting the old state. */
                currentStateDefinition.actions.onExit();

                /* Then call onEnter when entering the target state. */
                destinationStateDefinition.actions.onEnter();

                /* Set current state to target state. */
                machine.value = destinationState;

                return machine.value;
            },
        }
        return machine;
    }
}