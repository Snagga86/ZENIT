import { KAREROServer } from './connection/server.js';

const networkConfig = {
  "RobotNetwork" : {
      "IpAddress" : "192.168.0.101",
      "Port" : 3345
  },
  "DisplayNetwork" : {
      "IpAddress" : "192.168.0.101",
      "Port" : 3344
  },
  "KinectNetwork" : {
      "IpAddress" : "192.168.0.101",
      "Port" : 9123
  },
  "EmotionNetwork" : {
      "IpAddress" : "192.168.0.101",
      "Port" : 1337
  }
}

const server = new KAREROServer(networkConfig);

server.startAllNetworkServices();