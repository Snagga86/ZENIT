set CONDA_LOKAL=C:\Users\Felix\anaconda3\Scripts\activate.bat
set CONDA_ENV=test-conda-env

call %CONDA_LOKAL% %CONDA_ENV%
cd python-package
python stream_test.py --camera 1

pause