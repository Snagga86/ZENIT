import { EmotionProcessor } from './processors/emotion-processor.js'
import { SpeechProcessor } from './processors/speech-processor.js'
import { GesturePostureProcessor } from './processors/gesture-posture-processor.js'
import EventEmitter from 'events';
import { Off } from './states/Off.js'
import { Follow } from './states/Follow.js'
import { Joy } from './states/emotions/Joy.js'
import { Anger } from './states/emotions/Anger.js'
import { Appreciation } from './states/training/Appreciation.js'
import { BriefingForExercise } from './states/training/BriefingForExercise.js'
import { CallToAction } from './states/CallToAction.js'
import { Farewell } from './states/training/Farewell.js'
import { ExerciseEntry } from './states/training/ExerciseEntry.js'
import { IntermediateAward } from './states/training/IntermediateAward.js'
import { PerformanceAnchor } from './states/training/PerformanceAnchor.js'
import { EmotionCascade } from './states/emotions/EmotionCascade.js'
import { ChatProcessor } from './processors/chat-processor.js';
import { ChatBase } from './states/ChatBase.js';

import { DisgustShow } from './states/DisgustShow.js'
import { ContemptShow } from './states/ContemptShow.js'
import { DanceShow } from './states/DanceShow.js'
import { SadnessShow } from './states/SadnessShow.js'
import { AngerShow } from './states/AngerShow.js';
import { HeatProtectionEntry } from './states/heatprotection/HeatProtectionEntry.js';
import { SubtleActivation } from './states/heatprotection/SubtleActivation.js';
import { ExplicitActivation } from './states/heatprotection/ExplicitActivation.js';
import { InformHelp } from './states/heatprotection/InformHelp.js';
import { VideoCall } from './states/heatprotection/VideoCall.js';
import { EmergencyCall } from './states/heatprotection/EmergencyCall.js';

import { FacialMimicry } from './states/facialmimicry/FacialMimicry.js';

/* KARERO Brain is the busieness logic for the KARERO robot interaction. It receives data
from versatile recognition systems; 1. atm emotional status based on facial expression emotion detection,
2. gestures/postures and Interactor location from Azure Kinetic Space. KARERO Brain is implemented as
a sort of extended state machine. */

/* neutral => neutral */
/* happy => dance, 6000 */
/* sadness => mourn 9000 */
/* anger => attack, 6500 */
/* disgust => disgust, 5000 */
/* fear => anxious, 5000 */
/* contempt => contempt, 5000 */
/* surprise => surprise, 6000 */

export class Brain{

    /* Declate Events for chaning state machine mode, trigger robot movement and face actions. */
    static ROBOT_BRAIN_EVENTS = {
        ROBOT_STATE_CHANGE: 'ROBOT_STATE_CHANGE',
        ROBOT_BODY_ACTION: 'ROBOT_BODY_ACTION',
        ROBOT_FACE_ACTION: 'ROBOT_FACE_ACTION',
        RASA_ANSWER: 'RASA_ANSWER',
        TEXT_TO_SPEECH_ACTION: 'TEXT_TO_SPEECH_ACTION',
        SPEECH_TO_TEXT_ACTION: 'SPEECH_TO_TEXT_ACTION'
    }
  
