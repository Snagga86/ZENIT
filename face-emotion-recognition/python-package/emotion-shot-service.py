import numpy as np
import cv2 as cv
import socket
import sys
import time
import urllib.request

from hsemotions.facial_emotions import HSEmotionRecognizer

model_name='enet_b0_8_best_afew'
fer=HSEmotionRecognizer(model_name=model_name,device='cpu')

ONLY_LARGEST_FACE = True
CAMERA_NO = 0
UDP_IP = "192.168.123.101"
SHOT_URL = "http://192.168.123.103:8910/shot.jpg"
UDP_PORT = 1337

sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM) # UDP

#cap = cv.VideoCapture("http://192.168.0.103:8910/video")
#cap = cv.imgread("http://192.168.0.103:8910/video/shot.jpg")

facecasc = cv.CascadeClassifier('haarcascade_frontalface_default.xml')

def process():
    req = urllib.request.urlopen(SHOT_URL)
    arr = np.asarray(bytearray(req.read()), dtype=np.uint8)
    shot = cv.imdecode(arr, -1)

    # if frame is read correctly ret is True

    # Our operations on the frame come here
    
    frame = cv.cvtColor(shot, cv.COLOR_BGR2RGB)
    faces = facecasc.detectMultiScale(frame,scaleFactor=1.3, minNeighbors=5)
    
    lastFaceSize = 0
    lastX = 0
    lastY = 0
    lastW = 0
    lastH = 0

    for (x, y, w, h) in faces:
        faceSize = np.sqrt(w^2 + h^2)
        if faceSize > lastFaceSize:
            lastX = x
            lastY = y
            lastW = w
            lastH = h
            lastFaceSize = faceSize

    if lastFaceSize > 0:
        cv.rectangle(frame, (lastX, lastY-50), (lastX+lastW, lastY+lastH+10), (255, 0, 0), 2)
        face_img = frame[lastY:lastY + lastH, lastX:lastX + lastW]
        #cropped_img = np.expand_dims(np.expand_dims(cv.resize(roi_gray, (224, 224)), -1), 0)
        emotion,scores=fer.predict_emotions(face_img,logits=True)
        #print(scores);
        print(emotion);
        print(scores);
        b = bytearray()
        b.extend(map(ord, emotion))
        print(b[0])
        #client.send_message("/data/emtion", emotion)
        sock.sendto(bytes(emotion, "utf-8"), (UDP_IP, UDP_PORT))
        
        #
    cv.imshow('Video', cv.resize(frame,(1600,960),interpolation = cv.INTER_CUBIC))
    # Display the resulting frame
    #cv.imshow('frame', gray)
    
    '''
    frame = cv.cvtColor(frame_raw, cv.COLOR_BGR2RGB)

    bounding_boxes, points = imgProcessing.detect_faces(frame)
    points = points.T
    for bbox,p in zip(bounding_boxes, points):
        box = bbox.astype(int)
        x1,y1,x2,y2=box[0:4]    
        face_img=frame[y1:y2,x1:x2,:]
        emotion,scores=fer.predict_emotions(face_img,logits=True)
        print(emotion,scores)
    '''
    if cv.waitKey(1) == ord('q'):
        return
    pass

# execute the function 10 times per second
while True:
    start_time = time.time()
    process()
    end_time = time.time()
    elapsed_time = end_time - start_time
    time.sleep(max(0.1 - elapsed_time, 0))