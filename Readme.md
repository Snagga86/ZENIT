

# ZENIT: The Attentive and Emotionally Expressive Companion Robot

![alt text](https://github.com/Snagga86/ZENIT/blob/main/promo/teaser-img.jpg)

This repository contains the code and documentation for the ZENIT robot, a mechanical companion designed for studying human-robot interaction. ZENIT utilizes a combination of low-cost hardware and open-source software to deliver a responsive, multimodal interaction experience.

## Table of Contents
1. [Introduction](#introduction)
2. [Features](#features)
3. [Hardware Requirements](#hardware-requirements)
4. [Software Requirements](#software-requirements)
5. [Installation](#installation)
6. [Usage](#usage)
7. [Components](#components)
8. [Contributing](#contributing)
9. [Architecture and Editing](#architecture-and-editing)
10. [Citation Requirement](#citation-requirement)
11. [License](#license)
12. [Contact](#contact)

## Introduction
ZENIT (ZENIT Enabling Natural Interaction Technology) is designed to enable easy use of multimodal communication channels such as body language, spatial behavior, facial expressions, and speech. The system is based on ubiquitous and low-cost hardware, including a smartphone, a stationary robotic arm, an average computer, and a separate camera. ZENIT provides a solid foundation for advancing human-robot interaction studies and can be used as a companion robot for reminders, entertainment, chatting, social activation, and more.

## Features
- **Multimodal Interaction:** Supports body language, spatial behavior, facial expressions, and speech.
- **Low-Cost Hardware:** Utilizes a smartphone, robotic arm, computer, and camera.
- **Open-Source Software:** Incorporates various open-source components.
- **Distributed System Architecture:** Ensures easy replication and adaptability.
- **Responsive User Experience:** Provides fast sensory processing and AI models for interaction.

## Hardware Requirements
- **Robotic Arm:** Elephant Robotics MechArm 270-Pi or similar (1).
- **Display Device:** Samsung Galaxy A41 or similar smartphone/tablet (5).
- **(Optional) Depth Camera:** Microsoft Azure Kinect (6).
- **Additional Components:**
  - Power Supply (2)
  - Table Clamp (3)
  - Smartphone Car Holder (4)
  - Router (8)
  - Ethernet and USB-C cables (not incuded in the pic.)
 
![alt text](https://github.com/Snagga86/ZENIT/blob/main/promo/suitcase-num.jpg)

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
   To run the Project you will not require this tool, its possible to use user focussation by phone camera (however results of focus will have a lower performance and accuracy). There is not repsitory available at current times so please don't hesitate to contact us directly ([christian.felix.purps@h-ka.de](mailto:christian.felix.purps@h-ka.de))
   so we can provide you the software.


## Installation
1. **Clone the Repository:**
   ```sh
   git clone https://github.com/Snagga86/ZENIT.git
   ```
2. **Install Dependencies:**
   - Follow the instructions in the `requirements.txt` file for Python dependencies for `/zenit-body` (on the robot), `/speech-to-text` and `/text-to-speech` as well as `/phone-video-processing` and `/large-language-model`. You can use the respective .bat files to setup the virtual python environments.
   - Download the VOSK speech model to use and put it into the `/speech-to-text/models/src` folder. (e.g. https://alphacephei.com/vosk/models/vosk-model-de-0.21.zip for german language support).
   - (Optional) Install RASA in the chat-system by `pip install rasa`. Then use `rasa train` to prepare the RASA NLU.
   - Install OLLAMA 3.2 (https://ollama.com/).
   - Install Node.js (20.9.0) and required packages using `npm install` in `/zenit-brain` folder.
   - Set up Unity (2021.3.8) and import necessary assets for the robot face application.
   - Install the App AudioRelay (https://audiorelay.net/) on your smartphone and on your computer if you want to process audio data.
   - **Check component subfolders for more detailed information**.

3. **Hardware Setup:**
   - Assemble the robotic arm and attach the smartphone using the car holder.
   - Connect the depth camera and other peripherals as described in the hardware manual.
   - Ensure all devices are connected to the preconfigured router.

## Usage
1. **Starting the System:**
   - Power on the robotic arm, smartphone, computer and depth camera.
   - Start AudioRelay on your computer to receive audio data from the smartphone.
   - Start AudioRelay on your smartphone to stream audio data to your main computation unit.
   - (Optional) Start Kinetic Space Application.
   - Run all required services using `start-services.bat`.
   - Launch the Unity application on the smartphone to display the robot face.

2. **Interacting with ZENIT:**
   - Use the provided NUI to control and interact with the robot.
   - Test different interaction scenarios by modifying the dialog system and behavior rules.

## Components
ZENIT's architecture is divided into three main components:
- **ZENIT Face:** Handles facial expressions and visual output using a smartphone.
- **ZENIT Body:** Controls the movements of the robotic arm.
- **ZENIT Brain:** Manages perception, AI processing, and overall behavior logic.

- **Distributed System Architecture:**

![alt text](https://github.com/Snagga86/ZENIT/blob/main/promo/distributed-system.png)

These components communicate through a network of APIs and protocols, ensuring modularity and ease of extension.

## Contributing
We welcome contributions to ZENIT! If you would like to contribute:
1. Fork the repository.
2. Create a new branch for your feature or bugfix.
3. Submit a pull request with a detailed description of your changes.

## Citation Requirement

If you use this open-source system in your research, projects, or any published work, you must cite the accompanying paper. Please include the following BibTeX entry in your publications:

```bibtex
@INPROCEEDINGS{10731255,
  author={Purps, Christian Felix and Wölfel, Matthias},
  booktitle={2024 33rd IEEE International Conference on Robot and Human Interactive Communication (ROMAN)}, 
  title={Fusing Components for an Attentive and Emotionally Expressive Companion Robot: Meet ZENIT}, 
  year={2024},
  volume={},
  number={},
  pages={2339-2346},
  doi={10.1109/RO-MAN60168.2024.10731255}}
```

## License
ZENIT is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.

## Contact
For questions or support, please contact:
- Christian Felix Purps: [christian.felix.purps@h-ka.de](mailto:christian.felix.purps@h-ka.de)
- Matthias Wölfel: [matthias.woelfel@h-ka.de](mailto:matthias.woelfel@h-ka.de)

You can also visit our [GitHub page](https://github.com/Snagga86/ZENIT) for more information and updates.
