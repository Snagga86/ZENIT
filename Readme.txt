## README for ZENIT Companion Robot Repository

### Table of Contents
- [Introduction](#introduction)
- [Features](#features)
- [Hardware Requirements](#hardware-requirements)
- [Software Requirements](#software-requirements)
- [Installation](#installation)
- [Usage](#usage)
- [System Architecture](#system-architecture)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

### Introduction
ZENIT (ZENIT Enabling Natural Interaction Technology) is an open-source research platform designed for studying human-robot interaction. It leverages a combination of low-cost hardware and open-source software to create a companion robot capable of understanding and expressing emotions through body language, facial expressions, and speech.

### Features
- **Multimodal Communication:** Utilizes body language, facial expressions, and speech for interaction.
- **Low-Cost Hardware:** Built using affordable components such as a smartphone and a stationary robot arm.
- **Open-Source Software:** Employs various open-source tools for perception, speech recognition, and emotion detection.
- **Distributed System:** Modular and flexible architecture to enable easy replication and customization.

### Hardware Requirements
- **Robotic Arm:** Elephant Robotics MechArm 270-Pi or similar.
- **Display Device:** Samsung Galaxy A41 or similar smartphone/tablet.
- **Depth Camera:** Microsoft Azure Kinect.
- **Additional Components:**
  - Power Supply
  - Table Clamp
  - Smartphone Car Holder
  - Router
  - Ethernet and USB-C cables
- **Main Computation Unit:** A laptop or desktop computer with at least:
  - Windows 11
  - AMD Ryzen 7 5800H
  - 32GB RAM
  - NVIDIA GeForce 3070 or equivalent

### Software Requirements
- **Operating System:** Windows 11
- **Programming Languages:** Python, Node.js, C#
- **Software Tools and Libraries:**
  - Unity
  - Node.js
  - Python-based AI services
  - Open-source emotion and speech recognition tools

### Installation
1. **Clone the Repository:**
   ```bash
   git clone https://github.com/Snagga86/ZENIT.git
   ```
2. **Install Dependencies:**
   - Follow the instructions in the `requirements.txt` file for Python dependencies.
   - Install Node.js and required packages using `npm install`.
   - Set up Unity and import necessary assets for the robot face application.

3. **Hardware Setup:**
   - Assemble the robotic arm and attach the smartphone using the car holder.
   - Connect the depth camera and other peripherals as described in the hardware manual.
   - Ensure all devices are connected to the preconfigured router.

### Usage
1. **Starting the System:**
   - Power on the robotic arm, smartphone, and depth camera.
   - Run the main control script to initialize the distributed system.
   - Launch the Unity application on the smartphone to display the robot face.

2. **Interacting with ZENIT:**
   - Use the provided GUI or command-line interface to control the robot.
   - Test different interaction scenarios by modifying the dialog system and behavior rules.

### System Architecture
ZENIT's architecture is divided into three main components:
- **ZENIT Face:** Handles facial expressions and visual output using a smartphone.
- **ZENIT Body:** Controls the movements of the robotic arm.
- **ZENIT Brain:** Manages perception, AI processing, and overall behavior logic.

These components communicate through a network of APIs and protocols, ensuring modularity and ease of extension.

### Contributing
We welcome contributions to ZENIT! If you would like to contribute:
1. Fork the repository.
2. Create a new branch for your feature or bugfix.
3. Submit a pull request with a detailed description of your changes.

### License
ZENIT is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.

### Contact
For questions or support, please contact:
- Christian Felix Purps: [christian.felix.purps@h-ka.de](mailto:christian.felix.purps@h-ka.de)
- Matthias Wölfel: [matthias.woelfel@h-ka.de](mailto:matthias.woelfel@h-ka.de)

You can also visit our [GitHub page](https://github.com/Snagga86/ZENIT) for more information and updates.
