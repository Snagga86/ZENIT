# ZENIT Face and Network Controllers as Mobile Application

This repository contains Unity scripts designed for interactive face control, network communication, and object manipulation within a Unity environment.

## Setup Instructions

### Prerequisites

1. **Unity Requirements**:
   - Unity version 2021.3.1 or higher is recommended.
   - Ensure the project has dependencies for UnityEngine.Networking, TextMeshPro, and Newtonsoft.Json.

2. **Environment Configuration**:
   - Set up the project in Unity and ensure all required assets are in place, such as `Videos`, `Sounds`, and prefabs.

3. **Install Required Packages**:
   Ensure the following Unity packages are installed:
   - `TextMeshPro`
   - `UnityWebRequest`
   - `NativeWebSocket`

---

### Steps to Run

1. **Add Scripts to GameObjects**:
   - Attach the following scripts to respective GameObjects in your Unity scene:
     - `FaceActionController.cs`: Handles facial animations, emotions, and interactions.
     - `NetworkController.cs`: Manages WebSocket and HTTP communication.
     - `ObjectMover.cs`: Animates objects between predefined points.
     - `PhoneCamVideoStreamer.cs`: Streams phone camera video to a server.
     - `RotateGear.cs`: Handles gear rotation animations.
     - `WSStringBridge.cs`: Bridges WebSocket connections dynamically.

2. **Configure Network Settings**:
   - Update IP addresses and ports in the scripts to match your server setup:
     - WebSocket: `ws://192.168.123.101:3344`
     - HTTP: `http://192.168.123.101:1340`

3. **Scene Setup**:
   - Add required prefabs such as rotating gears, particle systems, and UI elements.
   - Ensure proper camera alignment and setup video and audio source components.

4. **Run the Unity Application**:
   - Click the Play button in Unity Editor or build and deploy the application to your desired platform.

---

### Key Features

- **Facial Expression Control**:
  - `FaceActionController.cs`: Dynamically adjusts facial expressions and animations based on input.

- **Network Communication**:
  - `NetworkController.cs`: Establishes WebSocket and HTTP connections for real-time data exchange.

- **Object Animation**:
  - `ObjectMover.cs`: Provides smooth animations for objects between points.

- **Video Streaming**:
  - `PhoneCamVideoStreamer.cs`: Streams live video from a phone camera to a server.

- **Gear Rotation**:
  - `RotateGear.cs`: Implements continuous rotation animations for gear objects.

- **WebSocket Utility**:
  - `WSStringBridge.cs`: Bridges WebSocket connections with customizable IP and ports.

---

### Notes

- Ensure the server at `192.168.123.101` is running to handle WebSocket and HTTP requests.
- Place all required assets in the `Resources` folder for dynamic loading.
- Adjust the `FaceControlDescription.cs` class for additional data handling requirements.
- Test and debug animations, network communication, and streaming to ensure smooth performance.

Feel free to expand and adapt this repository to fit your interactive application needs!

