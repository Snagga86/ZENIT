from pymycobot.mycobot import MyCobot
import time
from pymycobot.genre import Angle
from robot_network import RobotNetwork
from ZENIT_bot import ZENITBot
import logging
import numpy as np

zenit_api = MyCobot('/dev/ttyAMA0', "1000000", timeout = 0.1, debug = False)
zenit_network = RobotNetwork("192.168.123.101", 3345)
zenit_bot_control = ZENITBot(zenit_api, zenit_network)