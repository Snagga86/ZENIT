# ZENIT Text-to-Speech Service with WebSocket and File Hosting

This repository contains scripts and configurations to set up a text-to-speech (TTS) service using WebSocket for communication and a file hosting server for serving generated audio files.

## Setup Instructions

### Prerequisites

1. **Python Requirements**:
   - Python 3.8 or higher
   - Install dependencies listed in `requirements.txt`.

2. **Node.js Requirements**:
   - Ensure Node.js is installed to run the file hosting service.

3. **Install Required Libraries**:
   Install Python dependencies using:
   ```bash
   pip install -r requirements.txt
   ```

   Ensure the `sound_file_service.js` file uses the necessary Node.js modules (`http`, `fs`, `path`, `url`).

---

### Steps to Run

1. **Set Up the Environment**:
   Use the `create_pyenv.bat` script to prepare and initialize the Python environment.

2. **Start the WebSocket Service**:
   Run the `startTTS.bat` script to initiate the text-to-speech WebSocket service:
   ```cmd
   startTTS.bat
   ```

3. **Run the Text-to-Speech Script**:
   Execute `text_to_speech.py` to start the TTS processing:
   ```bash
   python text_to_speech.py
   ```

4. **Start the File Hosting Service**:
   Use the `startFileService.bat` script to start the Node.js file hosting server:
   ```cmd
   startFileService.bat
   ```

   Alternatively, run the Node.js script manually:
   ```bash
   node sound_file_service.js
   ```

---

### Key Features

- **Text-to-Speech Processing**:
  Converts text into speech using TTS models, supports splitting long texts into smaller parts, and generates audio files.

- **WebSocket Integration**:
  Communicates with a WebSocket server for receiving text input and sending audio file details.

- **Audio File Hosting**:
  Serves generated audio files over HTTP using a lightweight Node.js server.

---

### Notes

- Ensure the `OUTPUT_DIRECTORY` in `text_to_speech.py` matches the directory served by `sound_file_service.js`.
- The WebSocket service connects to `192.168.123.101:1339` by default.
- The file hosting service runs on `localhost:1340` by default and serves files from `../generatedSoundFiles/`.
- Customize the scripts to fit your specific requirements.

Feel free to expand and adapt this repository to fit your project needs!

