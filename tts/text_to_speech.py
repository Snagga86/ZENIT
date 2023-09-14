#!usr/bin/env python  
#coding=utf-8
import json
from TTS.api import TTS
import torch
import pyaudio  
import wave  

is_cuda_available = torch.cuda.is_available()
print("is_cuda_available: {}".format(is_cuda_available))

model_name = "tts_models/de/thorsten/vits"
file_name = "./output_I.wav"

# init TTS with the target model name
tts = TTS(model_name=model_name, progress_bar=False, gpu=is_cuda_available)

while True:
    text_to_generate = input('What text to generate\n')

    file_name = text_to_generate.strip() + ".wav"
    # (text: str, speaker: str | None = None, language: str | None = None, speaker_wav: str | None = None, emotion: str = "Neutral", speed: float = 1, file_path: str = "output.wav")
    tts.tts_to_file(text=text_to_generate, file_path="./generatedSoundFiles/"+ file_name)
