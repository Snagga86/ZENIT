using System.Net.Sockets;
using System.Net;
using UnityEngine;
using System.Text;
using TMPro;
using System;
using NativeWebSocket;
using UnityEngine.XR;
using Newtonsoft.Json;
using UnityEngine.Video;
using System.Collections;
using UnityEngine.Networking;
using Unity.VisualScripting;

public class NetworkController : MonoBehaviour
{
    private const String IP_ADRESS = "192.168.123.101";
    private const int WEBSOCKET_PORT = 3344;
    private const int HTTP_PORT = 1340;

    public FaceActionController faceActionController;
    public GameObject DebugTrace;

    public WebSocket webSocket;

    public string websocketUrl = "ws://" + IP_ADRESS + ":" + WEBSOCKET_PORT;
    public string httpUrl = "http://" + IP_ADRESS + ":" + HTTP_PORT + "/getAudio";

    public UdpClient udpClient = new UdpClient();
    public IPEndPoint from = new IPEndPoint(0, 0);

    private string nonverbalAction = "";
    private string verbalAction = "";

    public string lastRequestPartial = "";
    public AudioClip primaryAudioClip;
    public AudioClip secondaryAudioClip;

    void Start()
    {

    }
    void Update()
    {

#if !UNITY_WEBGL || UNITY_EDITOR
        if (this.webSocket != null)
        {
            this.webSocket.DispatchMessageQueue();
        }

#endif

        // Check for screen touch on Android
        if (Input.touchCount > 0)
        {
            for (int i = 0; i < Input.touchCount; i++)
            {
                Touch touch = Input.GetTouch(i);

                if (touch.phase == TouchPhase.Began)
                {
                    HandleTouch(touch.position);
                }
            }
        }

        // Fallback: Check for key press (X key)
        if (Input.GetKeyDown(KeyCode.X))
        {
            HandleKeyPress();
        }
    }

    /// <summary>
    /// Handles the touch event and performs an action.
    /// </summary>
    /// <param name="touchPosition">The position of the touch.</param>
    private void HandleTouch(Vector2 touchPosition)
    {
        this.faceActionController.blinkDisgusted();
        this.primaryAudioClip = null;
        this.secondaryAudioClip = null;
        this.lastRequestPartial = "";
        this.faceActionController.nameSound("breakSpeech");
        this.faceActionController.playSound();
    }

    /// <summary>
    /// Handles the fallback key press event (X key).
    /// </summary>
    private void HandleKeyPress()
    {
        //var payload = "{\"action\": \"screenTouch\" }";
        this.faceActionController.blinkDisgusted();
        this.primaryAudioClip = null;
        this.secondaryAudioClip = null;
        this.lastRequestPartial = "";
        this.faceActionController.nameSound("breakSpeech");
        this.faceActionController.playSound();
    }


    public void sendMessage(string message)
    {
        if (webSocket != null && webSocket.State == WebSocketState.Open)
        {
            Debug.Log($"Sending message: {message}");
            webSocket.SendText(message);
        }
        else
        {
            Debug.LogWarning("WebSocket is not connected. Unable to send message.");
        }
    }

