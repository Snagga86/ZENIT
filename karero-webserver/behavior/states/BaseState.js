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

export class StateWrap{
    constructor(stateName, emotionProcessor, gesturePostureProcessor, brainEvents){
        this.state = new State(stateName);
        this.stateChangeInitiated = false;
        this.emotionProcessor = emotionProcessor;
        this.gesturePostureProcessor = gesturePostureProcessor;
        this.brainEvents = brainEvents;
    }
    
    getState(){
        return this.state;
    }

    gesturePostureRecognition(rec){}
}