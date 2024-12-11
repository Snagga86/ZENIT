import { EventEmitter } from 'stream';
import { Brain } from '../brain.js';
import { PhoneCamProcessor } from '../processors/phone-cam-processor.js';
import { BodyLanguageProcessor } from '../processors/body-language-processor.js';
import { SpeechProcessor } from '../processors/speech-processor.js';

export class State{

    target : string;
    actions : any;
    transitions : any;

    constructor(stateName : string){
        this.target = stateName;
        this.actions = new Actions();
        this.transitions = new Array();
    }
}

export class Actions{

    onEnter : Function;
    onExit : Function;

    constructor(){
        this.onEnter = function(){};
        this.onExit = function(){};
    }
}

export class Transition{

    name : any;
    target : any;
    action : any;

    constructor(name : any, target : any, action : any){
        this.target = target;
        this.name = name;
        this.action = action;
    }
}

export class RoboticArm{

    brainEvents : any;

    constructor(brainEvents : EventEmitter){
        this.brainEvents = brainEvents;
    }

    seekAttention(){
        this.bodyAction("seekAttention");
    }

    followHeadPercentages(){
        this.bodyAction("followHeadPercentages");
    }

    followHead(){
        this.bodyAction("followHead");
    }

    followHeadVertical(){
        this.bodyAction("followHeadVertical");
    }

    neutral(){
        this.bodyAction("neutral");
    }

    anger(){
        this.bodyAction("anger");
    }

    contempt(){
        this.bodyAction("contempt");
    }

    disgust(){
        this.bodyAction("disgust");
    }

    fear(){
        this.bodyAction("fear");
    }

    joy(){
        this.bodyAction("joy");
    }

    sadness(){
        this.bodyAction("sadness");
    }

    surprise(){
        this.bodyAction("surprise");
    }

    jawn(){
        this.bodyAction("jawn");
    }

    look1(){
        this.bodyAction("look1");
    }

    look2(){
        this.bodyAction("look2");
    }

    look3(){
        this.bodyAction("look3");
    }

    nap(){
        this.bodyAction("nap");
    }

    napWake(){
        this.bodyAction("napWake");
    }

    relax(){
        this.bodyAction("relax");
    }

    stretch(){
        this.bodyAction("stretch");
    }

    bodyAction(action : String){
        var payload = {
            "mode" : "setMode",
            "activity" : action
        }

        this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_BODY_ACTION, payload)
    }
}

export class Video{

    brainEvents : EventEmitter;

    constructor(brainEvents : EventEmitter){
        this.brainEvents = brainEvents;
    }

    show(){
        this.setVideo("show");
    }

    hide(){
        this.setVideo("hide");
    }

    start(){
        this.setVideo("start");
    }

    stop(){
        this.setVideo("stop");
    }

    name(name : String){
        this.setVideo("name", name);
    }

    showAndPlay(name : String){
        this.setVideo("showAndPlay", name);
    }

    stopAndHide(){
        this.setVideo("stopAndHide");
    }

    setVideo(data : any, extra : String = ""){
        var facePayload = {
            "mode" : "setVideo",
            "data" : data,
            "extra" : extra
        }

        this.brainEvents?.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_FACE_ACTION, facePayload);
    }
}

export class Emotion{

    brainEvents : EventEmitter;

    constructor(brainEvents : EventEmitter){
        this.brainEvents = brainEvents;
    }

    annnoyance() {
        this.setEmotion("annnoyance");
    }

    anger() {
        this.setEmotion("anger");
    }

    rage() {
        this.setEmotion("rage");
    }

    vigilance() {
        this.setEmotion("vigilance");
    }

    anticipation() {
        this.setEmotion("anticipation");
    }

    interest() {
        this.setEmotion("interest");
    }

    serenity() {
        this.setEmotion("serenity");
    }

    joy() {
        this.setEmotion("joy");
    }

    ecstasy() {
        this.setEmotion("ecstasy");
    }

    acceptance() {
        this.setEmotion("acceptance");
    }

    trust() {
        this.setEmotion("trust");
    }

    admiration() {
        this.setEmotion("admiration");
    }

    apprehension() {
        this.setEmotion("apprehension");
    }

    fear() {
        this.setEmotion("fear");
    }

    terror() {
        this.setEmotion("terror");
    }

    distraction() {
        this.setEmotion("distraction");
    }

    surprise() {
        this.setEmotion("surprise");
    }

    amazement() {
        this.setEmotion("amazement");
    }

