import { ZENITServer } from './connection/zenit-server.js';
import * as fs from 'fs';

let rawdata = fs.readFileSync('server-conf.json');
let serverConf = JSON.parse(rawdata);

const server = new ZENITServer(serverConf.config);

server.startAllNetworkServices();