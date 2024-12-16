/**
 * ZENITServer Setup and Initialization
 * 
 * This script configures and starts the ZENITServer instance by loading configuration
 * details from a JSON file. The server is responsible for handling network services 
 * based on the provided configuration.
 * 
 * Dependencies:
 * - `ZENITServer` class for managing server operations.
 * - `fs` module for reading configuration files.
 * - `url` and `path` modules for resolving file paths.
 * - `source-map-support` module for enhanced debugging.
 */

import { ZENITServer } from './connection/zenit-server.js';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { install } from 'source-map-support';
install();

/** Resolve the directory of the current file */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Resolve the absolute path to the server configuration file */
const configPath = path.resolve(__dirname, './server-conf.json');

/**
 * Read and parse the configuration file
 * 
 * @type {Object} serverConf - The server configuration object loaded from JSON.
 */
let rawdata = fs.readFileSync(configPath);
let serverConf = JSON.parse(rawdata.toString());

/**
 * Create an instance of ZENITServer with configuration and start all network services.
 * 
 * @param {Object} serverConf.config - Configuration object for server initialization.
 * @param {string} configPath - Path to the configuration file.
 */
const server = new ZENITServer(serverConf.config, configPath);
server.startAllNetworkServices();
