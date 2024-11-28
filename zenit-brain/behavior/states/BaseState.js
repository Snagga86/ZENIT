import { Brain } from '../brain.js';

export class State{
    constructor(stateName){
        this.target = stateName;
        this.actions = new Actions();
        this.transitions = new Array();
    }
}

export class Actions{
    constructor(){
        this.onEnter = function(){};
        this.onExit = function(){};
    }
}

export class Transition{
    constructor(name, target, action){
        this.target = target;
        this.name = name;
        this.action = action;
    }
}

export class RoboticArm{
    constructor(brainEvents){
        this.brainEvents = brainEvents;
    }

    seekAttention(){
        this.bodyAction("seekAttention");
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

    bodyAction(action){
        var payload = {
            "mode" : "setMode",
            "activity" : action
        }

        this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_BODY_ACTION, payload)
    }
}

export class Video{
    constructor(brainEvents){
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

    name(name){
        this.setVideo("name", name);
    }

    showAndPlay(name){
        this.setVideo("showAndPlay", name);
    }

    stopAndHide(){
        this.setVideo("stopAndHide");
    }

    setVideo(data, extra = ""){
        var facePayload = {
            "mode" : "setVideo",
            "data" : data,
            "extra" : extra
        }

        this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_FACE_ACTION, facePayload);
    }
}

export class Emotion{
    constructor(brainEvents){
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

    setEmotion(emotion){
        var payloadEmotion = {
            "mode" : "setEmotion",
            "data" : emotion
        }
        this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_FACE_ACTION, payloadEmotion)
    }
}

export class Sound{
    constructor(brainEvents){
        this.brainEvents = brainEvents;
    }

    play(){
        this.setSound("play");
    }

    stop(){
        this.setSound("stop");
    }

    name(name){
        this.setSound("name", name);
    }

    nameAndPlay(name){
        this.setSound("nameAndPlay", name);
    }

    setSound(data, extra = ""){
        var payloadSound = {
            "mode" : "setSound",
            "data" : data,
            "extra" : extra
        }
        this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_FACE_ACTION, payloadSound)
    }

    speak(text){
        var payloadTTS = { "mode" : "tts",
                           "text" : text
        }
        this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.TEXT_TO_SPEECH_ACTION, payloadTTS);
    }
}

export class Text{
    constructor(brainEvents){
        this.brainEvents = brainEvents;
    }

    text(name){
        this.setText("text", name);
    }

    show(){
        this.setText("show");
    }

    hide(){
        this.setText("hide");
    }

    setText(data, extra = ""){
        var payloadText = {
            "mode" : "setInfoText",
            "data" : data,
            "extra" : extra
        }
        this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_FACE_ACTION, payloadText)
    }
}

export class DisplayDevice{
    constructor(brainEvents){
        this.brainEvents = brainEvents;
        this.emotion = new Emotion(this.brainEvents);
        this.video = new Video(this.brainEvents);
        this.sound = new Sound(this.brainEvents);
        this.text = new Text(this.brainEvents);
    }

    addSpeechVisual(length){
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
        this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_FACE_ACTION, payloadState);
    }

    stopCalculate(){
        var payloadState = {
            "mode" : "setState",
            "data" : "stopCalculate"
        }
        this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_FACE_ACTION, payloadState);
    }
}

export class StateWrap{
    constructor(stateName, emotionProcessor, bodyLanguageProcessor, speechProcessor, brainEvents){
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

    GesturePostureDetection(rec){}
}