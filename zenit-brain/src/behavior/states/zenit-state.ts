/**
 * Robotic System Framework
 * 
 * This framework defines a collection of classes for managing a robot's state, 
 * actions, emotions, display devices, and processors for interacting with sensors 
 * and external inputs. It acts as a **wrapper and facade** that abstracts the complexities
 * of these systems, offering a simplified and unified interface for controlling and monitoring
 * the robot's functionality.
 * 
 * Dependencies:
 * - `EventEmitter` from the `stream` module for event-driven communication.
 * - `Brain` module for robot brain event management.
 * - `PhoneCamProcessor`, `BodyLanguageProcessor`, and `SpeechProcessor` for sensor data processing.
 */

import { EventEmitter } from 'stream';
import { Brain } from '../brain.js';
import { PhoneCamProcessor } from '../processors/phone-cam-processor.js';
import { BodyLanguageProcessor } from '../processors/body-language-processor.js';
import { SpeechProcessor } from '../processors/speech-processor.js';

/**
 * State class representing a state in the robot's state machine.
 */
export class StateController {
    public target: string; // Name of the state
    public actions: Actions; // Actions associated with the state
    public transitions: Transition[]; // Transitions available from the state

    constructor(stateName: string) {
        this.target = stateName;
        this.actions = new Actions();
        this.transitions = [];
    }
}

/**
 * Actions class defining entry and exit actions for a state.
 */
export class Actions {
    public onEnter: Function; // Function to execute when entering the state
    public onExit: Function; // Function to execute when exiting the state

    constructor() {
        this.onEnter = () => {};
        this.onExit = () => {};
    }
}

/**
 * Transition class representing a transition between states in the state machine.
 */
export class Transition {
    public name: string; // Name of the transition
    public target: string; // Target state
    public action: Function; // Action to execute during the transition

    constructor(name: string, target: string, action: Function) {
        this.target = target;
        this.name = name;
        this.action = action;
    }
}

/**
 * RoboticArm class for managing robotic arm actions.
 */
export class RoboticArm {
    public brainEvents: EventEmitter; // EventEmitter for brain events

    /**
     * Constructor initializes the RoboticArm instance.
     * @param {EventEmitter} brainEvents - EventEmitter for managing brain interactions.
     */
    constructor(brainEvents: EventEmitter) {
        this.brainEvents = brainEvents;
    }

    /**
     * Executes a body action by emitting the appropriate event.
     * @param {string} action - The action to be performed by the robotic arm.
     */
    public bodyAction(action: string): void {
        const payload = {
            mode: "setMode",
            activity: action
        };
        this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_BODY_ACTION, payload);
    }

/**
 * Triggers the robot to seek attention.
 */
    public seekAttention() { this.bodyAction("seekAttention"); }
    /**
     * Commands the robot to follow the head's position as a percentage of the display area.
     */
    public followHeadPercentages() { this.bodyAction("followHeadPercentages"); }
    /**
     * Commands the robot to follow the head's position directly.
     */
    public followHead() { this.bodyAction("followHead"); }
    /**
     * Commands the robot to follow the head's vertical movements.
     */
    public followHeadVertical() { this.bodyAction("followHeadVertical"); }
    /**
     * Sets the robot's arm to a neutral position.
     */
    public neutral() { this.bodyAction("neutral"); }
    /**
     * Displays an angry posture using the robotic arm.
     */
    public anger() { this.bodyAction("anger"); }
    /**
     * Displays contempt using the robotic arm's posture.
     */
    public contempt() { this.bodyAction("contempt"); }
    /**
     * Displays disgust using the robotic arm's posture.
     */
    public disgust() { this.bodyAction("disgust"); }
    /**
     * Displays fear using the robotic arm's posture.
     */
    public fear() { this.bodyAction("fear"); }
    /**
     * Displays joy using the robotic arm's posture.
     */
    public joy() { this.bodyAction("joy"); }
    /**
     * Displays sadness using the robotic arm's posture.
     */
    public sadness() { this.bodyAction("sadness"); }
    /**
     * Displays surprise using the robotic arm's posture.
     */
    public surprise() { this.bodyAction("surprise"); }
    /**
     * Commands the robot to transition into a nap posture.
     */
    public nap() { this.bodyAction("nap"); }
    /**
     * Commands the robot to wake from a nap posture.
     */
    public napWake() { this.bodyAction("napWake"); }
    /**
     * Commands the robot to transition into a relaxed posture.
     */
    public relax() { this.bodyAction("relax"); }
    /**
     * Commands the robot to perform a stretching action.
     */
    public stretch() { this.bodyAction("stretch"); }
    /**
     * Commands the robot to perform a yawning action.
     */
    public jawn() { this.bodyAction("jawn"); }
    /**
     * Commands the robot to adopt "look1" posture.
     */
    public look1() { this.bodyAction("look1"); }
    /**
     * Commands the robot to adopt "look2" posture.
     */
    public look2() { this.bodyAction("look2"); }
    /**
     * Commands the robot to adopt "look3" posture.
     */
    public look3() { this.bodyAction("look3"); }
}

