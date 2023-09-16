import socket
import queue
import sys
import sounddevice as sd

from vosk import Model, KaldiRecognizer

UDP_IP = "192.168.0.101"
UDP_PORT = 1338

sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM) # UDP

q = queue.Queue()
samplerate = 44100
model = Model(model_path="../models/src/de-de")
device_info = sd.query_devices(0, "input")
dump_fn = open("logs.txt", "wb")

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
    q.put(bytes(indata))

try:

    with sd.RawInputStream(samplerate=samplerate, blocksize = 8000, 
            dtype="int16", channels=1, callback=callback):
        print("#" * 80)
        print("Press Ctrl+C to stop the recording")
        print("#" * 80)

        rec = KaldiRecognizer(model, samplerate, '[ "keyphrase", "[karero]" ]')
        while True:
            data = q.get()
            
            if rec.AcceptWaveform(data):
                print("final result:\n")
                finalRes = rec.FinalResult()
                finalResult = finalRes
                print(finalResult)
                sock.sendto(bytes(finalResult, "utf-8"), (UDP_IP, UDP_PORT))
            else:
                print("partial result:\n")
                print(rec.PartialResult())
                partialResult = rec.PartialResult()
                sock.sendto(bytes(partialResult, "utf-8"), (UDP_IP, UDP_PORT))
            if dump_fn is not None:
                dump_fn.write(data)
            

except KeyboardInterrupt:
    print("\nDone")
    parser.exit(0)
except Exception as e:
    parser.exit(type(e).__name__ + ": " + str(e))
