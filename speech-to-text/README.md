# Microphone Service with Speech-to-Text Integration

This repository contains scripts and configurations to set up a microphone service that uses Vosk for speech recognition, WebSocket for communication, and UDP for real-time data streaming.

## Setup Instructions

### Prerequisites

1. **Python Requirements**:
   - Python 3.8 or higher
   - Install dependencies listed in `requirements.txt`.

2. **Install Required Libraries**:
   The project uses:

   - `librosa`
   - `numpy`
   - `scipy`
   - `websocket`
   - `websocket-client`
   - `vosk`
   - `sounddevice`
   - `datetime`

   Install all dependencies using:
   ```bash
   pip install -r requirements.txt
   ```

3. **Vosk Model**:
   Download the required Vosk model for speech recognition and place it in the appropriate directory (e.g., `models/src/de-de`).

---

### Steps to Run

1. **Set Up the Environment**:
   Use the `create_pyenv.bat` script to prepare and initialize the Python environment.

2. **Start the Server**:
   Run the `start.bat` script to initiate the microphone service:
   ```cmd
   start.bat
   ```

3. **Run the Microphone Service**:
   Execute `microphone-service.py` to start the speech-to-text processing and data transmission:
   ```bash
   python microphone-service.py
   ```

---

### Key Features

- **Speech Recognition**:
  Uses the Vosk library to process audio and convert it to text in real-time.

- **WebSocket Integration**:
  Communicates with a WebSocket server for real-time control and data handling.

- **UDP Data Transmission**:
  Transmits speech recognition results and partial results over UDP.

---

### Notes

- Make sure the Vosk model is downloaded and placed correctly before running the service.
- The server communicates with `192.168.123.101` by default and uses TCP port `1342` and UDP port `1338`.
- Customize the `microphone-service.py` script to adjust parameters such as the sample rate or model path.

### This is a Python module for Vosk.

Vosk is an offline open source speech recognition toolkit. It enables
speech recognition for 20+ languages and dialects - English, Indian
English, German, French, Spanish, Portuguese, Chinese, Russian, Turkish,
Vietnamese, Italian, Dutch, Catalan, Arabic, Greek, Farsi, Filipino,
Ukrainian, Kazakh, Swedish, Japanese, Esperanto, Hindi, Czech, Polish.
More to come.

Vosk models are small (50 Mb) but provide continuous large vocabulary
transcription, zero-latency response with streaming API, reconfigurable
vocabulary and speaker identification.

Vosk supplies speech recognition for chatbots, smart home appliances,
virtual assistants. It can also create subtitles for movies,
transcription for lectures and interviews.

Vosk scales from small devices like Raspberry Pi or Android smartphone to
big clusters.

# Documentation

For installation instructions, examples and documentation visit [Vosk
Website](https://alphacephei.com/vosk). See also our project on
[Github](https://github.com/alphacep/vosk-api).
