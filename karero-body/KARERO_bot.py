import asyncio
import _thread
import time
import rel
import json
import numpy as np
import websocket
from io import StringIO

class KAREROBot:

    def __init__(self, karero_api, karero_network):
        self.karero_api = karero_api
        self.karero_network = karero_network
        self.last_action_timestamp = time.time()
        self.activity = "base"
        self.DIGEST_THRESHOLD = 0.6

        karero_api.power_on();
        time.sleep(2);
        karero_api.set_fresh_mode(1)
        time.sleep(0.5);
        print("get_robot_version: ", karero_api.get_robot_version())
        time.sleep(0.5);
        print("Power on: ", karero_api.is_power_on())
        time.sleep(0.5);
        karero_api.send_angles([0,0,0,0,0,0], 0)

        self.karero_network.start(self)
    
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
            angle_v = angle_v + 360

        angle_v = angle_v + base_rotation

        h_distance = np.sqrt(np.power((x2 - x1),2) + np.power((z2 - z1),2))

        angle_h = np.arctan2(h_distance, y2 + 0.3 - y1 ) * 180 / np.pi - 90
        #if (angle_h < 0):
        #   angle_h = angle_h + 360

        print(angle_h)

        return [-1 * angle_v, -1 * angle_h]

    def follow_head(self, payload):
        angle_v, angle_h = self.rotateBaseToTarget(payload["data"]["baseX"], payload["data"]["baseY"], payload["data"]["baseZ"], payload["data"]["baseRotation"], payload["data"]["personX"], payload["data"]["personY"], payload["data"]["personZ"])
        print("follow head")
        self.karero_api.send_angles([angle_v, -15, angle_h - 5 , 0, 30, 0], 15)
        self.last_action_timestamp = time.time()
        
        
    def set_activity(self, payload):

        self.activity = payload['activity']

        if(payload['activity'] == 'followHead'):
            self.karero_network.backsend("getPersonCoordinates")

        return True

    def digest_activity_data(self, payload):
        
        if(self.activity == 'followHead'):
            if(self.ready_for_command() == False):
                time.sleep(0.1)
                self.karero_network.backsend("getPersonCoordinates")
                return False
            print(self.ready_for_command())
            self.follow_head(payload)
            time.sleep(0.1)
            self.karero_network.backsend("getPersonCoordinates")

        return True

    def ready_for_command(self):
        if time.time() - self.last_action_timestamp > self.DIGEST_THRESHOLD:
            return True
        return False
        
