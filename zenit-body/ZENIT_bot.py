import time
import rel
import json
import random
import numpy as np
import websocket
from io import StringIO
from pymycobot.genre import Angle
import json
import asyncio
import numpy


class ZENITBot:

    def __init__(self, zenit_api, zenit_network):
        self.zenit_api = zenit_api
        self.zenit_network = zenit_network
        self.last_action_timestamp = time.time()
        self.activity = "base"
        self.DIGEST_THRESHOLD = 0.6

        self.auto_follow = True

        self.personFocusAngleHorizontal = 0.0
        self.personFocusAngleVertical = 0.0

        self.idx_ringbuffer = [0, 0, 0, 0, 0]
        self.ringbuffer_length = 5
        self.neural_net_path = '/home/ubuntu/ZENIT_Dev/best_model_2.json'
        self.use_nn = True

        self.look_direction = 0;

        #x = zenit_api.is_power_on()
        print(zenit_api.is_power_on())
        zenit_api.power_on()
        time.sleep(2)
        zenit_api.set_fresh_mode(1)
        time.sleep(0.5)
        print("get_robot_version: ", zenit_api.get_system_version())
        time.sleep(0.5)
        print("Power on: ", zenit_api.is_power_on())
        time.sleep(0.5)
        # zenit_api.send_angles([0, -20, -30, 0, 0, 0], 50)
        zenit_api.send_angles([-45, -5, -15, 0, 10, 0], 50)
        time.sleep(4)

        angles = zenit_api.get_angles()
        print(angles)
        self.servo1rota = angles[0]
        self.servo3rota = angles[3]

        self.zenit_network.start(self)

    def reset(self):
        self.activity = "base"
        self.last_action_timestamp = time.time()
    
    def load_weights(self, file_path):
        with open(file_path, 'r') as f:
            weights = json.load(f)
        return {k: np.array(v) for k, v in weights.items()}

    def relu(self, x):
        return np.maximum(0, x)

    def forward(self, X, weights):
        X = self.relu(np.dot(X, weights['fc1.weight'].T) + weights['fc1.bias'])
        X = self.relu(np.dot(X, weights['fc2.weight'].T) + weights['fc2.bias'])
        X = self.relu(np.dot(X, weights['fc3.weight'].T) + weights['fc3.bias'])
        X = np.dot(X, weights['fc4.weight'].T) + weights['fc4.bias']
        return X

    def infer(self, weights_file, X_new):
        weights = self.load_weights(weights_file)
        predictions = self.forward(X_new, weights)
        return predictions

    def activity_ended(self):
        if self.auto_follow == True:
            payload = {}
            payload['activity'] = "followHead"
            self.set_activity(payload)
    
    def rotateBaseToTarget(self, base_x, base_y, base_z, base_rotation, person_x, person_y, person_z):

        xDirecton = base_x - person_x
        yDirection = base_y - person_y
        zDirection = base_z - person_z

        x1 = base_x
        x2 = person_x
        y1 = base_y
        y2 = person_y
        z1 = base_z
        z2 = person_z

        angle_v = np.arctan2(z2 - z1, x2 - x1) * 180 / np.pi - 90
        if (angle_v < 0):
            angle_v = angle_v

        angle_v = angle_v + base_rotation

        h_distance = np.sqrt(np.power((x2 - x1),2) + np.power((z2 - z1),2))

        angle_h = np.arctan2(h_distance, y2 + 0.3 - y1 ) * 180 / np.pi - 90
        #if (angle_h < 0):
        #   angle_h = angle_h + 360

        #print(angle_h)

        return [-1 * angle_v, -1 * angle_h]

    def estimatedAngle(self, percentage):
        return (percentage - 50) * 0.7

    def rotateBaseToTarget_P(self, servo0rota, servo3rota, facePercentageX, facePercentageY, faceDetected):
        print("servo0rota: " + str(servo0rota))
        print("servo3rota: " + str(servo3rota))
        print("facePercentageX: " + str(facePercentageX))
        print("facePercentageY: " + str(facePercentageY))
        print("__________________________")

        '''if facePercentageX < 35:
            self.servo1rota = self.servo1rota + (100 - facePercentageX)*0.05
        elif facePercentageX >= 65:
            self.servo1rota = self.servo1rota - (facePercentageX)*0.05
        elif facePercentageX < 45:
            self.servo1rota = self.servo1rota + (100 - facePercentageX)*0.01
        elif facePercentageX >= 55:
            self.servo1rota = self.servo1rota - (facePercentageX)*0.01
        elif facePercentageX < 48:
            self.servo1rota = self.servo1rota + (100 - facePercentageX)*0.005
        elif facePercentageX >= 52:
            self.servo1rota = self.servo1rota - (facePercentageX)*0.005'''
        
        if faceDetected == "True":

            self.servo1rota = self.servo1rota - self.estimatedAngle(facePercentageX) * 0.5

            if self.servo1rota > 160:
                self.servo1rota = 160
            elif self.servo1rota < -160:
                self.servo1rota = -160

            '''if facePercentageY < 45:
                #Move arm upwards to focus face
                self.servo3rota = self.servo3rota - (100 - facePercentageY)*0.1
            elif facePercentageY >= 55:
                self.servo3rota = self.servo3rota + (facePercentageY)*0.1

            self.servo3rota = -15
            '''
            self.servo3rota = self.servo3rota + self.estimatedAngle(facePercentageY) * 0.5
            if self.servo3rota > 45:
                self.servo3rota = 45
            if self.servo3rota < -180:
                self.servo3rota = -180

        if faceDetected == "False":
            print("no face")

        print("rotationX: " + str(self.servo1rota))
        print("rotationX: " + str(self.servo3rota))
        return [self.servo1rota, self.servo3rota]

    def follow_head_percentages(self, payload):
        servo1rota = self.servo1rota
        servo3rota = self.servo3rota
        print("before")
        r1, r2 = self.rotateBaseToTarget_P(servo1rota, servo3rota, payload["data"]["percentX"], payload["data"]["percentY"], payload["data"]["face"])
        #print(angle_v, angle_h)
        self.zenit_api.send_angles([r1, -15, r2 - 5 , 0, 30, 0], 15)

        self.last_action_timestamp = time.time()

    def follow_head(self, payload):
        angle_v, angle_h = self.rotateBaseToTarget(payload["data"]["baseX"], payload["data"]["baseY"], payload["data"]["baseZ"], payload["data"]["baseRotation"], payload["data"]["personX"], payload["data"]["personY"], payload["data"]["personZ"])
        print("action: follow head")
        #print(angle_v, angle_h)
        self.zenit_api.send_angles([angle_v, -5, angle_h - 5 , 0, 30, 0], 15)
        self.personFocusAngleHorizontal = angle_v
        self.personFocusAngleVertical = angle_h
        print("Vangle:" + str(self.personFocusAngleHorizontal))
        self.last_action_timestamp = time.time()

    def follow_head_vertical(self, payload):
        angle_v, angle_h = self.rotateBaseToTarget(payload["data"]["baseX"], payload["data"]["baseY"], payload["data"]["baseZ"], payload["data"]["baseRotation"], payload["data"]["personX"], payload["data"]["personY"], payload["data"]["personZ"])
        print("action: follow head")
        #print(angle_v, angle_h)
        self.zenit_api.send_angles([angle_v, -15, angle_h - 5 , 0, 30, -90], 15)
        self.personFocusAngleHorizontal = angle_v
        self.personFocusAngleVertical = angle_h
        self.last_action_timestamp = time.time()

    async def jawn(self, zenit_api):
        movement_description = [
            [self.personFocusAngleHorizontal, -25, -25, 0, -20, 10],
            [self.personFocusAngleHorizontal, -25, -25, 0, -35, 10],
            [self.personFocusAngleHorizontal, -25, -25, 0, 10, 10]
        ]
        zenit_api.send_angles(movement_description[0], 10)
        time.sleep(3.2)
        zenit_api.send_angles(movement_description[1], 10)
        time.sleep(2.5)
        zenit_api.send_angles(movement_description[2], 0)
        time.sleep(2)

    async def look1(self, zenit_api, payload):
        angle_v, angle_h = self.rotateBaseToTarget(payload["data"]["baseX"], payload["data"]["baseY"], payload["data"]["baseZ"], payload["data"]["baseRotation"], payload["data"]["personX"], payload["data"]["personY"], payload["data"]["personZ"])
        self.personFocusAngleHorizontal = angle_v
        self.personFocusAngleVertical = angle_h
        movement_description = [
            [(self.personFocusAngleHorizontal - 3), -15, self.personFocusAngleVertical - 5, 0, 30, 0],
            [(self.personFocusAngleHorizontal - 3), -15, self.personFocusAngleVertical - 5, 0, 25, -15],
            [(self.personFocusAngleHorizontal),     -15, self.personFocusAngleVertical - 5, -10, 25, 0],
            [(self.personFocusAngleHorizontal + 3), -15, self.personFocusAngleVertical - 5, 0, 30, 0],
            [(self.personFocusAngleHorizontal + 3), -15, self.personFocusAngleVertical - 5, 0, 25, 15]
        ]

        zenit_api.send_angles(movement_description[0], 0)
        time.sleep(2.0)
        zenit_api.send_angles(movement_description[1], 0)
        time.sleep(1.0)
        zenit_api.send_angles(movement_description[2], 0)
        time.sleep(1.0)
        zenit_api.send_angles(movement_description[3], 0)
        time.sleep(1.0)
        zenit_api.send_angles(movement_description[4], 0)
        time.sleep(1.0)
        zenit_api.send_angles(movement_description[2], 0)
        time.sleep(1.5)

    async def look2(self, zenit_api, payload):
        angle_v, angle_h = self.rotateBaseToTarget(payload["data"]["baseX"], payload["data"]["baseY"], payload["data"]["baseZ"], payload["data"]["baseRotation"], payload["data"]["personX"], payload["data"]["personY"], payload["data"]["personZ"])
        self.personFocusAngleHorizontal = angle_v
        self.personFocusAngleVertical = angle_h

        movement_description = [
            [(self.personFocusAngleHorizontal - 3), -15, self.personFocusAngleVertical - 5, 0, 30, 0],
            [(self.personFocusAngleHorizontal - 3), -15, self.personFocusAngleVertical - 5, 0, 25, -15],
            [(self.personFocusAngleHorizontal),     -15, self.personFocusAngleVertical - 5, -10, 25, 0],
            [(self.personFocusAngleHorizontal + 3), -15, self.personFocusAngleVertical - 5, 0, 30, 0],
            [(self.personFocusAngleHorizontal + 3), -15, self.personFocusAngleVertical - 5, 0, 25, 15]
        ]

        zenit_api.send_angles(movement_description[0], 0)
        time.sleep(1.5)
        zenit_api.send_angles(movement_description[1], 0)
        time.sleep(1.0)
        zenit_api.send_angles(movement_description[2], 0)
        time.sleep(2.0)
        zenit_api.send_angles(movement_description[3], 0)
        time.sleep(1.0)
        zenit_api.send_angles(movement_description[4], 0)
        time.sleep(2.0)
        zenit_api.send_angles(movement_description[2], 0)
        time.sleep(3.5)

    async def look3(self, zenit_api, payload):
        angle_v, angle_h = self.rotateBaseToTarget(payload["data"]["baseX"], payload["data"]["baseY"], payload["data"]["baseZ"], payload["data"]["baseRotation"], payload["data"]["personX"], payload["data"]["personY"], payload["data"]["personZ"])
        self.personFocusAngleHorizontal = angle_v
        self.personFocusAngleVertical = angle_h

        movement_description = [
            [(self.personFocusAngleHorizontal - 3), -15, self.personFocusAngleVertical - 5, 0, 30, 0],
            [(self.personFocusAngleHorizontal - 3), -15, self.personFocusAngleVertical - 5, 0, 25, -15],
            [(self.personFocusAngleHorizontal),     -15, self.personFocusAngleVertical - 5, -10, 25, 0],
            [(self.personFocusAngleHorizontal + 3), -15, self.personFocusAngleVertical - 5, 0, 30, 0],
            [(self.personFocusAngleHorizontal + 3), -15, self.personFocusAngleVertical - 5, 0, 25, 15]
        ]

        zenit_api.send_angles(movement_description[0], 0)
        time.sleep(2.0)
        zenit_api.send_angles(movement_description[1], 0)
        time.sleep(2.0)
        zenit_api.send_angles(movement_description[2], 0)
        time.sleep(1.0)
        zenit_api.send_angles(movement_description[3], 0)
        time.sleep(2.0)
        zenit_api.send_angles(movement_description[4], 0)
        time.sleep(1.0)
        zenit_api.send_angles(movement_description[2], 0)
        time.sleep(1.5)

    async def nap(self, zenit_api):
        look_direction = random.randint(-35, 35)
        movement_description = [
            [self.personFocusAngleHorizontal, -55, 45, -85, 75, 65],
        ]

        zenit_api.send_angles(movement_description[0], 20)
        time.sleep(6.5)

    async def napWake(self, zenit_api, payload):
        angle_v, angle_h = self.rotateBaseToTarget(payload["data"]["baseX"], payload["data"]["baseY"], payload["data"]["baseZ"], payload["data"]["baseRotation"], payload["data"]["personX"], payload["data"]["personY"], payload["data"]["personZ"])
        self.personFocusAngleHorizontal = angle_v
        self.personFocusAngleVertical = angle_h
        #look_direction = random.randint(-15, 15)
        print(angle_h)
        movement_description = [
            [angle_v, (angle_h - 9), -10, 0, 25, 20],
            [angle_v, (angle_h - 9), 0, 0, 20, -20],
            [angle_v, (angle_h - 9), 0, 0, 25, 20]
        ]

        zenit_api.send_angles(movement_description[0], 0)
        time.sleep(1.5)
        zenit_api.send_angles(movement_description[1], 0)
        time.sleep(1.5)
        zenit_api.send_angles(movement_description[2], 0)
        time.sleep(1.5)

    async def relax(self, zenit_api):
        look_direction = random.randint(-20, 20)
        movement_description = [
            [look_direction, 0, -30, 10, -20, 0],
            [look_direction, 0, -10, 0, 5, 0],
        ]
        print("before send_angles")
        zenit_api.send_angles(movement_description[0], 0)
        time.sleep(1.5)
        zenit_api.send_angles(movement_description[1], 0)
        time.sleep(1.5)

    async def stretch(self, zenit_api):
        look_direction = random.randint(-20, 20)
        movement_description = [
            [look_direction, 0, -30, 10, -20, 0],
            [look_direction, 0, -10, 0, 5, 0],
        ]
        print("before send_angles")
        zenit_api.send_angles(movement_description[0], 0)
        time.sleep(1.5)
        zenit_api.send_angles(movement_description[1], 0)
        time.sleep(1.5)

    async def neutral(self, zenit_api):
        movement_description = [
            [self.personFocusAngleHorizontal, -10, -20, 0, 15, 0]
        ]
        print("before send_angles")
        zenit_api.send_angles(movement_description[0], 0)
        time.sleep(1.5)
        
    async def joy(self, zenit_api):
        movement_description = [
            [(self.personFocusAngleHorizontal - 20), -25, -30, -10, 15, -5],
            [(self.personFocusAngleHorizontal), -45, 10, 0, 35, 0],
            [(self.personFocusAngleHorizontal + 20), -25, -30, 10, 15, 5]
        ]
        print("before send_angles")
        zenit_api.send_angles(movement_description[0], 0)
        time.sleep(1.5)
        zenit_api.send_angles(movement_description[1], 0)
        time.sleep(1.5)
        zenit_api.send_angles(movement_description[2], 0)
        time.sleep(1.5)
        zenit_api.send_angles(movement_description[1], 0)
        time.sleep(1.5)
        self.activity_ended()

    async def sadness(self, zenit_api):
        movement_description = [
            [self.personFocusAngleHorizontal, 5, 5, 0, 10, 0],
            [self.personFocusAngleHorizontal, 10, 10, 0, 15, 0],
            [self.personFocusAngleHorizontal, 20, 22, 0, 27, 0],
            [self.personFocusAngleHorizontal, 20, 20, 0, -25, 0]
        ]
        print("before send_angles")
        zenit_api.send_angles(movement_description[0], 1)
        time.sleep(1.5)
        zenit_api.send_angles(movement_description[1], 1)
        time.sleep(1.5)
        zenit_api.send_angles(movement_description[2], 1)
        time.sleep(4.5)
        zenit_api.send_angles(movement_description[3], 1)
        time.sleep(1.5)
        self.activity_ended()

    async def disgust(self, zenit_api):
        movement_description = [
            [self.personFocusAngleHorizontal + 25, -55, 40, 90, 70, -90],
            [self.personFocusAngleHorizontal + 20, -50, 40, 90, 65, -90],
        ]
        print("before send_angles")
        zenit_api.send_angles(movement_description[0], 0)
        time.sleep(3.5)
        zenit_api.send_angles(movement_description[1], 0)
        time.sleep(1.5)
        self.activity_ended()

    async def surprise(self, zenit_api):
        print("Original Angle:" + str(self.personFocusAngleVertical))
        lookAngle = self.personFocusAngleVertical*0.8 + 85
        print("Modified Angle:" + str(lookAngle))
        
        movement_description = [
            [self.personFocusAngleHorizontal, -13, self.personFocusAngleVertical - 15, 0, 45, 0],
            [self.personFocusAngleHorizontal + 13, -5, self.personFocusAngleVertical - 15, 0, 45, 0],
            [self.personFocusAngleHorizontal - 13, -5, self.personFocusAngleVertical - 15, 0, 45, 0],
        ]
        print("before send_angles")
        zenit_api.send_angles(movement_description[0], 0)
        time.sleep(1.5)
        zenit_api.send_angles(movement_description[1], 0)
        time.sleep(1.5)
        zenit_api.send_angles(movement_description[2], 0)
        time.sleep(1.5)
        zenit_api.send_angles(movement_description[0], 0)
        time.sleep(1.5)
        self.activity_ended()

    async def fear(self, zenit_api):
        movement_description = [
            [self.personFocusAngleHorizontal, -50, 5, 0, 35, 0],
            [self.personFocusAngleHorizontal, -45, 0, 0, 25, 0],
        ]
        print("before send_angles")
        zenit_api.send_angles(movement_description[0], 0)
        time.sleep(3.5)
        zenit_api.send_angles(movement_description[1], 0)
        time.sleep(1.5)
        self.activity_ended()

    async def contempt(self, zenit_api):
        movement_description = [
            [self.personFocusAngleHorizontal + 25, (self.personFocusAngleVertical + 15), 5, -80, 40, 80],
            [self.personFocusAngleHorizontal + 20, (self.personFocusAngleVertical + 15), 10, -70, 35, 70],
        ]
        print("before send_angles")
        zenit_api.send_angles(movement_description[0], 0)
        time.sleep(3.5)
        zenit_api.send_angles(movement_description[1], 0)
        time.sleep(1.5)
        self.activity_ended()

    async def anger(self, zenit_api):
        movement_description = [
            [(self.personFocusAngleHorizontal), -45, 40, 0, 0, 0],
            [(self.personFocusAngleHorizontal), 55, (self.personFocusAngleVertical - 50), 0, 0, 0],
            [(self.personFocusAngleHorizontal - 3), 55, (self.personFocusAngleVertical - 50), -10, 0, -5],
            [(self.personFocusAngleHorizontal + 3), 55, (self.personFocusAngleVertical - 40), 10, 0, 5],
            [(self.personFocusAngleHorizontal), 55, (self.personFocusAngleVertical - 50), 0, 0, 0]
        ]
        print("before send_angles")
        zenit_api.send_angles(movement_description[0], 0)
        time.sleep(1.0)
        zenit_api.send_angles(movement_description[1], 0)
        time.sleep(1.0)
        zenit_api.send_angles(movement_description[2], 0)
        time.sleep(1.0)
        zenit_api.send_angles(movement_description[3], 0)
        time.sleep(1.0)
        zenit_api.send_angles(movement_description[4], 0)
        time.sleep(1.5)
        self.activity_ended()

    async def squad(self, zenit_api):
        movement_description = [
            [(self.personFocusAngleHorizontal), -33, 26, 0, 0, 0],
            [(self.personFocusAngleHorizontal), -15, self.personFocusAngleVertical - 5, 0, 30, 0],
        ]
        print("before send_angles")
        zenit_api.send_angles(movement_description[0], 0)
        time.sleep(1.0)
        zenit_api.send_angles(movement_description[1], 0)
        time.sleep(1.0)

    async def seekAttention(self, zenit_api):
        movement_description = [
            [(self.personFocusAngleHorizontal - 3), -15, self.personFocusAngleVertical - 5, 0, 30, 0],
            [(self.personFocusAngleHorizontal - 3), -15, self.personFocusAngleVertical - 5, 0, 25, -15],
            [(self.personFocusAngleHorizontal),     -15, self.personFocusAngleVertical - 5, -10, 25, 0],
            [(self.personFocusAngleHorizontal + 3), -15, self.personFocusAngleVertical - 5, 0, 30, 0],
            [(self.personFocusAngleHorizontal + 3), -15, self.personFocusAngleVertical - 5, 0, 25, 15]
        ]
        print("before send_angles")
        zenit_api.send_angles(movement_description[0], 0)
        time.sleep(1.0)
        zenit_api.send_angles(movement_description[1], 0)
        time.sleep(1.0)
        zenit_api.send_angles(movement_description[2], 0)
        time.sleep(1.0)
        zenit_api.send_angles(movement_description[3], 0)
        time.sleep(1.0)
        zenit_api.send_angles(movement_description[4], 0)
        time.sleep(1.0)
        zenit_api.send_angles(movement_description[2], 0)

    async def stop(self, zenit_api):
        movement_description = [
            [self.personFocusAngleHorizontal + 25, -55, 40, 90, 70, -90],
            [self.personFocusAngleHorizontal + 20, -50, 40, 90, 65, -90],
        ]
        print("before send_angles")
        zenit_api.send_angles(movement_description[0], 0)
        time.sleep(3.5)
        zenit_api.send_angles(movement_description[1], 0)
        time.sleep(1.5)


    def perform_mimicry(self, payload):
	    # To be implemented
        print("Perform mimicry")
        bP_LeanForwardBackward = payload['data']['mimicryData']['bP_LeanForwardBackward']
        bP_LeanSideward = payload['data']['mimicryData']['bP_LeanSideward']
        bP_HeadForwardBackward = payload['data']['mimicryData']['bP_HeadForwardBackward']
        bP_HeadSideward = payload['data']['mimicryData']['bP_HeadSideward']
        bP_ArmsOpenClosed = payload['data']['mimicryData']['bP_ArmsOpenClosed']
        bP_ArmsOnHip = payload['data']['mimicryData']['bP_ArmsOnHip']
        bP_LegsOpenCrossed = payload['data']['mimicryData']['bP_LegsOpenCrossed']
        bP_LegsStretched = payload['data']['mimicryData']['bP_LegsStretched']
        poses = [bP_LeanForwardBackward, 
                 bP_LeanSideward, 
                 bP_HeadForwardBackward, 
                 bP_HeadSideward, 
                 bP_ArmsOpenClosed, 
                 bP_ArmsOnHip, 
                 bP_LegsOpenCrossed, 
                 bP_LegsStretched]


        print("bP_LeanForwardBackward:", bP_LeanForwardBackward)
        print("bP_LeanSideward:", bP_LeanSideward)
        print("bP_HeadForwardBackward:", bP_HeadForwardBackward)
        print("bP_HeadSideward:", bP_HeadSideward)
        print("bP_ArmsOpenClosed:", bP_ArmsOpenClosed)
        print("bP_ArmsOnHip:", bP_ArmsOnHip)
        print("bP_LegsOpenCrossed:", bP_LegsOpenCrossed)
        print("bP_LegsStretched:", bP_LegsStretched)
     

        weights = [6.5, 5.5, 2, 2, 1, 0.5, 1, 0]
        joint_angles = self.choose_current_pose(poses=poses, weights=weights)

        joint_angles_pred = self.infer(self.neural_net_path, poses)

        # print(joint_angles_pred)

        if self.use_nn:
            self.zenit_api.send_angles(joint_angles_pred, 100)
        else:
            self.zenit_api.send_angles(joint_angles, 100)


    
    def leaning_forward_backward(self, x_1):
        j_1 = 0
        
        j_2 = 0.002684 * x_1 * x_1 + 0.2533 * x_1 + 4.437
        if j_2 < 0:
            j_2 = 0
        if j_2 > 50:
            j_2 = 50

        j_3 = -0.0012381 * x_1 * x_1 + 0.60333 * x_1 - 47.619
        if j_3 < -120:
            j_3 = -120
        if j_3 > 0:
            j_3 = 0
        
        j_4 = 0
        
        j_5 = -0.00058528 * x_1 * x_1 - 0.8507 * x_1 + 19.549
        if j_5 < -70:
            j_5 = -70
        if j_5 > 99:
            j_5 = 99
        
        j_6 = 0

        return [j_1, j_2, j_3, j_4, j_5, j_6]
    

    def leaning_sideward(self, x_2):
        j_1 = -0.00014545 * x_2 * x_2 * x_2 - 0.0001732 * x_2 * x_2 + 2.2727 * x_2 - 3.7229
        if j_1 < -95:
            j_1 = -95
        if j_1 > 85:
            j_1 = 85
        
        j_2 = 0.00000000014791 * x_2 * x_2 * x_2 * x_2 * x_2 * x_2 - 0.0000000000000000000000293177 *  x_2 * x_2 * x_2 * x_2 * x_2 - 0.0000027268 *  x_2 * x_2 * x_2 * x_2 + 0.00000000000000000020879 *  x_2 * x_2 * x_2 + 0.017188 * x_2 * x_2 - 0.00000000000000035223 * x_2 + 2.9371
        if j_2 < 0:
            j_2 = 0
        if j_2 > 50:
            j_2 = 50
        
        if x_2 < -25 or x_2 > 25:
            j_3 = -90
        else:
            j_3 = -50

        j_4 = -0.000000037415 * x_2 * x_2 * x_2 * x_2 * x_2 + 0.000634219 * x_2 * x_2 * x_2 - 3.5617 * x_2
        if j_4 < -95:
            j_4 = -95
        if j_4 > 95:
            j_4 = 95
        
        if x_2 < -25 or x_2 > 25:
            j_5 = 75
        else:
            j_5 = 20
        
        if x_2 <= 0:
            j_6 = 0
        else:
            j_6 = 15

        return [j_1, j_2, j_3, j_4, j_5, j_6]
    

    def head_forward_backward(self, x_3):
        j_1 = 0
        
        j_2 = 0
        
        j_3 = -0.000709957 * x_3 * x_3 + 0.12 * x_3 - 54.26
        if j_3 < -70:
            j_3 = -70
        if j_3 > -50:
            j_3 = -50
        
        j_4 = 0

        j_5 = 0.00218 * x_3 * x_3 + 0.6047 * x_3 + 20.138
        if j_5 < -15:
            j_5 = -15
        if j_5 > 98:
            j_5 = 98

        j_6 = 0
        return [j_1, j_2, j_3, j_4, j_5, j_6]


    def head_sideward(self, x_4):
        j_1 = 0
        
        j_2 = 0
        
        j_3 = -50

        j_4 = 0

        j_5 = 20

        j_6 = 0.00003394 * x_4 * x_4 * x_4 - 0.62303 * x_4
        if j_6 < -30:
            j_6 = -30
        if j_6 > 30:
            j_6 = 30

        return [j_1, j_2, j_3, j_4, j_5, j_6]
    

    def arms_open_closed(self, x_5):
        j_1 = 0

        j_2 = -0.001169 * x_5 * x_5 + 0.597 * x_5 - 6.797
        if j_2 < -70:
            j_2 = -70
        if j_2 > 40:
            j_2 = 40
        
        j_3 = -0.6267 * x_5 - 41.11
        if j_3 < -100:
            j_3 = -100
        if j_3 > 20:
            j_3 = 20
        
        j_4 = 0

        j_5 = 20

        j_6 = 0

        return [j_1, j_2, j_3, j_4, j_5, j_6]
    

    def arms_on_hip(self, x_6):
        j_1 = 0

        j_2 = 0
        
        if x_6 < 90:
            j_3 = -50
        else:
            j_3 = -70

        j_4 = 0

        if x_6 < 90:
            j_5 = 20
        else:
            j_5 = 40
        
        if x_6 < 90:
            j_6 = 0
        else:
            j_6 = 15

        return [j_1, j_2, j_3, j_4, j_5, j_6]
    

    def legs_open_crossed(self, x_7):
        j_1 = 0

        j_2 = -0.000011313 * x_7 * x_7 * x_7 - 0.00064069 * x_7 * x_7 + 0.2101 * x_7 - 5.108
        if j_2 < -20:
            j_2 = -20
        if j_2 > 0:
            j_2 = 0

        j_3 = -0.00030303 * x_7 * x_7 - 0.2167 * x_7 - 46.52
        if j_3 < -70:
            j_3 = -70
        if j_3 > -30:
            j_3 = -30
        
        j_4 = 0

        j_5 = 0.0010216 * x_7 * x_7 + 0.08 * x_7 + 19.632
        if j_5 < 20:
            j_5 = 20
        if j_5 > 40:
            j_5 = 40

        j_6 = 0

        return [j_1, j_2, j_3, j_4, j_5, j_6]
    

    def choose_current_pose(self, poses, weights = [6.5, 5.5, 1.5, 1.5, 1, 0.7, 1, 0]):
        weights = np.array(weights)
        poses_weighted = poses * weights
        poses_weighted_abs = [abs(x) for x in poses_weighted]
        idx_max = np.argmax(poses_weighted_abs)
        
        # print(idx_max)

        # mean filter of idx
        for i in range(len(self.idx_ringbuffer) - 1, 0, -1):
            self.idx_ringbuffer[i] = self.idx_ringbuffer[i-1]
        self.idx_ringbuffer[0] = idx_max
        idx_max = int(sum(self.idx_ringbuffer) / self.ringbuffer_length)
        print('choosen pose',idx_max)
        
        if idx_max == 0:
            joint_angles = self.leaning_forward_backward(poses[0])
        elif idx_max == 1:
            joint_angles = self.leaning_sideward(poses[1])
        elif idx_max == 2:
            joint_angles = self.head_forward_backward(poses[2])
        elif idx_max == 3:
            joint_angles = self.head_sideward(poses[3])
        elif idx_max == 4:
            joint_angles = self.arms_open_closed(poses[4])
        elif idx_max == 5:
            joint_angles = self.arms_on_hip(poses[5])
        elif idx_max == 6:
            joint_angles = self.legs_open_crossed(poses[6])
        elif idx_max == 7:
            joint_angles = self.leaning_forward_backward(poses[7])
        
        return joint_angles


    def set_activity(self, payload):
        #print(payload)
        if(self.activity != payload['activity']):
            self.activity = payload['activity']
            print("set activity ", self.activity)
            if(payload['activity'] == 'followHeadPercentages'):
                print("followHeadPercentages")
                self.zenit_network.backsend("getPersonViewPortPercentages")

            if(payload['activity'] == 'followHead' ):
                self.zenit_network.backsend("getPersonCoordinates")

            if(payload['activity'] == 'followHeadVertical'):
                self.zenit_network.backsend("getPersonCoordinates")
				
            if(payload['activity'] == 'performMimicry' ):
                self.zenit_network.backsend("getMimicryInformation")

            if(payload['activity'] == 'stop'):
                asyncio.run(self.stop(self.zenit_api))

            if(payload['activity'] == 'neutral'):
                asyncio.run(self.neutral(self.zenit_api))

            if(payload['activity'] == 'joy'):
                asyncio.run(self.joy(self.zenit_api))

            if(payload['activity'] == 'anger'):
                asyncio.run(self.anger(self.zenit_api))

            if(payload['activity'] == 'sadness'):
                asyncio.run(self.sadness(self.zenit_api))

            if(payload['activity'] == 'disgust'):
                asyncio.run(self.disgust(self.zenit_api))

            if(payload['activity'] == 'contempt'):
                asyncio.run(self.contempt(self.zenit_api))

            if(payload['activity'] == 'fear'):
                asyncio.run(self.fear(self.zenit_api))

            if(payload['activity'] == 'surprise'):
                asyncio.run(self.surprise(self.zenit_api))

            if(payload['activity'] == 'squad'):
                asyncio.run(self.squad(self.zenit_api))

            if(payload['activity'] == 'jawn'):
                asyncio.run(self.jawn(self.zenit_api))

            if(payload['activity'] == 'look1'):
                self.zenit_network.backsend("getPersonCoordinates")

            if(payload['activity'] == 'look2'):
                self.zenit_network.backsend("getPersonCoordinates")

            if(payload['activity'] == 'look3'):
                self.zenit_network.backsend("getPersonCoordinates")

            if(payload['activity'] == 'relax'):
                asyncio.run(self.relax(self.zenit_api))

            if(payload['activity'] == 'nap'):
                asyncio.run(self.nap(self.zenit_api))

            if(payload['activity'] == 'napWake'):
                self.zenit_network.backsend("getPersonCoordinates")
                ##asyncio.run(self.napWake(self.zenit_api))

            if(payload['activity'] == 'stretch'):
                asyncio.run(self.stretch(self.zenit_api))

            if(payload['activity'] == 'seekAttention'):
                asyncio.run(self.seekAttention(self.zenit_api))

        return True

    def digest_activity_data(self, payload):

        if(self.activity == 'napWake'):
            asyncio.run(self.napWake(self.zenit_api, payload))

        if(self.activity == 'look1'):
            asyncio.run(self.look1(self.zenit_api, payload))

        if(self.activity == 'look2'):
            asyncio.run(self.look2(self.zenit_api, payload))

        if(self.activity == 'look3'):
            asyncio.run(self.look3(self.zenit_api, payload))

        if(self.activity == 'followHeadPercentages'):
            if(self.ready_for_command() == False):
                time.sleep(0.5)
                self.zenit_network.backsend("getPersonViewPortPercentages")
                return False
            self.follow_head_percentages(payload)
            time.sleep(0.5)
            self.zenit_network.backsend("getPersonViewPortPercentages")
        
        if(self.activity == 'followHead'):
            if(self.ready_for_command() == False):
                time.sleep(0.1)
                self.zenit_network.backsend("getPersonCoordinates")
                return False
            self.follow_head(payload)
            time.sleep(0.1)
            self.zenit_network.backsend("getPersonCoordinates")
        
        if(self.activity == 'followHeadVertical'):
            if(self.ready_for_command() == False):
                time.sleep(0.1)
                self.zenit_network.backsend("getPersonCoordinates")
                return False
            #print(self.ready_for_command())
            self.follow_head_vertical(payload)
            time.sleep(0.1)
            self.zenit_network.backsend("getPersonCoordinates")
			
        if(self.activity == 'performMimicry'):
            if(self.ready_for_command() == False):
                time.sleep(0.1)
                self.zenit_network.backsend("getMimicryInformation")
                return False
            #print(self.ready_for_command())
            self.perform_mimicry(payload)
            time.sleep(0.1)
            self.zenit_network.backsend("getMimicryInformation")
        return True

    def ready_for_command(self):
        if time.time() - self.last_action_timestamp > self.DIGEST_THRESHOLD:
            return True
        return False