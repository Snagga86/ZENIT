import http from "http"
import EventEmitter from 'events';
import { Brain } from '../brain.js';

export class ChatProcessor {

    constructor() {
        this.chatEvents = new EventEmitter();
    }

    NLUSendMessage(text){
        var postData = JSON.stringify({
            "sender": "test_user",
            "message": text
        });

        console.log(postData);
        
        var options = {
            hostname: '127.0.0.1',
            port: 5005,
            path: '/webhooks/rest/webhook',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
                }
        };

        var result;
    
        var req = http.request(options, (res) => {
            console.log('statusCode:', res.statusCode);
            res.on('data', (d) => {
                result = JSON.parse(d.toString());
                this.chatEvents.emit(Brain.ROBOT_BRAIN_EVENTS.RASA_ANSWER, result);
            });
        });
    
        req.on('error', (e) => {
            console.error(e);
        });
    
        req.write(postData);
        req.end();
    }

    LLMSendMessage(text){
        const data = JSON.stringify({
            model: "ZENIT",
            prompt: text,
            stream: false
          });
          
          // Options for the HTTP request
        const options = {
            hostname: '127.0.0.1',
            port: 12345,
            path: '/api/generate',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json; charset=utf-8', // Ensure UTF-8 encoding
              'Content-Length': Buffer.byteLength(data, 'utf-8')
            }
        };

        var result;
    
        var req = http.request(options, (res) => {
            console.log('statusCode:', res.statusCode);
            res.on('data', (d) => {
                result = JSON.parse(d.toString());
                this.chatEvents.emit(Brain.ROBOT_BRAIN_EVENTS.LLAMA_ANSWER, result);
            });
        });
    
        req.on('error', (e) => {
            console.error(e);
        });
    
        req.write(data);
        req.end();
    }
}