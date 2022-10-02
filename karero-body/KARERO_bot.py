import asyncio
import websocket
import _thread
import time
import rel
import json
from io import StringIO
import numpy as np

class KAREROBot:

    def __init__(self, bot_api):
        self.bot_api = bot_api
        self.last_action_timestamp = time.time()
        self.MIN_TIME_DELTA = 0.6
    
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

        angle_h = np.arctan2(h_distance, y2 - 0.2 - y1 ) * 180 / np.pi - 90
        #if (angle_h < 0):
         #   angle_h = angle_h + 360

        print(angle_h)

        return [-1 * angle_v, -1 * angle_h]

    def action(self, action):
        if(time.time() - self.last_action_timestamp < self.MIN_TIME_DELTA):
            return False

        if(action['function'] == 'followHead'):
            angle_v, angle_h = self.rotateBaseToTarget(action["data"]["baseX"], action["data"]["baseY"], action["data"]["baseZ"], action["data"]["baseRotation"], action["data"]["personX"], action["data"]["personY"], action["data"]["personZ"])
            print(angle_v)
            self.bot_api.send_angles([angle_v, 0, angle_h, 0, 0, 0], 5)

        self.last_action_timestamp = time.time()
        return True