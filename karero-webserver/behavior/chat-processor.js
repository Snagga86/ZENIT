import http from "http"
import EventEmitter from 'events';
import { Brain } from './brain.js';

export class ChatProcessor {

    constructor() {
        this.chatEvents = new EventEmitter();

    }

    sendMessage(text){
        var postData = JSON.stringify({
            "sender": "test_user",
            "message": text
        });

        
        var options = {
            hostname: 'localhost',
            port: 5005,
            path: '/webhooks/rest/webhook',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': postData.length
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
}