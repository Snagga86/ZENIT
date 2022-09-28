from pymycobot.mycobot import MyCobot
import socket
import numpy as np
import time
import data_pb2 as RobotCommand
import asyncio
import websockets

karero = MyCobot('/dev/ttyAMA0', 1000000, debug = False)
#karero.power_off();
karero.power_on();
time.sleep(0.03);
karero.set_fresh_mode(1)
time.sleep(0.03);
print("Power on: ", karero.is_power_on())

print("Controller connected: ", karero.is_controller_connected())

async def hello():
    async with websockets.connect('ws://192.168.0.101:3345') as websocket:
        while True:
            
            #name = input("What's your name? ")
            #await websocket.send(name)
            #print("> {}".format(name))

            greeting = await websocket.recv()
            print("< {}".format(greeting))

asyncio.get_event_loop().run_until_complete(hello())



#asyncio.get_event_loop().run_forever()






#sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
#server_address = ('192.168.0.101', 5999)
#sock.connect(server_address)

#lastTime = time.time()

#while True:  
#    data = sock.recv(16)
#    data = data.decode("utf-8").split(",")
#    print(data)
#    print(time.time() * 1000 - lastTime * 1000)
#    if (time.time() * 1000 - lastTime * 1000) > 30:
#        sock.sendall(bytes("1", 'utf-8'))
#        lastTime = time.time()
#        if(data[0] == "send_angles"):
#            print("send_angles")
#            degrees = list(map(int, data[1:7]))
#            speed = int(data[7])
#            karero.send_angles(degrees, speed)
#        elif(data[0] == "send_angle"):
#            print("send_angle")
#            id = int(data[1])
#            degree = int(data[2])
#            speed = int(data[3])
#            print("id:", id, " degree:", degree, " speed:", speed)
#            karero.send_angle(id, degree, speed)
#    else:
#        sock.sendall(bytes("0", 'utf-8'))
