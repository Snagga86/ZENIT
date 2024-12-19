import websocket
import time
import json
from io import StringIO


class RobotNetwork:
    def __init__(self, ip, port):
        self.zenit_bot = ""
        self.webservice_ip = 'ws://' + ip + ':' + str(port)
        websocket.enableTrace(False)
        self.ws = None

    def start(self, zenit_bot):
        self.zenit_bot = zenit_bot
        try:
            self.connect()  # Start the connection process
        except KeyboardInterrupt:
            print("Keyboard interrupt received. Shutting down...")
            # Perform any necessary cleanup here if needed
            exit(0)  # Exit the program

    def connect(self):
        while True:
            try:
                if self.ws is not None:  # Ensure no lingering WebSocket connection
                    self.ws.close()
                    self.ws = None

                self.ws = websocket.WebSocketApp(
                    self.webservice_ip,
                    on_open=self.on_open,
                    on_message=self.on_message,
                    on_error=self.on_error,
                    on_close=self.on_close
                )
                print("Attempting to connect...")
                self.ws.run_forever()  # Attempt to connect
                print("Connection closed, retrying in 5 seconds...")
                time.sleep(5)  # Wait for 5 seconds before retrying
            except Exception as e:
                print(f"Unexpected error: {e}. Retrying in 5 seconds...")
                time.sleep(5)  # Wait for 5 seconds before retrying

    def on_message(self, ws, message):
        try:
            io = StringIO(message)
            json_obj = json.load(io)
            if json_obj['mode'] == "setMode":
                self.zenit_bot.set_activity(json_obj)
            elif json_obj['mode'] == "dataSupply":
                self.zenit_bot.digest_activity_data(json_obj)
        except json.JSONDecodeError as e:
            print(f"Error decoding message: {e}")
        except Exception as e:
            print(f"Error handling message: {e}")

    def on_error(self, ws, error):
        print("WebSocket error:", error)

    def on_close(self, ws, close_status_code, close_msg):
        print("### WebSocket closed ###")
        if self.zenit_bot:
            self.zenit_bot.reset()

    def on_open(self, ws):
        print("Opened connection")

    def backsend(self, data):
        try:
            if self.ws:
                self.ws.send(data)
        except Exception as e:
            print(f"Error sending data: {e}")
