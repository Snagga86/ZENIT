# ZENIT Zenit-Brain Setup Guide

This guide provides detailed steps to set up the ZENIT zenit-brain for connecting to the robotic body. Additional documentation will be included in the future, covering different networks that zenit-brain will connect to.

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

### 4) Create New States and Use Processors to Process Data Input

Further instructions will be provided on how to create new states and use processors to handle data input.

---

This documentation is not yet complete. Additional sections will be added as new functionalities and network connections are implemented.
