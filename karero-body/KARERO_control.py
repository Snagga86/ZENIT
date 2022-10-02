from pymycobot.mycobot import MyCobot
import time
from pymycobot.genre import Angle
from robot_network import RobotNetwork
from KARERO_bot import KAREROBot
import logging
from transitions import Machine, State
import numpy as np

logging.basicConfig(filename="/home/ubuntu/KARERO/karero-body/robolog.log", level=logging.INFO,filemode='w')

karero_api = MyCobot('/dev/ttyAMA0', "1000000", timeout = 0.1, debug = False)
karero_bot_control = KAREROBot(karero_api)
karero_network = RobotNetwork(karero_bot_control, "192.168.0.101", 3345)


karero_api.power_on();
time.sleep(2);
karero_api.set_fresh_mode(1)
time.sleep(0.5);
print("get_robot_version: ", karero_api.get_robot_version())
time.sleep(0.5);
print("Power on: ", karero_api.is_power_on())
time.sleep(0.5);

karero_network.start()



'''

class KARERO(object):
    def base_proc(self): 
        print("base enter")

    def idle_proc(self): 
        print("idle enter")
    def dance_proc(self): 
        print("dance enter")

karero = KARERO()

# Same states as above, but now we give StateA an exit callback
states = [
    State(name='base', on_enter=['base_proc']),
    State(name='idle', on_enter=['idle_proc']),
    State(name='dance', on_enter=['dance_proc'])
]
machine = Machine(karero, states=states)
machine.add_transition('go_idle', 'base', 'idle')
machine.add_transition('go_idle', 'dance', 'idle')
machine.add_transition('go_dance', 'idle', 'dance')
machine.add_transition('go_dance', 'base', 'dance')
machine.add_transition('repeat', 'base', 'base')
machine.add_transition('repeat', 'idle', 'idle')
machine.add_transition('repeat', 'dance', 'dance')
machine.add_transition('go_base', 'dance', 'base')
machine.add_transition('go_base', 'idle', 'base')

# Callbacks can also be added after initialization using
# the dynamically added on_enter_ and on_exit_ methods.
# Note that the initial call to add the callback is made
# on the Machine and not on the model.

# Test out the callbacks...
machine.set_state('base')
karero.sublimate()


time.sleep(0.5);
karero.set_fresh_mode(1)
time.sleep(0.5);
print("get_robot_version: ", karero.get_robot_version())
time.sleep(0.5);
print("Power on: ", karero.is_power_on())
time.sleep(0.5);
karero.send_angles([0,0,0,0,0,0], 0)
i=1
s=1
time.sleep(3.5);
karero.send_angles([0,0,0,-90,0,90], 0)
arr = [
    [0  , 10, 10  ,-5  ,20 ,10],
    [50 ,-20, 0   ,5   ,10  ,0],
    [0  ,-30, -10 ,-10 ,25  ,-10],
    [-50,-20, -25 ,-25  ,10 ,0]
]
time.sleep(13.5);
while True:
    #time.sleep(1.5)
    #angles = karero.get_angles()
    #print(angles)
    #print(s%50)
    #if(s%50 == 0):
    #    time.sleep(5);
    #time.sleep(1.5);
    #power_on = karero.is_power_on()
    power_on = 00
    #print("Power on: ", power_on)
    #if(power_on == -1):
    #    time.sleep(5);
    time.sleep(2.0);
    #karero.send_angles([i%4,i%7,i%8,i%9,i%10,i%14], 1)
    speed = 10*((i*time.time_ns())%4)+5
    print("speed: ", speed)
    karero.send_angles(arr[i%4], speed)
    angles = 0
    time_t = str(time.time())
    angles_t = str(angles)
    speed_t = str(speed)
    power_t = str(power_on)

    logging.critical("Time: " + time_t + " Angles: " + angles_t + " Speed: " + speed_t + " Power: " + power_t)
    print(i)
    i=i+1
    s=s+1
    if(i >= 1000):
        break
logging.shutdown()
#karero.power_off()

#print("retrieved: ", karero._process_received);

karero.power_on();
time.sleep(0.03);
#karero.resume();
time.sleep(0.03);
karero.set_servo_calibration(5)
time.sleep(0.03);
karero.set_fresh_mode(1)
time.sleep(2.03);
print("Power on: ", karero.is_power_on())
angles = karero.get_angles()
time.sleep(0.03);
karero.send_angles([0,0,0,0,0,0], 55)
time.sleep(3.03);
karero.release_all_servos()
time.sleep(1.03);
angles = karero.get_angles()
print(angles)
time.sleep(1.03);

time.sleep(1.03);
print(karero.read_next_error())
time.sleep(1.03);
print(karero.read_next_error())
time.sleep(1.03);
print(karero.read_next_error())
angles = karero.get_angles()
print(angles)
time.sleep(3.03);

angles = karero.get_angles()
print(angles)
print("is in pos:", karero.is_moving())
time.sleep(0.03);
print("Controller connected: ", karero.is_controller_connected())
print("is in pos:", karero.is_moving())
time.sleep(5.03);'''
#KARERO_network = RobotNetwork("192.168.0.101", 3345)
#KARERO_network.start()
