# ZENIT: The Attentive and Emotionally Expressive Companion Robot

This repository contains the code and documentation for the ZENIT robot, a mechanical companion designed for studying human-robot interaction. ZENIT utilizes a combination of low-cost hardware and open-source software to deliver a responsive, multimodal interaction experience.

## Table of Contents
1. [Introduction](#introduction)
2. [Features](#features)
3. [Hardware Requirements](#hardware-requirements)
4. [Software Requirements](#software-requirements)
5. [Installation](#installation)
6. [Usage](#usage)
7. [System Architecture](#system-architecture)
8. [Contributing](#contributing)
9. [License](#license)
10. [Contact](#contact)

## Introduction
ZENIT (ZENIT Enabling Natural Interaction Technology) is designed to enable easy use of multimodal communication channels such as body language, spatial behavior, facial expressions, and speech. The system is based on ubiquitous and low-cost hardware, including a smartphone, a stationary robotic arm, an average computer, and a separate camera. ZENIT provides a solid foundation for advancing human-robot interaction studies and can be used as a companion robot for reminders, entertainment, chatting, social activation, and more.

## Features
- **Multimodal Interaction:** Supports body language, spatial behavior, facial expressions, and speech.
- **Low-Cost Hardware:** Utilizes a smartphone, robotic arm, computer, and camera.
- **Open-Source Software:** Incorporates various open-source components.
- **Distributed System Architecture:** Ensures easy replication and adaptability.
- **Responsive User Experience:** Provides fast sensory processing and AI models for interaction.

## Hardware Requirements
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

## Software Requirements
- **Operating System:** Windows 11
- **Programming Languages:** Python, Node.js, C#
- **Software Tools and Libraries:**
  - Unity (v. 2021.3.8f1)
  - Node.js (v. 20.9.0)
  - Python (ZENIT Brain: v. 3.9; ZENIT Body: v. 3.7)
- **Kinetic Space:**
   Kinetic Space is a self-developed tool to enable training, analysis, and recognition of individual gestures with a depth camera like Microsoft’s Kinect family.
   To run the Project you will require this tool. There is not repsitory available at current times so please don't hesitate to contact us directly ([christian.felix.purps@h-ka.de](mailto:christian.felix.purps@h-ka.de))
   so we can provide you the software.

## Installation
1. **Clone the Repository:**
   ```sh
   git clone https://github.com/Snagga86/ZENIT.git
   ```
2. **Install Dependencies:**
   - Follow the instructions in the `requirements.txt` file for Python dependencies for `zenit-body` (on the robot), `speech-to-text` and `text-to-speech`. You run use setup.py for `face-emotion-recognition` in python-package folder.
   - Download the VOSK speech model to use and put it into the `speech-to-text/models/src` folder. (e.g. https://alphacephei.com/vosk/models/vosk-model-de-0.21.zip for german language support).
   - Install RASA in the chat-system by `pip install rasa`. Then use `rasa train` to prepare the RASA NLU.
   - Install Node.js and required packages using `npm install` in `zenit-brain` folder.
   - Set up Unity and import necessary assets for the robot face application.
   - Install the App AudioRelay on your smartphone and on your computer if you want to process audio data.
   - Install the App IPCamera on your smartphone if you want to process facial expressions.

3. **Hardware Setup:**
   - Assemble the robotic arm and attach the smartphone using the car holder.
   - Connect the depth camera and other peripherals as described in the hardware manual.
   - Ensure all devices are connected to the preconfigured router.

## Usage
1. **Starting the System:**
   - Power on the robotic arm, smartphone, computer and depth camera.
   - Start AudioRelay on your computer to receive audio data from the smartphone.
   - Start AudioRelay on your smartphone to stream audio data to your main computation unit.
   - Start IPCamera on your smartphone if you want to use emotion recognition.
   - Run the main control script to initialize the distributed system `start-zenit-brain.bat`.
   - Start Kinetic Space Application.
   - Start the Robot control script `KARERO_control.py`.
   - Run all required services using `start-services.bat`.
   - Launch the Unity application on the smartphone to display the robot face.

2. **Interacting with ZENIT:**
   - Use the provided NUI to control and interact with the robot.
   - Test different interaction scenarios by modifying the dialog system and behavior rules.

## System Architecture
ZENIT's architecture is divided into three main components:
- **ZENIT Face:** Handles facial expressions and visual output using a smartphone.
- **ZENIT Body:** Controls the movements of the robotic arm.
- **ZENIT Brain:** Manages perception, AI processing, and overall behavior logic.

These components communicate through a network of APIs and protocols, ensuring modularity and ease of extension.

## Contributing
We welcome contributions to ZENIT! If you would like to contribute:
1. Fork the repository.
2. Create a new branch for your feature or bugfix.
3. Submit a pull request with a detailed description of your changes.

## System Architecture
In the following section we describe the main components to give ZENIT custom behavior using the supported input modalities (speech, gestures/postures, emotions, and localization) and output modalities (facial expressions, bodily movements, and speech). Behavior is mainly defined in `zenit-brain`, except for RASA based NLU content. Adjustments in RASA can be found in the respective files in `chat-system` folder following instructions from https://rasa.com/docs/.
1. **States**
   - Basic behavior of ZENIT is provided by a JavaScript based program section using the classic state machine pattern. The state machine itself is defined in `brain.js`.
   '''js
   const follow = new Follow(this.emotionProcessor, this.gesturePostureProcessor, this.speechProcessor, this.brainEvents).getState();
   '''
## License
ZENIT is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.

## Contact
For questions or support, please contact:
- Christian Felix Purps: [christian.felix.purps@h-ka.de](mailto:christian.felix.purps@h-ka.de)
- Matthias Wölfel: [matthias.woelfel@h-ka.de](mailto:matthias.woelfel@h-ka.de)

You can also visit our [GitHub page](https://github.com/Snagga86/ZENIT) for more information and updates.