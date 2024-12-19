# ZENIT Video Stream Server with Face and Emotion Detection

This component contains scripts to set up a video streaming server with integrated face detection and emotion recognition using PyTorch and OpenCV to be processed by zenit-brain.

## Setup Instructions

### Prerequisites

1. **Python Requirements**:
   - Python 3.8 or higher
   - Install dependencies listed in the `requirements.txt` file (see below for commands).
   - Compatible with systems that support CUDA for GPU acceleration.

2. **Install Required Libraries**:
   The project uses:
   - `torch`
   - `facenet-pytorch`
   - `hsemotion`
   - `numpy`
   - `opencv-python`
   - `json`
   - `time`

   Use the following command to install these packages:
   ```bash
   pip install torch facenet-pytorch hsemotion numpy opencv-python
   ```

3. **Ensure UDP and TCP Connections**:
   - Ensure ports `1337` (UDP) and `6666` (TCP) are accessible for communication.

---

### Steps to Run

1. **Setting Up the Environment**:
   Use the `create_pyenv.bat` script to configure the environment automatically. Run the batch file:
   ```cmd
   create_pyenv.bat
   ```

2. **Start the Server**:
   Run the `start.bat` script to initiate the server:
   ```cmd
   start.bat
   ```

3. **Execute the Python Script**:
   Launch the `video-stream.py` file to start receiving video frames, detect faces, and recognize emotions:
   ```bash
   python video-stream.py
   ```

---

### Key Features

- **Face Detection**:
  Uses `facenet-pytorch` for Multi-task Cascaded Convolutional Networks (MTCNN) to detect faces.

- **Emotion Recognition**:
  Employs `hsemotion` for recognizing emotions in real-time.

- **UDP Communication**:
  Transmits detected emotions and face positions in JSON format over UDP.

- **Frame Annotation**:
  Displays annotated video stream with detected faces and emotions.

---

### Notes

- Press `q` during the stream to quit the application.
- The server will auto-restart if an error occurs.

Feel free to explore and customize the code to fit your needs!

