using System.Collections;
using System.Collections.Generic;
using System.Net.Sockets;
using System.Net;
using UnityEngine;
using System.Threading.Tasks;
using System.Text;
using TMPro;
using System;

public class UDP_Receive : MonoBehaviour
{

    public int PORT = 1338;
    public UdpClient udpClient = new UdpClient();
    public IPEndPoint from = new IPEndPoint(0, 0);
    private object obj = null;
    byte[] receivedBytes;
    public string displayEmotion = ""; 


    void Start()
    {
        udpClient.Client.Bind(new IPEndPoint(IPAddress.Any, PORT));
        udpClient.BeginReceive(new AsyncCallback(ReceivedUDPPacket), obj);
    }

    void ReceivedUDPPacket(IAsyncResult result)
    {
        var recvBuffer = udpClient.EndReceive(result, ref from);
    
        displayEmotion = Encoding.UTF8.GetString(recvBuffer);
        Debug.Log(displayEmotion);
        Debug.Log(GameObject.Find("Emotion").GetComponent<TextMeshPro>());
        GameObject.Find("Emotion").GetComponent<TextMeshPro>().text = displayEmotion;

        this.gameObject.transform.Rotate(new Vector3(1, 0, 0), 1.2f);
        this.gameObject.transform.Rotate(new Vector3(0, 1, 0), 1.8f);
    }

    void Update()
    {
        udpClient.BeginReceive(new AsyncCallback(ReceivedUDPPacket), obj);

        Debug.Log(GameObject.Find("Emotion").GetComponent<TextMeshProUGUI>());
        GameObject.Find("Emotion").GetComponent<TextMeshProUGUI>().text = displayEmotion;
    }


}

public class EyeExpressions
{
    struct EAnger
    {
        struct Annoyance
        {
            EmotionShapes leftEye;
            EmotionShapes rightEye;
        }
        struct Anger
        {
            EmotionShapes leftEye;
            EmotionShapes rightEye;
        }
        struct Rage
        {
            EmotionShapes leftEye;
            EmotionShapes rightEye;
        }

    }
 
    
    /*
    " : ['Annoyance','Anger', 'Rage']
    ,
    "Anticipation" : ['Interest','Anticipation','Vigilance']
    ,
    "Happiness" :  ['Serenity','Joy','Ecstasy']
    ,
    "Trust" : ['Acceptance', 'Trust', 'Admiration']
    ,
    "Fear" : ['Apprehension', 'Fear', 'Terror']
    ,
    "Surprise" : ['Distraction','Surprise','Amazement']
    ,
    "Sadness" : ['Pensiveness', 'Sadness', 'Grief']
    ,
    "Disgust" : ['Boredom', 'Disgust','Loathing']*/


}

class EmotionShapes
{
    const int kreis = 0;
    const int sad = 0;
    const int full = 0;
    const int happy = 0;
    const int angry = 0;
    const int disgusted = 0;
}