    pensiveness() {
        this.setEmotion("pensiveness");
    }

    sadness() {
        this.setEmotion("sadness");
    }

    grief() {
        this.setEmotion("grief");
    }

    boredom() {
        this.setEmotion("boredom");
    }

    disgust() {
        this.setEmotion("disgust");
    }

    loathing() {
        this.setEmotion("loathing");
    }

    contempt() {
        this.setEmotion("contempt");
    }

    neutral() {
        this.setEmotion("neutral");
    }

    thirsty() {
        this.setEmotion("thirsty");
    }

    hot() {
        this.setEmotion("hot");
    }

    sleepy() {
        this.setEmotion("sleepy");
    }

    setEmotion(emotion : string){
        var payloadEmotion = {
            "mode" : "setEmotion",
            "data" : emotion
        }
        this.brainEvents?.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_FACE_ACTION, payloadEmotion)
    }
}

export class Sound{

    brainEvents : EventEmitter;

    constructor(brainEvents : EventEmitter){
        this.brainEvents = brainEvents;
    }

    play(){
        this.setSound("play");
    }

    stop(){
        this.setSound("stop");
    }

    name(name : String){
        this.setSound("name", name);
    }

    nameAndPlay(name : String){
        this.setSound("nameAndPlay", name);
    }

    setSound(data : any, extra : String = ""){
        var payloadSound = {
            "mode" : "setSound",
            "data" : data,
            "extra" : extra
        }
        this.brainEvents?.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_FACE_ACTION, payloadSound)
    }

    speak(text : String){
        var payloadTTS = { "mode" : "tts",
                           "text" : text
        }
        this.brainEvents?.emit(Brain.ROBOT_BRAIN_EVENTS.TEXT_TO_SPEECH_ACTION, payloadTTS);
    }
}

export class Text{

    brainEvents : EventEmitter;

    constructor(brainEvents : EventEmitter){
        this.brainEvents = brainEvents;
    }

    text(name : String){
        this.setText("text", name);
    }

    show(){
        this.setText("show");
    }

    hide(){
        this.setText("hide");
    }

    setText(data : any, extra : String = ""){
        var payloadText = {
            "mode" : "setInfoText",
            "data" : data,
            "extra" : extra
        }
        this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_FACE_ACTION, payloadText)
    }
}

export class DisplayDevice{

    brainEvents : EventEmitter;
    emotion : Emotion;
    video : Video;
    sound : Sound;
    text : Text;

    constructor(brainEvents : EventEmitter){
        this.brainEvents = brainEvents;
        this.emotion = new Emotion(this.brainEvents);
        this.video = new Video(this.brainEvents);
        this.sound = new Sound(this.brainEvents);
        this.text = new Text(this.brainEvents);
    }

    addSpeechVisual(length : Number){
        var payloadState = {
            "mode" : "setState",
            "data" : "speechVisual",
            "extra" : length.toString()
        }
        //console.log("addSPeechVis" + payloadState);
        this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_FACE_ACTION, payloadState);
    }

    calculate(){
        var payloadState = {
            "mode" : "setState",
            "data" : "calculate"
        }
        this.brainEvents?.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_FACE_ACTION, payloadState);
    }

    stopCalculate(){
        var payloadState = {
            "mode" : "setState",
            "data" : "stopCalculate"
        }
        this.brainEvents?.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_FACE_ACTION, payloadState);
    }
}

export class StateWrap{

    stateChangeInitiated : Boolean;
    emotionProcessor : PhoneCamProcessor;
    bodyLanguageProcessor : BodyLanguageProcessor;
    speechProcessor : SpeechProcessor;
    brainEvents : EventEmitter;
    state : State;
    RoboticBody : RoboticArm;
    ScreenFace : DisplayDevice;

    constructor(stateName : string, emotionProcessor : PhoneCamProcessor, bodyLanguageProcessor : BodyLanguageProcessor, speechProcessor : SpeechProcessor, brainEvents : EventEmitter){
        this.stateChangeInitiated = false;
        this.emotionProcessor = emotionProcessor;
        this.bodyLanguageProcessor = bodyLanguageProcessor;
        this.speechProcessor = speechProcessor;
        this.brainEvents = brainEvents;
        this.state = new State(stateName);
        this.RoboticBody = new RoboticArm(this.brainEvents);
        this.ScreenFace = new DisplayDevice(this.brainEvents);
    }

    
    
    getState(){
        return this.state;
    }

    GesturePostureDetection(rec : any){}
}