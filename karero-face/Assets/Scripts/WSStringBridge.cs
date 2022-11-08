using System;
using System.Collections;
using System.Collections.Generic;
using TMPro;
using UnityEngine;

public class WSStringBridge : MonoBehaviour
{
    public string DEFAULT_WS_CONNECTION = "ws://192.168.123.101:3344";

    // Start is called before the first frame update
    void Start()
    {
        
    }

    // Update is called once per frame
    void Update()
    {
        //GameObject.Find("Canvas/ShowDebug/DetailPanel/IPPanel/TextArea/Text").GetComponent<TextMeshProUGUI>().SetText(DEFAULT_WS_CONNECTION);
    }
    public void connectToWebsocket()
    {
        string wsDescription = GameObject.Find("Canvas/ShowDebug/DetailPanel/IPPanel/TextArea/Text").GetComponent<TMP_Text>().text;
        GameObject.Find("Face").GetComponent<FaceControl>().connectToWebsocket(wsDescription);
    }
}
