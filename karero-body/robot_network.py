import asyncio
import websocket
import _thread
import time
import rel
import json
from io import StringIO

class RobotNetwork:
    def __init__(self, ip, port):
        self.karero_bot = ""
        self.webservice_ip = 'ws://' + ip + ':' + str(port)
        websocket.enableTrace(False)
        self.ws = websocket.WebSocketApp(self.webservice_ip,
                                on_open=self.on_open,
                                on_message=self.on_message,
                                on_error=self.on_error,
                                on_close=self.on_close)


    '''async def recvSendProcedure(self):
        async with websockets.connect(self.webservice_ip) as websocket:
            while True:
                
                #name = input("What's your name? ")
                #await websocket.send(name)
                #print("> {}".format(name))

                greeting = await websocket.recv()
                print("< {}".format(greeting))'''

        

    def start(self, karero_bot):
        #asyncio.get_event_loop().run_until_complete(self.recvSendProcedure())
        self.karero_bot = karero_bot
        self.ws.run_forever(dispatcher=rel)  # Set dispatcher to automatic reconnection
        rel.signal(2, rel.abort)  # Keyboard Interrupt
        rel.dispatch()

    def on_message(self, ws, message):
        print(message)
        io = StringIO(message)
        json_obj = json.load(io)
        if(json_obj['mode'] == "setMode"):
            executed = self.karero_bot.set_activity(json_obj)

        if(json_obj['mode'] == "dataSupply"):
            executed = self.karero_bot.digest_activity_data(json_obj)
        

    def on_error(self, ws, error):
        print(error)

    def on_close(self, ws, close_status_code, close_msg):
        print("### closed ###")

    def on_open(self, ws):
        print("Opened connection")

    def backsend(self, data):
        self.ws.send(data)