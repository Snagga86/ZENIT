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
    private const int PORT = 3344;

    public FaceActionController faceActionController;

    public WebSocket webSocket;

    public string WS = "ws://192.168.123.101:3344";

    private string TEXT_FOLDER = "Sounds/";
    private string VIDEO_FOLDER = "Videos/";
    private const string serverUrl = "http://192.168.123.101:1340/getAudio";

    public UdpClient udpClient = new UdpClient();
    public IPEndPoint from = new IPEndPoint(0, 0);
    private object obj = null;
    byte[] receivedBytes;


    private string nv_action = "";
    private string v_action = "";

    public GameObject DebugTrace;
    void Start()
    {

    }

    public void connectToWebsocket(string websocketDescription)
    {

        this.WS = websocketDescription;
        webSocket = new WebSocket(this.WS.Substring(0, this.WS.Length - 1));

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
                        this.faceActionController.showVideo();
                        this.faceActionController.nameVideo(jsonControlObject.extra);
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
                        this.faceActionController.nameSound(name);
                        break;
                    case "nameAndPlay":
                        this.faceActionController.nameSound(jsonControlObject.extra);
                        this.faceActionController.playSound();
                        break;
                    case "speak":
                        Debug.Log("speak");
                        StartCoroutine(RequestAudio(jsonControlObject.extra));
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


    /*void ReceivedUDPPacket(IAsyncResult result)
    {
        //var recvBuffer = udpClient.EndReceive(result, ref from);

        //displayEmotion = Encoding.UTF8.GetString(recvBuffer);
        //Debug.Log(displayEmotion);
        //Debug.Log(GameObject.Find("Emotion").GetComponent<TextMeshPro>());
        GameObject.Find("Emotion").GetComponent<TextMeshPro>().text = displayEmotion;

        this.gameObject.transform.Rotate(new Vector3(1, 0, 0), 1.2f);
        this.gameObject.transform.Rotate(new Vector3(0, 1, 0), 1.8f);
    }*/

    void Update()
    {
        //udpClient.BeginReceive(new AsyncCallback(ReceivedUDPPacket), obj);

#if !UNITY_WEBGL || UNITY_EDITOR
        if (this.webSocket != null)
        {
            webSocket.DispatchMessageQueue();
        }

#endif
    }


    private IEnumerator RequestAudio(string filename)
    {
        string audioUrl = $"{serverUrl}?filename={filename}";
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