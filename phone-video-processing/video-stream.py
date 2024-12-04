import socket
import struct
import cv2
import numpy as np
import torch
from hsemotion.facial_emotions import HSEmotionRecognizer
from facenet_pytorch import MTCNN
import json
import time

UDP_IP = "192.168.123.101"
UDP_PORT = 1337

sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM) # UDP

# Initialize Models
def initialize_models():
    print("PyTorch version:", torch.__version__)
    print("Is CUDA available:", torch.cuda.is_available())
    print("Device:", torch.cuda.get_device_name(0) if torch.cuda.is_available() else "CPU")

    fer = HSEmotionRecognizer(model_name='enet_b0_8_best_afew', device='cuda')
    mtcnn = MTCNN(keep_all=True, device='cuda')
    return fer, mtcnn


# Server Setup
def setup_server(host='0.0.0.0', port=6666):
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_socket.bind((host, port))
    server_socket.listen(1)
    print(f"Server listening on {host}:{port}")
    return server_socket

def recv_exact(conn, size):
    data = b""
    while len(data) < size:
        packet = conn.recv(size - len(data))
        if not packet:
            raise ConnectionError("Connection closed unexpectedly.")
        data += packet
    return data


# Receive Frame
def receive_frame(conn):
    try:
        # Receive width and height (8 bytes total)
        resolution_data = recv_exact(conn, 8)
        width, height = struct.unpack('<II', resolution_data)

        # Receive frame size (4 bytes)
        frame_size_data = recv_exact(conn, 4)
        frame_size = struct.unpack('<I', frame_size_data)[0]

        # Receive frame data
        frame_data = recv_exact(conn, frame_size)

        # Convert raw data to an image
        raw_image = np.frombuffer(frame_data, dtype=np.uint8).reshape((height, width, 3))
        frame = cv2.cvtColor(raw_image, cv2.COLOR_RGB2BGR)
        frame = cv2.flip(frame, 0)

        return frame
    except ConnectionError as e:
        print(f"Error: {e}")
        return None




# Detect Faces
def detect_faces(frame, mtcnn):
    faces, _ = mtcnn.detect(frame)
    if faces is None:
        return None
    return faces


# Find Largest Face
def find_largest_face(faces):
    largest_face = None
    largest_diameter = 0
    for face in faces:
        x1, y1, x2, y2 = map(int, face)
        diameter = ((x2 - x1)**2 + (y2 - y1)**2)**0.5
        if diameter > largest_diameter:
            largest_diameter = diameter
            largest_face = (x1, y1, x2, y2)
    return largest_face


# Calculate Middle Point
def calculate_middle_point(face, frame_shape):
    x1, y1, x2, y2 = face
    middle_x = (x1 + x2) / 2
    middle_y = (y1 + y2) / 2
    percent_x = (middle_x / frame_shape[1]) * 100
    percent_y = (middle_y / frame_shape[0]) * 100
    return percent_x, percent_y


# Perform Emotion Detection
def detect_emotion(face, fer, frame):
    x1, y1, x2, y2 = face
    cropped_face = frame[y1:y2, x1:x2]
    emotion, scores = fer.predict_emotions(cropped_face, logits=True)
    return emotion


# Annotate Frame
def annotate_frame(frame, face, emotion):
    x1, y1, x2, y2 = face
    cv2.rectangle(frame, (x1, y1), (x2, y2), (255, 0, 0), 2)
    cv2.putText(frame, emotion, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (255, 0, 0), 2)


# Main Function to Start Server
def start_server(host='0.0.0.0', port=6666):
    fer, mtcnn = initialize_models()

    while True:
        try:
            server_socket = setup_server(host, port)
            conn, addr = server_socket.accept()
            print(f"Connection from {addr}")

            while True:
                frame = receive_frame(conn)
                if frame is None:
                    print("No frame received. Closing connection.")
                    break

                faces = detect_faces(frame, mtcnn)
                if faces is not None:
                    largest_face = find_largest_face(faces)
                    if largest_face is not None:
                        emotion = detect_emotion(largest_face, fer, frame)
                        percent_x, percent_y = calculate_middle_point(largest_face, frame.shape)
                        annotate_frame(frame, largest_face, emotion)
                        
                        # Send data via UDP
                        data = {
                            "emotion": emotion,
                            "percent_x": percent_x,
                            "percent_y": percent_y
                        }
                        json_data = json.dumps(data)
                        sock.sendto(bytes(json_data, "utf-8"), (UDP_IP, UDP_PORT))

                # Display the frame
                cv2.imshow('Video Stream with Face and Emotion Detection', frame)
                if cv2.waitKey(1) & 0xFF == ord('q'):  # Press 'q' to quit
                    break

        except Exception as e:
            print(f"Error: {e}")
            print("Restarting server in 5 seconds...")
            time.sleep(5)  # Wait before restarting
        finally:
            try:
                conn.close()
            except Exception:
                pass
            try:
                server_socket.close()
            except Exception:
                pass
            cv2.destroyAllWindows()
            print("Server shut down.")


if __name__ == '__main__':
    start_server()