/**
 * Video class for managing video actions on the robot's display.
 */
export class Video {
    public brainEvents: EventEmitter;

    /**
     * Constructor initializes the Video instance.
     * @param {EventEmitter} brainEvents - EventEmitter for managing brain interactions.
     */
    constructor(brainEvents: EventEmitter) {
        this.brainEvents = brainEvents;
    }

    /**
     * Sets video action with optional extra data.
     * @param {string} data - Video action data.
     * @param {string} [extra=""] - Additional data for the action.
     */
    public setVideo(data: string, extra: string = ""): void {
        const payload = {
            mode: "setVideo",
            data,
            extra
        };
        this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_FACE_ACTION, payload);
    }

    public show() { this.setVideo("show"); }
    public hide() { this.setVideo("hide"); }
    public start() { this.setVideo("start"); }
    public stop() { this.setVideo("stop"); }
    public name(name: string) { this.setVideo("name", name); }
    public showAndPlay(name: string) { this.setVideo("showAndPlay", name); }
    public stopAndHide() { this.setVideo("stopAndHide"); }
}

/**
 * Emotion class for managing robot's emotions.
 */
export class Emotion {
    public brainEvents: EventEmitter;

    /**
     * Constructor initializes the Emotion instance.
     * @param {EventEmitter} brainEvents - EventEmitter for managing brain interactions.
     */
    constructor(brainEvents: EventEmitter) {
        this.brainEvents = brainEvents;
    }