    constructor(){

        /* Create emotion processor for emotion processing. */
        this.emotionProcessor = new EmotionProcessor();
        /* Create posture/gesture processor. */
        this.gesturePostureProcessor = new GesturePostureProcessor();
        /* Create speech to text processor. */
        this.speechProcessor = new SpeechProcessor();
        /* Crerate process for chatting with rasa bot. */
        this.chatProcessor = new ChatProcessor();
        /* Emitter for events within the brain component. */
        this.brainEvents = new EventEmitter();

        /* Websocket connections to send signals to KARERO display and body. */
        this.robotBodyWS = null;
        this.robotFaceWS = null;
        this.speechSynthesisWS = null;
        this.speechTranscriptionWS = null;

        /* Creating all state machine states for every behavior. The start state has to be declated
        seperately. */
        this.start = new Off(this.emotionProcessor, this.gesturePostureProcessor, this.speechProcessor, this.brainEvents)
        const off = this.start.getState();
        const follow = new Follow(this.emotionProcessor, this.gesturePostureProcessor, this.speechProcessor, this.brainEvents).getState();
        const joy = new Joy(this.emotionProcessor, this.gesturePostureProcessor, this.speechProcessor, this.brainEvents).getState();
        const anger = new Anger(this.emotionProcessor, this.gesturePostureProcessor, this.speechProcessor, this.brainEvents).getState();

        const appreciation = new Appreciation(this.emotionProcessor, this.gesturePostureProcessor, this.speechProcessor, this.brainEvents).getState();
        const briefingForExercise = new BriefingForExercise(this.emotionProcessor, this.gesturePostureProcessor, this.speechProcessor, this.brainEvents).getState();
        const callToAction = new CallToAction(this.chatProcessor, this.emotionProcessor, this.gesturePostureProcessor, this.speechProcessor, this.brainEvents).getState();
        const farewell = new Farewell(this.emotionProcessor, this.gesturePostureProcessor, this.speechProcessor, this.brainEvents).getState();
        const exerciseEntry = new ExerciseEntry(this.emotionProcessor, this.gesturePostureProcessor, this.speechProcessor, this.brainEvents).getState();
        const intermediateAward = new IntermediateAward(this.emotionProcessor, this.gesturePostureProcessor, this.speechProcessor, this.brainEvents).getState();
        const performanceAnchor = new PerformanceAnchor(this.emotionProcessor, this.gesturePostureProcessor, this.speechProcessor, this.brainEvents).getState();
        const emotionCascade = new EmotionCascade(this.chatProcessor, this.emotionProcessor, this.gesturePostureProcessor, this.speechProcessor, this.brainEvents).getState();
        const chatBase = new ChatBase(this.chatProcessor, this.emotionProcessor, this.gesturePostureProcessor, this.speechProcessor, this.brainEvents).getState();

        const contemptShow = new ContemptShow(this.emotionProcessor, this.gesturePostureProcessor, this.speechProcessor, this.brainEvents).getState();
        const angerShow = new AngerShow(this.emotionProcessor, this.gesturePostureProcessor, this.speechProcessor, this.brainEvents).getState();
        const disgustShow = new DisgustShow(this.emotionProcessor, this.gesturePostureProcessor, this.speechProcessor, this.brainEvents).getState();
        const sadnessShow = new SadnessShow(this.emotionProcessor, this.gesturePostureProcessor, this.speechProcessor, this.brainEvents).getState();
        const danceShow = new DanceShow(this.emotionProcessor, this.gesturePostureProcessor, this.speechProcessor, this.brainEvents).getState();

        /* Heat Protection State declaration. */
        const heatProtectionEntry = new HeatProtectionEntry(this.emotionProcessor, this.gesturePostureProcessor, this.speechProcessor, this.brainEvents).getState();
        const subtleActivation = new SubtleActivation(this.emotionProcessor, this.gesturePostureProcessor, this.speechProcessor, this.brainEvents).getState();
        const explicitActivation = new ExplicitActivation(this.emotionProcessor, this.gesturePostureProcessor, this.speechProcessor, this.brainEvents).getState();
        const informHelp = new InformHelp(this.emotionProcessor, this.gesturePostureProcessor, this.speechProcessor, this.brainEvents).getState();
        const videoCall = new VideoCall(this.emotionProcessor, this.gesturePostureProcessor, this.speechProcessor, this.brainEvents).getState();
        const emergencyCall = new EmergencyCall(this.emotionProcessor, this.gesturePostureProcessor, this.speechProcessor, this.brainEvents).getState();

        const facialMimicry = new FacialMimicry(this.emotionProcessor, this.gesturePostureProcessor, this.speechProcessor, this.brainEvents).getState();

        this.stateMachineDefinition = {
            initialState: "off", off, facialMimicry, emotionCascade, joy, anger, appreciation, briefingForExercise, callToAction, farewell, exerciseEntry, intermediateAward, performanceAnchor, chatBase, angerShow, disgustShow, sadnessShow, danceShow, contemptShow, follow, heatProtectionEntry, subtleActivation, explicitActivation, informHelp, videoCall, emergencyCall
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
        this.brainEvents.on(Brain.ROBOT_BRAIN_EVENTS.TEXT_TO_SPEECH_ACTION, (text) => {
            if(this.speechSynthesisWS != null){
                this.speechSynthesisWS.send(JSON.stringify(text));
            }
        });

        this.brainEvents.on(Brain.ROBOT_BRAIN_EVENTS.SPEECH_TO_TEXT_ACTION, (payload) => {
            if(this.speechTranscriptionWS = null){
                this.speechTranscriptionWS.send(JSON.stringify(payload));
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

    /* Set the transmission websocket for text to speech action connection. */
    setSpeechSynthesisWS(ws){
        this.speechSynthesisWS = ws;
    }

    /* Set the transmission websocket for speech to text action connection. */
    setSpeechTranscriptonControlWS(ws){
        this.speechTranscriptionWS = ws;
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