

::Start transcription
cd ./speech-to-text/service
start start.bat
timeout 2

::Start file service and speech synthesis
cd ../../text-to-speech
start startFileService.bat
start startTTS.bat

cd ../chat-system
start start.bat