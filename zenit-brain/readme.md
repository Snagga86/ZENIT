# ZENIT Zenit-Brain Setup Guide

This guide provides detailed steps to set up the ZENIT zenit-brain for connecting to the robotic body. Additional documentation will be included in the future, covering different networks that zenit-brain will connect to. 

The code documentation can be found in `/documentation` subfolder.

## Steps to Connect Zenit-Brain to the Robotic Body

### 1) Set Up Server Configuration File

- Copy `server-conf_TPL.json` and rename it to `server-conf.json`.
- Adjust the IP addresses and ports as needed:
  - To establish a connection with the robot, configure the `RobotNetwork`.
  - To receive data from the kinetic space, configure the `KinectNetwork`.
- Adjust the robot position:
  - `baseX` and `baseZ` are the coordinates of the robot within the kinetic space room (x and y positions).
  - `baseY` is the delta in meters between the robot base position and the Azure Kinect.
  - `baseRotation` is the base orientation (in degrees) of the robot, where 0 indicates a turn towards south.

### 2) Data Transmission from Kinetic Space to Robot

The coordinates of the closest body tracked by kinetic space are sent to the robot on demand if the robot requires them (e.g., to turn towards the interlocutor). This process occurs in the `server.js` file.

```javascript
var payload = {
    "mode" : "dataSupply",
    "activity" : "personCoordinates",
    "data" : {
        "baseX" : this.robotPosition.baseX,
        "baseY" : this.robotPosition.baseY,
        "baseZ" : this.robotPosition.baseZ,
        "baseRotation" : this.robotPosition.baseRotation,
        "personX" : Number(closestBody.x),
        "personY" : Number(closestBody.y),
        "personZ" : Number(closestBody.z)
    } 
};

this.robotControlWS.send(JSON.stringify(payload));
```

In the payload, additional information can be added for processing by the robotic arm (e.g., degree of crossed limbs or leaning direction).

### 3) Processing Data in `zenit-body`

In `robot_network.py`, the data is processed if the mode is set to `dataSupply`.

```python
def digest_activity_data(self, payload):
    if self.activity == 'followHead':
        if self.ready_for_command() == False:
            time.sleep(0.1)
            self.karero_network.backsend("getPersonCoordinates")
            return False
        self.follow_head(payload)
        time.sleep(0.1)
        self.karero_network.backsend("getPersonCoordinates")
    return True
```

