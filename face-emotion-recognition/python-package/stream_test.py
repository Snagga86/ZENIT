import numpy as np
import cv2 as cv
from pythonosc.udp_client import SimpleUDPClient
import socket
import sys
from hsemotions.facial_emotions import HSEmotionRecognizer
model_name='enet_b0_8_best_afew'
fer=HSEmotionRecognizer(model_name=model_name,device='cpu')

CAMERA_NO = 0
UDP_IP = "192.168.0.101"
UDP_PORT = 1337

print(sys.argv)
if(len(sys.argv) >= 3):
    if(sys.argv[1]):
        if(sys.argv[1] == "--camera"):
            if(sys.argv[2]):
                CAMERA_NO = sys.argv[2]
                print("Using camera ", CAMERA_NO)
                


sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM) # UDP

#stream_url = "srt://192.168.0.101:3333"

cap = cv.VideoCapture(int(CAMERA_NO))
if not cap.isOpened():
    print("Cannot open camera")
    #exit()
while cap.isOpened():
    # Capture frame-by-frame
    ret, frame_raw = cap.read()
    # if frame is read correctly ret is True
    if not ret:
        print("Can't receive frame (stream end?). Exiting ...")
        break
    # Our operations on the frame come here
    facecasc = cv.CascadeClassifier('haarcascade_frontalface_default.xml')
    frame = cv.cvtColor(frame_raw, cv.COLOR_BGR2RGB)
    faces = facecasc.detectMultiScale(frame,scaleFactor=1.3, minNeighbors=5)

    for (x, y, w, h) in faces:
        cv.rectangle(frame, (x, y-50), (x+w, y+h+10), (255, 0, 0), 2)
        face_img = frame[y:y + h, x:x + w]
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
        break
# When everything done, release the capture
cap.release()
cv.destroyAllWindows()


'''
import numpy as np
import cv2


cv2.ocl.setUseOpenCL(False)

# start the webcam feed
cap = cv2.VideoCapture(0)
while True:
    # Find haar cascade to draw bounding box around face
    ret, frame = cap.read()
    if not ret:
        break
    facecasc = cv2.CascadeClassifier('haarcascade_frontalface_default.xml')
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = facecasc.detectMultiScale(gray,scaleFactor=1.3, minNeighbors=5)

    for (x, y, w, h) in faces:
        cv2.rectangle(frame, (x, y-50), (x+w, y+h+10), (255, 0, 0), 2)
        roi_gray = gray[y:y + h, x:x + w]
        cropped_img = np.expand_dims(np.expand_dims(cv2.resize(roi_gray, (48, 48)), -1), 0)
        
    cv2.imshow('Video', cv2.resize(frame,(1600,960),interpolation = cv2.INTER_CUBIC))
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
'''