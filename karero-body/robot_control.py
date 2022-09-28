from pymycobot.mycobot import MyCobot
import socket
import numpy as np
import time

UDP_IP = "192.168.0.102"
UDP_PORT = 6789

sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
sock.bind((UDP_IP, UDP_PORT))

i = 0

karero = MyCobot('/dev/ttyAMA0', 1000000, debug = False)
#karero.power_off();
karero.power_on();
karero.set_fresh_mode(1)
print(karero.is_power_on())
print(karero.is_controller_connected())
#karero.send_angle(1, 90, 1)
#karero.send_angles([30,30,0,30,30,30],10)
print("init is moving:", karero.is_moving());

karero.send_angles([0,0,0,0,0,0],90)
for x in range(1):
    #time.sleep(6)
    print(karero.get_angles())


#karero.send_angles([90,20,25,25,-25,-25],90)
#time.sleep(1.0)
#karero.send_angles([0,20,25,25,-25,-25],90)
#karero.send_angles([-90,20,25,25,-25,-25],90)

for x in range(11111):
    karero.send_angles([0,0,0,0,0,0],90)
    time.sleep(3)
    karero.send_angle(6, 45, 99)
    time.sleep(0.25)
    karero.send_angle(6, 0, 99)
    time.sleep(0.25)
    karero.send_angle(6, -45, 99)
    time.sleep(0.25)
    karero.send_angle(6, 0, 99)
    time.sleep(0.25)
    karero.send_angle(6, -45, 99)
    time.sleep(0.25)
    karero.send_angle(6, 0, 99)
    time.sleep(0.25)
    karero.send_angle(6, 45, 99)
    time.sleep(0.25)
    karero.send_angle(1, 90, 55)
    time.sleep(0.025)
    karero.send_angle(2, 20, 6)
    time.sleep(0.025)
    karero.send_angle(3, -25, 6)
    time.sleep(0.025)
    karero.send_angle(4, 15, 6)
    time.sleep(0.025)
    karero.send_angle(5, -15, 6)
    time.sleep(0.025)
    karero.send_angle(6, -35, 66)
    time.sleep(0.025)
    karero.send_angle(1, -35, 6)
    time.sleep(0.025)
    print(karero.get_angles())
    time.sleep(5)
    #print(karero.read_next_error())


'''for x in range(11111):
    karero.send_angles([0,0,0,0,0,0],90)
    time.sleep(3)
    karero.send_angle(1, 90, 55)
    time.sleep(0.025)
    karero.send_angle(2, 20, 6)
    time.sleep(0.025)
    karero.send_angle(3, -25, 6)
    time.sleep(0.025)
    karero.send_angle(4, 15, 6)
    time.sleep(0.025)
    karero.send_angle(5, -15, 6)
    time.sleep(0.025)
    karero.send_angle(6, -35, 66)
    time.sleep(0.025)
    karero.send_angle(1, -35, 6)
    time.sleep(0.025)
    print(karero.get_angles())
    time.sleep(5)
    #print(karero.read_next_error())
'''

while True:
    print("wait")
    data, addr = sock.recvfrom(1024)
    data = data.decode("utf-8").split(",")
    print("is moving:", karero.is_moving());
    #print(data)
    #movement = data[0:6]
    #speed = data[6]
    if(data[0] == "sync_send_angles"):
        print("sync_send_angles")
        degrees = list(map(int, data[1:7]))
        speed = int(data[7])
        timeout = int(data[8])
        karero.sync_send_angles(degrees, speed, timeout)
    elif(data[0] == "send_angles"):
        print("send_angles")
        degrees = list(map(int, data[1:7]))
        speed = int(data[7])
        karero.send_angles(degrees, speed)
    elif(data[0] == "send_angle"):
        print("send_angle")
        id = int(data[1])
        degree = int(data[2])
        speed = int(data[3])
        print("id:", id, " degree:", degree, " speed:", speed)
        x = "%s"%(karero.get_radians())
        print(x)
        sock.sendto(bytearray(x, 'utf-8'),addr)
        karero.send_angle(id, degree, speed)
    elif(data[0] == "send_angles_single"):
        print("send_angles_single")
        print(len(data))
        i = 0
        while i < (len(data) - 1):
            print("set id: ", int(data[i+1]), " degree: ", int(data[i+2]), " speed: ", int(data[i+3]))
            karero.send_angle(int(data[i+1]), int(data[i+2]), int(data[i+3]))
            time.sleep(0.05)
            i = i+3
            print("log: ", i)
        
    #print("received msg:")
    #print(movement)
    #print(speed)