    /**
     * Sets the emotion on the robot's display.
     * @param {string} emotion - The emotion to display.
     */
    public setEmotion(emotion: string): void {
        const payload = {
            mode: "setEmotion",
            data: emotion
        };
        this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_FACE_ACTION, payload);
    }

    /**
     * Sets the emotion to "annoyance".
     */
    public annoyance(): void {
        this.setEmotion("annoyance");
    }

    /**
     * Sets the emotion to "anger".
     */
    public anger(): void {
        this.setEmotion("anger");
    }

    /**
     * Sets the emotion to "rage".
     */
    public rage(): void {
        this.setEmotion("rage");
    }

    /**
     * Sets the emotion to "vigilance".
     */
    public vigilance(): void {
        this.setEmotion("vigilance");
    }

    /**
     * Sets the emotion to "anticipation".
     */
    public anticipation(): void {
        this.setEmotion("anticipation");
    }

    /**
     * Sets the emotion to "interest".
     */
    public interest(): void {
        this.setEmotion("interest");
    }

    /**
     * Sets the emotion to "serenity".
     */
    public serenity(): void {
        this.setEmotion("serenity");
    }

    /**
     * Sets the emotion to "joy".
     */
    public joy(): void {
        this.setEmotion("joy");
    }

    /**
     * Sets the emotion to "ecstasy".
     */
    public ecstasy(): void {
        this.setEmotion("ecstasy");
    }

    /**
     * Sets the emotion to "acceptance".
     */
    public acceptance(): void {
        this.setEmotion("acceptance");
    }

    /**
     * Sets the emotion to "trust".
     */
    public trust(): void {
        this.setEmotion("trust");
    }

    /**
     * Sets the emotion to "admiration".
     */
    public admiration(): void {
        this.setEmotion("admiration");
    }

    /**
     * Sets the emotion to "apprehension".
     */
    public apprehension(): void {
        this.setEmotion("apprehension");
    }

    /**
     * Sets the emotion to "fear".
     */
    public fear(): void {
        this.setEmotion("fear");
    }

    /**
     * Sets the emotion to "terror".
     */
    public terror(): void {
        this.setEmotion("terror");
    }

    /**
     * Sets the emotion to "distraction".
     */
    public distraction(): void {
        this.setEmotion("distraction");
    }

    /**
     * Sets the emotion to "surprise".
     */
    public surprise(): void {
        this.setEmotion("surprise");
    }

    /**
     * Sets the emotion to "amazement".
     */
    public amazement(): void {
        this.setEmotion("amazement");
    }

    /**
     * Sets the emotion to "pensiveness".
     */
    public pensiveness(): void {
        this.setEmotion("pensiveness");
    }

    /**
     * Sets the emotion to "sadness".
     */
    public sadness(): void {
        this.setEmotion("sadness");
    }

    /**
     * Sets the emotion to "grief".
     */
    public grief(): void {
        this.setEmotion("grief");
    }

    /**
     * Sets the emotion to "boredom".
     */
    public boredom(): void {
        this.setEmotion("boredom");
    }

    /**
     * Sets the emotion to "disgust".
     */
    public disgust(): void {
        this.setEmotion("disgust");
    }

    /**
     * Sets the emotion to "loathing".
     */
    public loathing(): void {
        this.setEmotion("loathing");
    }

    /**
     * Sets the emotion to "contempt".
     */
    public contempt(): void {
        this.setEmotion("contempt");
    }

    /**
     * Sets the emotion to "neutral".
     */
    public neutral(): void {
        this.setEmotion("neutral");
    }

    /**
     * Sets the state to "thirsty".
     */
    public thirsty(): void {
        this.setEmotion("thirsty");
    }

    /**
     * Sets the state to "hot".
     */
    public hot(): void {
        this.setEmotion("hot");
    }

    /**
     * Sets the state to "sleepy".
     */
    public sleepy(): void {
        this.setEmotion("sleepy");
    }
}

/**
 * Sound class for managing sound actions on the robot.
 */
export class Sound {
    public brainEvents: EventEmitter;

    /**
     * Constructor initializes the Sound instance.
     * @param {EventEmitter} brainEvents - EventEmitter for managing brain interactions.
     */
    constructor(brainEvents: EventEmitter) {
        this.brainEvents = brainEvents;
    }

    /**
     * Sets the sound action with optional extra data.
     * @param {string} data - Sound action data.
     * @param {string} [extra=""] - Additional data for the action.
     */
    public setSound(data: string, extra: string = ""): void {
        const payload = {
            mode: "setSound",
            data,
            extra
        };
        this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_FACE_ACTION, payload);
    }

    /**
     * Plays the sound.
     */
    public play(): void {
        this.setSound("play");
    }

    /**
     * Stops the sound.
     */
    public stop(): void {
        this.setSound("stop");
    }

    /**
     * Sets the name of the sound.
     * @param name - The name of the sound to set.
     */
    public name(name: string): void {
        this.setSound("name", name);
    }

    /**
     * Sets the name of the sound and plays it.
     * @param name - The name of the sound to set and play.
     */
    public nameAndPlay(name: string): void {
        this.setSound("nameAndPlay", name);
    }

    /**
     * Initiates text-to-speech (TTS) with the given text.
     * @param {string} text - The text to be spoken by the robot.
     */
    public speak(text: string): void {
        const payloadTTS = {
            mode: "tts",
            text
        };
        this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.TEXT_TO_SPEECH_ACTION, payloadTTS);
    }
}

/**
 * Text class for managing text display actions on the robot.
 */
export class Text {
    public brainEvents: EventEmitter;

    /**
     * Constructor initializes the Text instance.
     * @param {EventEmitter} brainEvents - EventEmitter for managing brain interactions.
     */
    constructor(brainEvents: EventEmitter) {
        this.brainEvents = brainEvents;
    }

    /**
     * Displays the specified text.
     * @param {string} name - The text to display.
     */
    public text(name: string): void {
        this.setText("text", name);
    }

    /**
     * Shows the text on the display.
     */
    public show(): void {
        this.setText("show");
    }

