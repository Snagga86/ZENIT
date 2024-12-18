#!usr/bin/env python
# coding=utf-8

import json
from TTS.api import TTS
import torch
import websocket
import rel
import time
from io import StringIO
import re
import librosa
import os

# Configuration for WebSocket and TTS
IP_ADDRESS = "192.168.123.101"
PORT = 1339
IS_CONNECTED = False

# Check CUDA availability for Torch
is_cuda_available = torch.cuda.is_available()
is_cuda_devcount = torch.cuda.device_count()
print(torch.version.cuda)
print("is_cuda_available: {}".format(is_cuda_devcount))

# Model and file configuration
MODEL_NAME = "tts_models/de/thorsten/vits"
OUTPUT_DIRECTORY = "./generatedSoundFiles/"

# Initialize TTS model
# Use CUDA if available
tts = TTS(model_name=MODEL_NAME, progress_bar=False)
tts.to("cuda" if is_cuda_available else "cpu")

# Regex to remove non-alphabetic characters
regex = re.compile('[^a-zA-Z]')

# WebSocket endpoint
WEBSERVICE_IP = f'ws://{IP_ADDRESS}:{PORT}'
websocket.enableTrace(False)

# Function to split text at the first delimiter (sentence-ending punctuation)
def split_at_first_delimiter(text):
    match = re.search(r'([.!?])(?=\s|$)', text)
    if match:
        delimiter_index = match.start()
        return [text[:delimiter_index + 1], text[delimiter_index + 1:]]
    return [text + '.', '']  # Append a period if no delimiter exists

# Function to handle incoming WebSocket messages
def on_message(ws, message):
    print("Received message:", message)
    
    try:
        # Parse incoming JSON message
        json_obj = json.loads(message)
        if json_obj['mode'] == "tts":
            split_message = split_at_first_delimiter(json_obj['text'])

            # Process the first part of the split message
            file1 = get_file_name_for_text(split_message[0])
            generate_sound_file(split_message[0], "partial_1" if split_message[1] else "none", file1)

            # Process the second part if it exists
            if split_message[1]:
                file2 = get_file_name_for_text(split_message[1])
                generate_sound_file(split_message[1], "partial_2", file2)
    except Exception as e:
        print(f"Error processing message: {e}")

# Function to generate sound files using TTS
def generate_sound_file(text, partial, file_name):
    path = os.path.join(OUTPUT_DIRECTORY, file_name)

    try:
        if os.path.exists(path):
            # Check duration if file already exists
            duration = librosa.get_duration(filename=path)
            print(f"File already exists, duration: {duration}")
        else:
            # Generate and save the audio file
            print("Creating audio file...")
            tts.tts_to_file(text=text, file_path=path)
            duration = librosa.get_duration(filename=path)
            print(f"File successfully created, duration: {duration}")

        # Send payload back to the WebSocket server
        payload = {
            "name": file_name,
            "duration": duration,
            "partial": partial
        }
        backsend(json.dumps(payload))

    except Exception as e:
        print(f"Error generating sound file: {e}")

# Function to sanitize text and create a valid file name
def get_file_name_for_text(text):
    sanitized_text = regex.sub('', text)  # Remove non-alphabetic characters
    sanitized_text = sanitized_text[:100]  # Truncate to 100 characters
    return f"{sanitized_text}.wav"

# WebSocket event handlers
def on_error(ws, error):
    print(f"WebSocket error: {error}")

def on_close(ws, close_status_code, close_msg):
    global IS_CONNECTED
    print(f"WebSocket closed with code: {close_status_code}")
    IS_CONNECTED = False

def on_open(ws):
    global IS_CONNECTED
    print("WebSocket connection opened")
    IS_CONNECTED = True

# Function to send data back to WebSocket server
def backsend(data):
    ws.send(data)

# Main loop to maintain WebSocket connection
while True:
    try:
        print("Attempting to connect to WebSocket...")
        ws = websocket.WebSocketApp(
            WEBSERVICE_IP,
            on_open=on_open,
            on_message=on_message,
            on_error=on_error,
            on_close=on_close
        )
        ws.run_forever()  # Keep connection alive

    except KeyboardInterrupt:
        print("Keyboard interrupt detected. Exiting...")
        quit()  # Exit on Ctrl+C

    except Exception as e:
        print(f"Connection error: {e}")
        print("Retrying in 5 seconds...")
        time.sleep(5)
