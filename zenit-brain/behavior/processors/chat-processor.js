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
        /*const data = JSON.stringify({
            model: "ZENIT",
            prompt: text,
            stream: false
          }); */

        const data = JSON.stringify({ prompt: text });
          
          // Options for the HTTP request
        const options = {
            hostname: '127.0.0.1',
            port: 12345,
            path: '/ask',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json; charset=utf-8', // Ensure UTF-8 encoding
              'Content-Length': Buffer.byteLength(data, 'utf-8')
            }
        };

        var result;
    
        var req = http.request(options, (res) => {
            //console.log('statusCode:', res.statusCode);
            res.on('data', (d) => {
                var utf8Content = Buffer.from(d, 'utf-8').toString('utf-8');
                console.log(utf8Content)
                try{
                    res = JSON.parse(utf8Content);
                    res.emotion = this.repairLLMEmotion(res.emotion);
                    console.log(res);
                    result = res;
                }catch (e) {
                    result = this.xx;
                }
                
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
        console.log("Guessed emotion:" + guessedEmotion);
        var emotion = "neutral";

        switch (guessedEmotion.toLowerCase()){
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
            break;
            case "unangemessen": emotion = "contempt";
            break;
            case "enttäuschung": emotion = "sadness";
            break;
            case "mitgefühl": emotion = "sadness";
            break;
            case "besorgnis": emotion = "fear";
            break;
            case "neugier": emotion = "neutral";
            break;
            case "curiosity": emotion = "neutral";
            break;
            case "frustration": emotion = "sadness";
            break;
            case "verachtung": emotion = "contempt";
            break;
            case "angst": emotion = "fear";
            break;
            case "wütend": emotion = "anger";
            break;
            case "angry": emotion = "anger";
            break;
            case "wut": emotion = "anger";
            break;
            case "überraschung": emotion = "surprise";
            break;
            case "stolz": emotion = "joy";
            break;
            case "lust": emotion = "joy";
            break;
            case "lustig": emotion = "joy";
            break;
            case "ängstlich": emotion = "fear";
            break;
            case "arrogance": emotion = "contempt";
            break;
            default: emotion = "neutral";
        }

        return emotion;
      }
}