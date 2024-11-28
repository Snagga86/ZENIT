
export class FunctionScheduler{

    constructor(parent){
        this.parent = parent;
        this.functions = [];
        this.times = [];
        this.timers = [];
        //this.callback = callback;
    }

    addFunction(functionHead, time){
        this.functions.push(functionHead);
        this.times.push(time);
    }

    start(){
        var i = 0;
        while(i < this.functions.length){
            console.log(this.functions[i]);
            this.timers.push(setTimeout(this.functions[i], this.times[i]));
            i++;
        }
        //this.timers.push(setTimeout(this.callback, this.times[this.functions.length - 1]));
    }

    reset(){
        var i = 0;
        while(i < this.timers.length){
            clearTimeout(this.timers[i]);
            i++;
        }
    }
}