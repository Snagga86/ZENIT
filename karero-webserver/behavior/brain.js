import { EmotionProcessor } from './emotion-processor.js'
import { GesturePostureProcessor } from './gesture-posture-processor.js'
import EventEmitter from 'events';
import { Off } from './states/Off.js'
import { Follow } from './states/Follow.js'
import { Dance } from './states/Dance.js'
import { Attack } from './states/Attack.js'

export class Brain{

    static ROBOT_BRAIN_EVENTS = {
        ROBOT_STATE_CHANGE: 'ROBOT_STATE_CHANGE',
        ROBOT_BODY_ACTION: 'ROBOT_BODY_ACTION',
        ROBOT_FACE_ACTION: 'ROBOT_FACE_ACTION'
    }
  
    constructor(){
        this.emotionProcessor = new EmotionProcessor();
        this.gesturePostureProcessor = new GesturePostureProcessor();
        this.brainEvents = new EventEmitter();

        this.robotBodyWS = null;
        this.robotFaceWS = null;

        this.start = new Off(this.emotionProcessor, this.gesturePostureProcessor, this.brainEvents)
        const off = this.start.getState();
        const follow = new Follow(this.emotionProcessor, this.gesturePostureProcessor, this.brainEvents).getState();
        const dance = new Dance(this.emotionProcessor, this.gesturePostureProcessor, this.brainEvents).getState();
        const attack = new Attack(this.emotionProcessor, this.gesturePostureProcessor, this.brainEvents).getState();

        
        this.brainEvents.on(Brain.ROBOT_BRAIN_EVENTS.ROBOT_STATE_CHANGE, (transition) => {
            console.log(this.state, ": ", transition);
            this.state = this.machine.transition(this.state, transition)
            console.log(`current state: ${this.state}`)
        });

        this.brainEvents.on(Brain.ROBOT_BRAIN_EVENTS.ROBOT_BODY_ACTION, (payload) => {
            if(this.robotBodyWS != null){
                this.robotBodyWS.send(JSON.stringify(payload));
            }
        });

        this.brainEvents.on(Brain.ROBOT_BRAIN_EVENTS.ROBOT_FACE_ACTION, (emotion) => {
            if(this.robotFaceWS != null){
                this.robotFaceWS.send(emotion);
            }
        });

        this.machine = this.createMachine({
            initialState: "off", off, follow, dance, attack
        });


    }

    setBrainRobotBodyTransmissionWS(ws){
        this.robotBodyWS = ws;
                
        this.state = this.machine.value
        this.start.enterFunction();
    }

    setBrainRobotFaceTransmissionWS(ws){
        this.robotFaceWS = ws;
    }

    processKinectRecognition(data){
        this.gesturePostureProcessor.digest(data);
    }

    processEmotionRecognition(data){
        this.emotionProcessor.digest(data);
    }

    createMachine(stateMachineDefinition) {

        const machine = {
            value: stateMachineDefinition.initialState,
            transition(currentState, event) {
            const currentStateDefinition = stateMachineDefinition[currentState]
            var destinationTransition = null;

            currentStateDefinition.transitions.forEach((transition) => {
                if(transition.name == event){
                    destinationTransition = transition;
                }
            });

            if (!destinationTransition) {
                console.log("No matching transition found...")
                return
            }
            const destinationState = destinationTransition.target
            const destinationStateDefinition =
                stateMachineDefinition[destinationState]

            destinationTransition.action()
            currentStateDefinition.actions.onExit()
            destinationStateDefinition.actions.onEnter()

            machine.value = destinationState

            return machine.value
            },
        }
        return machine
    }
}