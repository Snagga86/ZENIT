set CONDA_LOKAL=C:\Users\Christian Purps\anaconda3\Scripts\activate.bat
set CONDA_ENV=face-emotion-recognition-2

call %CONDA_LOKAL% %CONDA_ENV%
cd python-package
python stream_test.py --camera 1

pause