SET AzureKineticSpace_P=G:\work\hska\workspace\AzureKineticSpace
SET KareroFace_P=G:\work\hska\workspace\DIS\KARERO\karero-face
SET KareroBody_P=G:\work\hska\workspace\DIS\KARERO\karero-body
SET KareroWebserver_P=G:\work\hska\workspace\DIS\KARERO\karero-webserver
SET FaceEmotionRecognition_P=G:\work\hska\workspace\DIS\KARERO\face-emotion-recognition


::Activate Azure Kinetic Space GUI
cd %AzureKineticSpace_P%
start start.bat
timeout 2

::Activate Business Logic for KARERO
cd %KareroWebserver_P%
start start.bat
timeout 2

::Activate Facial Recognition Module
cd %FaceEmotionRecognition_P%
start start.bat
timeout 2

::Activate KARERO/Mecharm remotely
cd %KareroBody_P%
start remotestart.bat