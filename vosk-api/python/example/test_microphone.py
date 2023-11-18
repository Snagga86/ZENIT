import socket
import websocket
import queue
import sys
import sounddevice as sd
import time
import threading
import json
import parser
from io import StringIO
from vosk import Model, KaldiRecognizer
from datetime import datetime, timedelta

IP_ADDRESS = "192.168.0.101"
TCP_PORT = 1342
UDP_PORT = 1338

sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM) # UDP

sttQueue = queue.Queue()
controlSignalQueue = queue.Queue()

samplerate = 44100
model = Model(model_path="../models/src/de-de")
device_info = sd.query_devices(0, "input")

webservice_ip = 'ws://' + IP_ADDRESS + ':' + str(TCP_PORT)
websocket.enableTrace(False)

agentIsTalking = False
agentStartTalkTime = 0
agentEndTalkTime = 0
safetyDelay = 0.7

# Initialize a flag to track connection status
IS_CONNECTED = False

def run_websocket_client():
    def on_message(ws, message):
        print("on message:", message)
        io = StringIO(message)
        json_obj = json.load(io)
        controlSignalQueue.put(json_obj)

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
            ws = websocket.WebSocketApp(webservice_ip, on_open=on_open, on_message=on_message, on_error=on_error, on_close=on_close)
            ws.run_forever()

        except KeyboardInterrupt:
            print("keyboard interrupt")
            quit()  # Exit the loop on Ctrl+C
        except Exception as e:
            print(f"Connection error: {e}")
            time.sleep(5)  # Wait for 5 seconds before attempting to reconnect

thread = threading.Thread(target=run_websocket_client)
thread.start()

def int_or_str(text):
    """Helper function for argument parsing."""
    try:
        return int(text)
    except ValueError:
        return text

def callback(indata, frames, time, status):
    """This is called (from a separate thread) for each audio block."""
    if status:
        print(status, file=sys.stderr)
    sttQueue.put(bytes(indata))

try:
    with sd.RawInputStream(samplerate=samplerate, blocksize = 8000, 
            dtype="int16", channels=1, callback=callback):
        print("#" * 80)
        print("Press Ctrl+C to stop the recording")
        print("#" * 80)

        rec = KaldiRecognizer(model, samplerate, '[ "keyphrase", "[karero]" ]')
        while True:
            data = sttQueue.get()

            try:
                message = controlSignalQueue.get(timeout=0.01)  # Get a message from the queue
                
                if(message["mode"] == "listen" and message["status"] == "stop"):
                    agentStartTalkTime = int(time.time())
                    delay = float(message["duration"])  + safetyDelay
                    current_datetime = datetime.fromtimestamp(agentStartTalkTime)
                    new_datetime = current_datetime + timedelta(seconds=delay)
                    agentEndTalkTime = int(new_datetime.timestamp())

                if(int(time.time()) > agentEndTalkTime):
                    agentIsTalking = False
                else:
                    agentIsTalking = True

            except queue.Empty:
                if(int(time.time()) > agentEndTalkTime):
                    agentIsTalking = False
                else:
                    agentIsTalking = True
            
            if(agentIsTalking == False):
                if rec.AcceptWaveform(data):
                    print("final result:\n")
                    finalRes = rec.FinalResult()
                    finalResult = finalRes
                    print(finalResult)
                    sock.sendto(bytes(finalResult, "utf-8"), (IP_ADDRESS, UDP_PORT))
                else:
                    print("partial result:\n")
                    print(rec.PartialResult())
                    partialResult = rec.PartialResult()
                    if 'zenith' in partialResult or 'zenit' in partialResult:
                        sock.sendto(bytes(partialResult, "utf-8"), (IP_ADDRESS, UDP_PORT))
                        rec.Reset()

except KeyboardInterrupt:
    print("\nDone")
    parser.exit(0)
except Exception as e:
    parser.exit(type(e).__name__ + ": " + str(e))