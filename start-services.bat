@echo off
echo Starting all services...

:: Start the service brain
START cmd /c "cd /d %~dp0zenit-brain && start.bat"

:: Start the service in large-language-model
START cmd /c "cd /d %~dp0large-language-model && start.bat"

:: Start the service in phone-video-processing
START cmd /c "cd /d %~dp0phone-video-processing && start.bat"

:: Start the file service in text-to-speech
START cmd /c "cd /d %~dp0text-to-speech && startFileService.bat"

:: Start the TTS service in text-to-speech
START cmd /c "cd /d %~dp0text-to-speech && startTTS.bat"

:: Start the service in speech-to-text
START cmd /c "cd /d %~dp0speech-to-text && start.bat"

echo All services started.
pause