    public void connectToWebsocket(string websocketDescription)
    {

        this.websocketUrl = websocketDescription;
        this.webSocket = new WebSocket(this.websocketUrl.Substring(0, this.websocketUrl.Length - 1));

        this.webSocket.OnMessage += (data) =>
        {
            var message = System.Text.Encoding.UTF8.GetString(data);
            FaceControlDescription jsonControlObject = JsonConvert.DeserializeObject<FaceControlDescription>(message);

            if (jsonControlObject.mode == "setEmotion")
            {
                this.nonverbalAction = "\nMode: " + jsonControlObject.mode + "\nData: " + jsonControlObject.data + "\nExtra: " + jsonControlObject.extra;
            }
            if (jsonControlObject.mode == "setSound")
            {
                this.verbalAction = "Mode: " + jsonControlObject.mode + "\nData: " + jsonControlObject.data + "\nExtra: " + jsonControlObject.extra;
            }
            this.DebugTrace.GetComponent<TextMeshProUGUI>().text = this.verbalAction + this.nonverbalAction;

            if (jsonControlObject.mode == "setEmotion")
            {
                this.faceActionController.setEmotion(jsonControlObject.data);
            }

            if (jsonControlObject.mode == "setVideo")
            {
                switch (jsonControlObject.data)
                {
                    case "show":
                        this.faceActionController.showVideo();
                        break;
                    case "hide":
                        this.faceActionController.hideVideo();
                        break;
                    case "start":
                        this.faceActionController.startVideo();
                        break;
                    case "stop":
                        this.faceActionController.stopVideo();
                        break;
                    case "name":
                        this.faceActionController.nameVideo(jsonControlObject.extra);
                        break;
                    case "showAndPlay":
                        Debug.Log("show video");
                        this.faceActionController.showVideo();
                        Debug.Log("name video");
                        this.faceActionController.nameVideo(jsonControlObject.extra);
                        Debug.Log("start video");
                        this.faceActionController.startVideo();
                        break;
                    case "stopAndHide":
                        this.faceActionController.stopVideo();
                        this.faceActionController.hideVideo();
                        break;
                }
            }

            if (jsonControlObject.mode == "setSound")
            {
                switch (jsonControlObject.data)
                {
                    case "play":
                        this.faceActionController.playSound();
                        break;
                    case "stop":
                        this.faceActionController.stopSound();
                        break;
                    case "name":
                        this.faceActionController.nameSound(jsonControlObject.extra);
                        break;
                    case "nameAndPlay":
                        Debug.Log("nameAndPlay");
                        Debug.Log(jsonControlObject.extra);
                        this.faceActionController.nameSound(jsonControlObject.extra);
                        this.faceActionController.playSound();
                        break;
                    case "speak":
                        Debug.Log("speak");
                        StartCoroutine(RequestAudio(jsonControlObject.extra, jsonControlObject.partial));
                        break;
                }
            }

            if (jsonControlObject.mode == "setInfoText")
            {
                switch (jsonControlObject.data)
                {
                    case "text":
                        this.faceActionController.setInfoText(jsonControlObject.extra);
                        break;
                    case "show":
                        this.faceActionController.showInfoText(true);
                        break;
                    case "hide":
                        this.faceActionController.showInfoText(false);
                        break;
                }
            }

            if (jsonControlObject.mode == "setState")
            {
                switch (jsonControlObject.data)
                {
                    case "calculate":
                        Debug.Log("Blink");
                        this.faceActionController.blink();
                        this.faceActionController.showRotatingGears();
                        break;
                    case "stopCalculate":
                        this.faceActionController.hideRotatingGears();
                        break;
                    case "speechVisual":
                        this.faceActionController.addSpeechVisual(int.Parse(jsonControlObject.extra));
                        break;
                };
            }
        };

        this.webSocket.OnOpen += () =>
        {
            Debug.Log("ws connect");
        };

        this.webSocket.OnError += (error) =>
        {
            Debug.Log("ws error " + error);
        };

        this.webSocket.OnClose += (e) =>
        {
            Debug.Log("Connection closed! Try reconnection...");
            StartCoroutine(this.reconnect(4f));
        };
        this.webSocket.Connect();
    }
    IEnumerator reconnect(float waitTime)
    {
        yield return new WaitForSeconds(waitTime);
        this.webSocket.Connect();
    }

    private IEnumerator RequestAudio(string filename, string partial)
    {
        if(partial == "partial_2" && this.lastRequestPartial != "partial_1")
        {
            Debug.Log("Prevent Request...");
        }
        else
        {
            this.lastRequestPartial = partial;
            string audioUrl = $"{httpUrl}?filename={filename}";
            using (UnityWebRequest www = UnityWebRequestMultimedia.GetAudioClip(audioUrl, AudioType.WAV))
            {
                yield return www.SendWebRequest();

                if (www.result == UnityWebRequest.Result.Success)
                {
                    AudioClip newAudioClip = DownloadHandlerAudioClip.GetContent(www);
                    if (this.lastRequestPartial == "none")
                    {
                        this.primaryAudioClip = newAudioClip;
                    }
                    else if (this.lastRequestPartial == "partial_1")
                    {
                        this.primaryAudioClip = newAudioClip;
                    }
                    else if (this.lastRequestPartial == "partial_2")
                    {
                        this.secondaryAudioClip = newAudioClip;
                    }
                }
                else
                {
                    Debug.LogError($"Failed to load audio: {www.error}");
                }
            }
        }
    }
}  