Here, other activity data can be processed. Movement patterns are encapsulated in async functions using the mech_arm API and the `send_angles` function, executing a predefined `movement_description` which can contain variables on initialization. For more functions, check the [pymycobot documentation](https://github.com/elephantrobotics/pymycobot/blob/main/docs/README.md).

## Architecture and Editing
In the following section we describe the main components to give ZENIT custom behavior using the supported input modalities (speech, gestures/postures, emotions, and localization) and output modalities (facial expressions, bodily movements, and speech). Behavior is mainly defined in `/zenit-brain`, except for RASA based NLU content. Adjustments in RASA can be found in the respective files in `/chat-system` folder following instructions from https://rasa.com/docs/.

1. **States**
   - Basic behavior of ZENIT is provided by a TypeScript based program section using the classic state machine pattern. The state machine itself is defined in `brain.js`. Each state for the state machine must be defined in a seperate file, located in `/states` folder. A basic state would look sth. like the following:
     
    ```ts
    import { State, Actions, Transition, StateWrap } from './BaseState.js';
    import { Brain } from '../brain.js';
  
    /* Robot state class defining the robot behavior within this state. */
    export class StateOne extends StateWrap{
        /* Construct object of class and provide the required processors that are required for the respective following code.
        Processors are made to handle operations of speech, gesture, or chat inputs and maybe extended for further application.*/
        constructor(ProcessorA, ProcessorB, ..., brainEvents){
            /* Call the super constructor and set the identification name for the state class and basic functionalities,
            such as auto cleanup state and facades to easily trigger actions. */
            super("stateOne", ProcessorA, ProcessorB, ..., brainEvents);
  
            /* Bind concrete implementation functions for enter and exit of the current state. */
            this.state.actions.onEnter = this.enterFunction.bind(this);
            this.state.actions.onExit = this.exitFunction.bind(this);
  
            /* Set up connections between related states of the state machine. */
            this.state.transitions.push(new Transition("stateTwo", "stateTwo", () => {}));   
            this.state.transitions.push(new Transition("stateThree", "stateThree", () => {}));  
        }
  
        /* Concrete implementation for the state enter function.*/
        enterFunction(){}
  
        /* Concrete implementation for the state exit function.*/
        exitFunction(){}
    }
    ```
    - Once the state has been defined it must be added to the `brain.ts` file.
     ```ts
     const follow = new StateOne(this.ProcessorA, this.ProcessorB, ..., this.brainEvents).getState();
     ```
    - Additionally, the declared state must be added to the state machine definition.
    ```ts
    this.stateMachineDefinition = {initialState: "off", off, ..., stateOne};
    ```
2. **Events**
   - The mostly asychnronous behavior of the robot's perceptive and expressive components are triggered via a bunch of different events.
     
    - To change the state machine state you can use:
    ```ts
    this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_STATE_CHANGE, "stateOne");
    ```
    
    - To trigger a robotic arm movement you can use the following event (this is usually not necessary because there exists a facade for body actions in `BaseState.js` that lets you trigger the action easily.):
    ```ts
    var payload = {
      "mode" : "setMode",
      "activity" : actionString
    }
    
    this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_BODY_ACTION, payload);
    ```
    
    - To trigger a screen face action you can use the following event (this is usually not necessary because there exists a facade for screen face actions in `BaseState.js` that lets you trigger the action easily.):
    ```ts
    var payload = {
      "mode" : theMode,
      "data" : data,
      "extra" : extra
    }
    this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.ROBOT_FACE_ACTION, payload)
    ```
    
    - For letting the robot speak any text you can use the follwing event:
    ```ts
    var payload = {
      "mode" : "tts",
      "text" : "Test to speak."
    }
    this.brainEvents.emit(Brain.ROBOT_BRAIN_EVENTS.TEXT_TO_SPEECH_ACTION, payload);
    ```
    
    - To deal with answers from RASA you can use the following event. As RASA is a little detached from the rest of the state machine consider checking `ChatBase.js` class:
    
    ```ts
    this.chatProcessor.chatEvents.on(Brain.ROBOT_BRAIN_EVENTS.RASA_ANSWER, this.RASAAnswerHandler.bind(this));
    
    RASAAnswerHandler(rasaAnswer){
      console.log("Answer:" + rasaAnswer);
    }
    ```
    - Whenever you setup an event listener in a state always make sure to remove it properly in the states `exitFunction()` function.

3. **Processors**
   - Processors are made to collect a number of redundant functionalities that are required often and thus injected to the respective state that uses it. At the moment these include the `chat-processor`, `emotion-processor`, `gesture-posture-processor`, and `speech-processor`. These processors are designed to emit specific events that can be listened to, such as e.g.:
   ```ts
    this.gesturePostureProcessor.gesturePostureEvent.on('ClosestBodyDistance', this.closestBodyRecognition.bind(this));
    this.speechProcessor.speechEvent.on('FinalResult', this.finalResultHandler.bind(this));
    this.chatProcessor.chatEvents.on(Brain.ROBOT_BRAIN_EVENTS.RASA_ANSWER, this.RASAAnswerHandler.bind(this));
   ```
   - Make sure to remove the respective listeners after usage:

    ```ts
    this.gesturePostureProcessor.gesturePostureEvent.removeAllListeners('ClosestBodyDistance', this.closestBodyRecognition);
    this.speechProcessor.speechEvent.removeAllListeners('FinalResult', this.finalResultHandler);
    this.chatProcessor.chatEvents.removeAllListeners(Brain.ROBOT_BRAIN_EVENTS.RASA_ANSWER, this.RASAAnswerHandler);
    ```
### 4) Create New States and Use Processors to Process Data Input

Further instructions will be provided on how to create new states and use processors to handle data input.

---

This documentation is not yet complete. Additional sections will be added as new functionalities and network connections are implemented.