    /**
     * Hides the text from the display.
     */
    public hide(): void {
        this.setText("hide");
    }

    /**
     * Sets the text action with optional extra data.
     * @param {string} data - Text action data.
     * @param {string} [extra=""] - Additional data for the action.
     */
    public setText(data: string, extra: string = ""): void {
        const payloadText = {
            mode: "setInfoText",
            data,
            extra
        };
        this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_FACE_ACTION, payloadText);
    }
}

/** 
 * A class the represents all actions avalaible for interaction with the display device (mobile phone). 
*/

export class DisplayDevice {
    public brainEvents: EventEmitter;
    public emotion: Emotion;
    public video: Video;
    public sound: Sound;
    public text: Text;

    /**
     * Constructor initializes DisplayDevice components (emotion, video, sound, text).
     * @param {EventEmitter} brainEvents - EventEmitter for managing brain interactions.
     */
    constructor(brainEvents: EventEmitter) {
        this.brainEvents = brainEvents;
        this.emotion = new Emotion(brainEvents);
        this.video = new Video(brainEvents);
        this.sound = new Sound(brainEvents);
        this.text = new Text(brainEvents);
    }

    /**
     * Adds a speech visual to the display based on the provided length.
     * @param {number} length - Duration of the speech visual.
     */
    public addSpeechVisual(length: number): void {
        const payloadState = {
            mode: "setState",
            data: "speechVisual",
            extra: length.toString()
        };
        this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_FACE_ACTION, payloadState);
    }

    /**
     * Initiates calculation visual on the display.
     */
    public calculate(): void {
        const payloadState = {
            mode: "setState",
            data: "calculate"
        };
        this.brainEvents?.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_FACE_ACTION, payloadState);
    }

    /**
     * Stops the calculation visual on the display.
     */
    public stopCalculate(): void {
        const payloadState = {
            mode: "setState",
            data: "stopCalculate"
        };
        this.brainEvents?.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_FACE_ACTION, payloadState);
    }
}

/**
 * StateWrap class managing the overall state and interactions of the robot.
 */
export class ZENITState {
    public stateChangeInitiated: boolean; // Indicates if a state change is ongoing.
    public emotionProcessor: PhoneCamProcessor; // Emotion processor instance.
    public bodyLanguageProcessor: BodyLanguageProcessor; // Body language processor instance.
    public speechProcessor: SpeechProcessor; // Speech processor instance.
    public brainEvents: EventEmitter; // EventEmitter for brain interactions.
    public state: StateController; // Current state of the robot.
    public RoboticBody: RoboticArm; // Robotic arm instance for physical actions.
    public ScreenFace: DisplayDevice; // Display device instance for visual interactions.

    /**
     * Constructor initializes StateWrap components.
     * @param {string} stateName - Initial state name.
     * @param {PhoneCamProcessor} emotionProcessor - Processor for handling emotions.
     * @param {BodyLanguageProcessor} bodyLanguageProcessor - Processor for body language.
     * @param {SpeechProcessor} speechProcessor - Processor for speech input.
     * @param {EventEmitter} brainEvents - EventEmitter for brain interactions.
     */
    constructor(
        stateName: string,
        emotionProcessor: PhoneCamProcessor,
        bodyLanguageProcessor: BodyLanguageProcessor,
        speechProcessor: SpeechProcessor,
        brainEvents: EventEmitter
    ) {
        this.stateChangeInitiated = false;
        this.emotionProcessor = emotionProcessor;
        this.bodyLanguageProcessor = bodyLanguageProcessor;
        this.speechProcessor = speechProcessor;
        this.brainEvents = brainEvents;
        this.state = new StateController(stateName);
        this.RoboticBody = new RoboticArm(this.brainEvents);
        this.ScreenFace = new DisplayDevice(this.brainEvents);
    }

    /**
     * Retrieves the current state.
     * @returns {StateController} - The current state instance.
     */
    public getState(): StateController {
        return this.state;
    }

    /**
     * Placeholder function for handling gesture and posture detection.
     * @param {any} rec - Input data for gesture/posture detection.
     */
    public GesturePostureDetection(rec: any): void {
        // Implement detection logic here.
    }
}