import { KAREROServer } from './connection/server.js';
import * as fs from 'fs';

let rawdata = fs.readFileSync('server-conf.json');
let serverConf = JSON.parse(rawdata);

const server = new KAREROServer(serverConf.config.networkConfig, serverConf.config.robotPosition);

server.startAllNetworkServices();