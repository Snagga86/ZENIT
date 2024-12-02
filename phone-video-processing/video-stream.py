import socket
import struct
import cv2
import numpy as np
#from deepface import DeepFace
import tensorflow as tf
import torch

print("TensorFlow version:", tf.__version__)
print("Available GPUs:", tf.config.list_physical_devices('GPU'))


print("PyTorch version:", torch.__version__)
print("Is CUDA available:", torch.cuda.is_available())
print("Device:", torch.cuda.get_device_name(0) if torch.cuda.is_available() else "CPU")


def start_server(host='0.0.0.0', port=6666):
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_socket.bind((host, port))
    server_socket.listen(1)
    print(f"Server listening on {host}:{port}")

    conn, addr = server_socket.accept()
    print(f"Connection from {addr}")

    try:
        while True:
            # Receive frame size
            frame_size_data = conn.recv(4)
            #print("test:")
            #print(frame_size_data)
            if not frame_size_data:
                print("No data received. Closing connection.")
                break
            #print(f"Raw frame size bytes (hex): {[hex(b) for b in frame_size_data]}")
            #print("struct.unpack:")
            frame_size = struct.unpack('<I', frame_size_data)[0]
            
            # Receive the frame data
            frame_data = b''
            #print(f"Raw frame size bytes (hex): {[hex(b) for b in frame_size_data]}")
            #print(f"Expected frame size: {frame_size}")
            #print(f"Current received length: {len(frame_data)}")
            while len(frame_data) < frame_size:
                #print("in while")
                packet = conn.recv(frame_size - len(frame_data))
                #print("packet")
                #print(packet)
                if not packet:
                    print("Incomplete frame received. Closing connection.")
                    break
                #print(len(frame_data))
                frame_data += packet
            if len(frame_data) != frame_size:
                print("Incomplete frame received. Skipping.")
                continue

            # Step 3: Decode the frame
            frame = cv2.imdecode(np.frombuffer(frame_data, np.uint8), cv2.IMREAD_COLOR)
            if frame is None:
                print("Failed to decode frame. Skipping.")
                continue

            # Step 4: Detect faces
            gray_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            faces = face_cascade.detectMultiScale(gray_frame, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))

            for (x, y, w, h) in faces:
                # Draw a rectangle around the face
                cv2.rectangle(frame, (x, y), (x+w, y+h), (255, 0, 0), 2)

                # Crop the face for emotion detection
                face = frame[y:y+h, x:x+w]

                try:
                    # Perform emotion detection
                    analysis = DeepFace.analyze(face, actions=['emotion'], enforce_detection=False)

                    # Check if the result is a list or a dictionary
                    if isinstance(analysis, list):
                        analysis = analysis[0]  # Extract the first element if it's a list

                    # Access the dominant emotion
                    dominant_emotion = analysis['dominant_emotion']
                    print(f"Detected emotion: {dominant_emotion}")
                    cv2.putText(frame, emotion, (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (255, 0, 0), 2)
                except Exception as e:
                    print(f"Emotion detection error: {e}")

            # Step 5: Display the frame
            cv2.imshow('Video Stream with Face and Emotion Detection', frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):  # Press 'q' to quit
                break
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()
        server_socket.close()
        cv2.destroyAllWindows()
        print("Server shut down.")

if __name__ == '__main__':
    start_server()