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


IP_ADDRESS = "192.168.0.101"
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
tts = TTS(model_name=model_name, progress_bar=False, gpu=is_cuda_available)

regex = re.compile('[^a-zA-Z]')

webservice_ip = 'ws://' + IP_ADDRESS + ':' + str(PORT)
websocket.enableTrace(False)

# Initialize a flag to track connection status
IS_CONNECTED = False

def on_message(ws, message):
    print("on message:", message)
    io = StringIO(message)
    json_obj = json.load(io)
    if json_obj['mode'] == "tts":
        text_to_generate = json_obj['text']
        #file = text_to_generate.replace(' ', '').replace('.','').replace(',','').replace(';','')
        #First parameter is the replacement, second parameter is your input string
        file = regex.sub('', text_to_generate)
        file = file[:50]
        file = file + ".wav"
        file_path = "./generatedSoundFiles/" + file
        tts.tts_to_file(text=text_to_generate, file_path=file_path)
        duration = librosa.get_duration(filename=file_path)
        print("File successfully created, duration: " + str(duration))
        payload = file + ";" + str(duration)
        backsend(payload)

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
        print("tryblock")
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
