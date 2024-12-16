#!usr/bin/env python  
#coding=utf-8
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

IP_ADDRESS = "192.168.123.101"
PORT = 1339
IS_CONNECTED = False

is_cuda_available = torch.cuda.is_available()
is_cuda_devcount = torch.cuda.device_count()
is_cuda_available = torch.cuda.is_available()
is_cuda_available = torch.cuda.is_available()
print(torch.version.cuda)
print("is_cuda_available: {}".format(is_cuda_devcount))

#Model and output configuration
model_name = "tts_models/de/thorsten/vits"
file_name = ""

# init TTS with the target model name
tts = TTS(model_name=model_name, progress_bar=False)
tts.to("cuda")
regex = re.compile('[^a-zA-Z]')

webservice_ip = 'ws://' + IP_ADDRESS + ':' + str(PORT)
websocket.enableTrace(False)

# Initialize a flag to track connection status
IS_CONNECTED = False

def split_at_first_delimiter(text):
    # Use a regex to find the first delimiter that is a valid sentence end
    match = re.search(r'([.!?])(?=\s|$)', text)
    if match:
        delimiter_index = match.start()
        return [text[:delimiter_index + 1], text[delimiter_index + 1:]]
    return [text + '.', '']  # Default to '.' if no delimiter exists

def on_message(ws, message):
    print("on message:", message)
    io = StringIO(message)
    json_obj = json.load(io)
    partial = ""
    if json_obj['mode'] == "tts":
        split_message = split_at_first_delimiter(json_obj['text'])

        print(split_message[0])
        print(split_message[1])

        if split_message[1] == "":
            partial = "none"
            file = get_file_name_for_text(split_message[0])
            generate_sound_file(split_message[0], partial, file)
        else:
            partial1 = "partial_1"
            file1 = get_file_name_for_text(split_message[0])
            generate_sound_file(split_message[0], partial1, file1)
            partial2 = "partial_2"
            file2 = get_file_name_for_text(split_message[1])
            generate_sound_file(split_message[1], partial2, file2)
        

def generate_sound_file(text, partial, file):

    path = "./generatedSoundFiles/" + file

    if os.path.exists(path):
        duration = librosa.get_duration(filename=path)
        print("File already exists, duration: " + str(duration))
    else:
        print("before file creation")
        tts.tts_to_file(text=text, file_path=path)
        print("after file creation")
        duration = librosa.get_duration(filename=path)
        print("File successfully created, duration: " + str(duration))
    
    payload = {
        "name": file,
        "duration": duration,
        "partial": partial
    }
    
    backsend(json.dumps(payload))

def get_file_name_for_text(text):
    file = regex.sub('', text)
    file = file[:100]
    file = file + ".wav"

    return file

def on_error(ws, error):
    print(error)

def on_close(ws, close_status_code, close_msg):
    global IS_CONNECTED
    print(close_status_code)
    IS_CONNECTED = False

def on_open(ws):
    global IS_CONNECTED
    print("Opened connection")
    IS_CONNECTED = True

def backsend(data):
    ws.send(data)

while True:
    try:
        print("try to connect to websocket...")
        ws = websocket.WebSocketApp(webservice_ip,
                                    on_open=on_open,
                                    on_message=on_message,
                                    on_error=on_error,
                                    on_close=on_close)
        ws.run_forever()
    except KeyboardInterrupt:
        print("keyboard interrupt")
        quit()  # Exit the loop on Ctrl+C
    except Exception as e:
        print("errorrorororo")
        print(f"Connection error: {e}")
        time.sleep(5)  # Wait for 5 seconds before attempting to reconnect