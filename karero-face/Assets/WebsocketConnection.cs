using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

using NativeWebSocket;

public class WebsocketConnection : MonoBehaviour
{
    WebSocket websocket;
    OSC osc;

    // Start is called before the first frame update
    async void Start()
    {
        Debug.Log("start socket");
        websocket = new WebSocket("127.0.0.1:1338");

        websocket.OnOpen += () =>
        {
            Debug.Log("Connection open!");
        };

        websocket.OnError += (e) =>
        {
            Debug.Log("Error! " + e);
        };

        websocket.OnClose += (e) =>
        {
            Debug.Log("Connection closed!");
        };

        websocket.OnMessage += (bytes) =>
        {
            Debug.Log("OnMessage!");
            /*Debug.Log(bytes.Length);
            ArrayList newMessages = OSC.PacketToOscMessages(bytes, bytes.Length);
            Debug.Log("OnMessage! " + newMessages[0]);*/
        };
        // waiting for messages
        await websocket.Connect();
    }

    void Update()
    {
#if !UNITY_WEBGL || UNITY_EDITOR
        websocket.DispatchMessageQueue();
#endif
    }

    private async void OnApplicationQuit()
    {
        await websocket.Close();
    }

}