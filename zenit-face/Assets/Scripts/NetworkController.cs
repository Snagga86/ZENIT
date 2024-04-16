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

    private string nv_action = "";
    private string v_action = "";


    void Start()
    {

    }

    public void connectToWebsocket(string websocketDescription)
    {

        this.websocketUrl = websocketDescription;
        webSocket = new WebSocket(this.websocketUrl.Substring(0, this.websocketUrl.Length - 1));

        webSocket.OnMessage += (data) =>
        {
            Debug.Log("onMessage");
            var message = System.Text.Encoding.UTF8.GetString(data);
            FaceControlDescription jsonControlObject = JsonConvert.DeserializeObject<FaceControlDescription>(message);

            if (jsonControlObject.mode == "setEmotion")
            {
                this.nv_action = "\nMode: " + jsonControlObject.mode + "\nData: " + jsonControlObject.data + "\nExtra: " + jsonControlObject.extra;
            }
            if (jsonControlObject.mode == "setSound")
            {
                Debug.Log("VERBAL ACTION TRACE");
                this.v_action = "Mode: " + jsonControlObject.mode + "\nData: " + jsonControlObject.data + "\nExtra: " + jsonControlObject.extra;
            }
            this.DebugTrace.GetComponent<TextMeshProUGUI>().text = this.v_action + this.nv_action;
            
            if (jsonControlObject.mode == "setEmotion")
            {
                Debug.Log(jsonControlObject.data);
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
                        StartCoroutine(RequestAudio(jsonControlObject.extra));
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
        };

        webSocket.OnOpen += () =>
        {
            Debug.Log("ws connect");
        };

        webSocket.OnError += (error) =>
        {
            Debug.Log("ws error " + error);
        };

        webSocket.OnClose += (e) =>
        {
            Debug.Log("Connection closed! Try reconnection...");
            StartCoroutine(this.reconnect(4f));
        };
        webSocket.Connect();
    }
    IEnumerator reconnect(float waitTime)
    {
        yield return new WaitForSeconds(waitTime);
        webSocket.Connect();
    }

    void Update()
    {

#if !UNITY_WEBGL || UNITY_EDITOR
        if (this.webSocket != null)
        {
            webSocket.DispatchMessageQueue();
        }

#endif
    }

    private IEnumerator RequestAudio(string filename)
    {
        string audioUrl = $"{httpUrl}?filename={filename}";
        Debug.Log(audioUrl);
        using (UnityWebRequest www = UnityWebRequestMultimedia.GetAudioClip(audioUrl, AudioType.WAV))
        {
            yield return www.SendWebRequest();

            if (www.result == UnityWebRequest.Result.Success)
            {
                AudioClip newAudioClip = DownloadHandlerAudioClip.GetContent(www);
                this.faceActionController.setAudioClip(newAudioClip);
                this.faceActionController.playSound();
            }
            else
            {
                Debug.LogError($"Failed to load audio: {www.error}");
            }
        }
    }
}  