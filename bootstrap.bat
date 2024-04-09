SET AzureKineticSpace_P=C:\Workspace\AzureKineticSpace
SET KareroFace_P=C:\Workspace\KARERO\karero-face
SET KareroBody_P=C:\Workspace\workspace\DIS\KARERO\karero-body
SET KareroWebserver_P=C:\Workspace\\KARERO\karero-webserver
SET FaceEmotionRecognition_P=C:\Workspace\KARERO\face-emotion-recognition


::Activate Azure Kinetic Space GUI
cd %AzureKineticSpace_P%
start start.bat
timeout 2

::Activate Business Logic for KARERO
cd %KareroWebserver_P%
start start.bat
timeout 2
