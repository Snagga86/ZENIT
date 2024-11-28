import { ZENITServer } from './connection/zenit-server.js';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

// Resolve the directory of the current file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve the absolute path to server-conf.json
const configPath = path.resolve(__dirname, './server-conf.json');

// Read and parse the configuration file
let rawdata = fs.readFileSync(configPath);
let serverConf = JSON.parse(rawdata.toString());

// Pass the absolute path to ZENITServer and other dependencies
const server = new ZENITServer(serverConf.config, configPath);

server.startAllNetworkServices();