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
    private System.AsyncCallback AC;
    byte[] receivedBytes;
    public string displayEmotion = ""; 
    //udpClient.Client.Bind(new IPEndPoint(IPAddress.Any, PORT));
    // Start is called before the first frame update
    void Start()
    {

        //int PORT = 1338;
        //UdpClient udpClient = new UdpClient();
        udpClient.Client.Bind(new IPEndPoint(IPAddress.Any, PORT));
        /*AC = new System.AsyncCallback(ReceivedUDPPacket);*/
        udpClient.BeginReceive(new AsyncCallback(ReceivedUDPPacket), obj);

    /*    var task = Task.Run(() =>
        {
            while (true)
            {

                Debug.Log("true");
                var recvBuffer = udpClient.Receive(ref from);
                if (recvBuffer.Length > 0)
                {
                    Debug.Log(Encoding.UTF8.GetString(recvBuffer));
                    displayEmotion = Encoding.UTF8.GetString(recvBuffer);
                    //this.gameObject;
                    Debug.Log(GameObject.Find("Emotion").GetComponent<TextMeshProUGUI>());
                    GameObject.Find("Emotion").GetComponent<TextMeshProUGUI>().text = displayEmotion;
            
                    this.gameObject.transform.Rotate(new Vector3(1, 0, 0), 1.2f);
                    this.gameObject.transform.Rotate(new Vector3(0, 1, 0), 1.8f);
  
                }
            }
        });*/
    }

    void ReceivedUDPPacket(IAsyncResult result)
    {
        //stopwatch.Start();
        var recvBuffer = udpClient.EndReceive(result, ref from);

        
        
        displayEmotion = Encoding.UTF8.GetString(recvBuffer);
        Debug.Log(displayEmotion);
        Debug.Log(GameObject.Find("Emotion").GetComponent<TextMeshPro>());
        GameObject.Find("Emotion").GetComponent<TextMeshPro>().text = displayEmotion;

        this.gameObject.transform.Rotate(new Vector3(1, 0, 0), 1.2f);
        this.gameObject.transform.Rotate(new Vector3(0, 1, 0), 1.8f);

        //udpClient.BeginReceive(new AsyncCallback(ReceivedUDPPacket), obj);
        //stopwatch.Stop();
        //Debug.Log(stopwatch.ElapsedTicks);
        //stopwatch.Reset();
    }

    // Update is called once per frame
    void Update()
    {
        udpClient.BeginReceive(new AsyncCallback(ReceivedUDPPacket), obj);

        Debug.Log(GameObject.Find("Emotion").GetComponent<TextMeshProUGUI>());
        GameObject.Find("Emotion").GetComponent<TextMeshProUGUI>().text = displayEmotion;
        /*var recvBuffer = udpClient.Receive(ref from);
        if (recvBuffer.Length > 0)
        {
            Debug.Log(Encoding.UTF8.GetString(recvBuffer));
            displayEmotion = Encoding.UTF8.GetString(recvBuffer);
            //this.gameObject;
            Debug.Log(GameObject.Find("Emotion").GetComponent<TextMeshProUGUI>());
            GameObject.Find("Emotion").GetComponent<TextMeshProUGUI>().text = displayEmotion;
            
            this.gameObject.transform.Rotate(new Vector3(1, 0, 0), 1.2f);
            this.gameObject.transform.Rotate(new Vector3(0, 1, 0), 1.8f);
  
        }*/

    }


}
