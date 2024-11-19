import http from "http"
import EventEmitter from 'events';
import { Brain } from '../brain.js';

export class ChatProcessor {

    constructor() {
        this.chatEvents = new EventEmitter();
        this.defaultLLMReply = new Object();
        this.defaultLLMReply.answer = "Uups, da hat mein Sprachmodel eine invalide Antwort geliefert. Das kommt leider vor.";
        this.defaultLLMReply.emotion = "sadness";
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
                res = JSON.parse(d.toString());
                result = this.repairLLMAnswerJSON(res.response);
                this.chatEvents.emit(Brain.ROBOT_BRAIN_EVENTS.LLAMA_ANSWER, result);
            });
        });
    
        req.on('error', (e) => {
            console.error(e);
        });
    
        req.write(data);
        req.end();
    }

    repairLLMAnswerJSON(result){
        // Use a regular expression to extract the JSON object from the string
        const jsonMatch = result.match(/{.*}$/);
        if (!jsonMatch) {
            return this.defaultLLMReply;
        }
      
        // Extract the text before the JSON
        const textBeforeJson = result.slice(0, jsonMatch.index).trim();
        const jsonString = jsonMatch[0];
      
        // Parse the JSON string into an object
        let jsonObject;
        try {
          jsonObject = JSON.parse(jsonString);
        } catch (e) {
            return this.defaultLLMReply;
        }
      
        // Ensure the "answer" parameter exists and is a string before appending
        if (typeof jsonObject.answer === 'string') {
          jsonObject.answer = `${textBeforeJson} ${jsonObject.answer}`.trim();
        } else {
          jsonObject.answer = textBeforeJson; // If "answer" is not a string, set it to the textBeforeJson
        }

        jsonObject.emotion = this.repairLLMEmotion(jsonObject.emotion);
      
        return jsonObject;
      }

      repairLLMEmotion(guessedEmotion){
        console.log(guessedEmotion);
        var emotion = "neutral";

        switch (guessedEmotion){
            case "joy": emotion = "joy";
            break;
            case "surprise": emotion = "surprise";
            break;
            case "anger": emotion = "anger";
            break;
            case "contempt": emotion = "contempt";
            break;
            case "fear": emotion = "fear";
            break;
            case "disgust": emotion = "disgust";
            break;
            case "sadness": emotion = "sadness";
            break;
            case "neutral": emotion = "neutral";
            default: emotion = "neutral";
        }

        return emotion;
      }
}