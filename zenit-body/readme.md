# ZENIT MechArm 270 Integration and Control

This repository contains scripts for controlling the MechArm 270 robotic arm using Python. The code is specifically tailored to this model and requires significant modifications for compatibility with other robotic arms.

## Setup Instructions

### Prerequisites

1. **Python Requirements**:
   - Python 3.8 or higher.
   - Ensure dependencies are installed using the `requirements.txt` file.

2. **Hardware Requirements**:
   - MechArm 270 robotic arm.
   - Proper connection to the serial port (`/dev/ttyAMA0` for Raspberry Pi setup).

3. **Install Required Libraries**:
   Install Python dependencies using:
   ```bash
   pip install -r requirements.txt
   ```

---

### Steps to Run

1. **Hardware Setup**:
   - Connect the MechArm 270 to your system via the specified serial port.
   - Power on the robotic arm.

2. **Run the Network Controller**:
   Execute `robot_network.py` to manage WebSocket and network interactions:
   ```bash
   python robot_network.py
   ```

3. **Run the ZENIT Control**:
   Use `ZENIT_control.py` to control the robotic arm and initialize commands:
   ```bash
   python ZENIT_control.py
   ```

4. **Start Robotic Arm Operations**:
   Launch `ZENIT_bot.py` to perform predefined robotic arm movements:
   ```bash
   python ZENIT_bot.py
   ```

---

### Key Features

- **WebSocket Communication**:
  - `robot_network.py` establishes WebSocket connections for command handling.

- **Robotic Arm Control**:
  - `ZENIT_control.py` initializes and sends commands to the MechArm 270.

- **Custom Movements**:
  - `ZENIT_bot.py` includes functions for predefined and dynamic robotic movements.

- **Neural Network Integration**:
  - Load neural network weights to perform advanced tasks like mimicry and object tracking.

---

### Notes

- This code is **specific to the MechArm 270** and requires adjustments to work with other robotic arms.
- The WebSocket server is configured to `192.168.123.101` on port `3345`.
- Ensure the serial port is correctly configured in `ZENIT_control.py`.
- Test all functionalities in a controlled environment before deploying in production.

Feel free to modify and extend the functionality based on your project needs.

