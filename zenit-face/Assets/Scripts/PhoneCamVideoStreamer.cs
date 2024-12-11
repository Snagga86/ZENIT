using System;
using System.Collections;
using System.IO;
using System.Net.Sockets;
using System.Threading;
using System.Threading.Tasks;
using TMPro;
using UnityEngine;

public class PhoneCamVideoStreamer : MonoBehaviour
{
    public string serverIP = "192.168.123.101"; // Replace with your server's IP
    public int serverPort = 6666;

    public GameObject confp;

    private WebCamTexture webcam;
    private TcpClient client;
    private NetworkStream stream;
    private Texture2D frame;

    private float frameInterval = 1f / 5f; // 5 FPS
    private float nextFrameTime = 0f;

    private byte[] latestFrameData; // Atomic reference to the latest frame data
    private int frameWidth;
    private int frameHeight;
    private bool isStreaming = true;

    private readonly object frameLock = new object(); // Ensure thread-safe access

    void Start()
    {
        // Select the front-facing camera
        WebCamDevice[] devices = WebCamTexture.devices;
        if (devices.Length > 0)
        {
            for (int i = 0; i < devices.Length; i++)
            {
                Debug.Log($"Device {i}: {devices[i].name} (Front: {devices[i].isFrontFacing})");
                if (devices[i].isFrontFacing)
                {
                    webcam = new WebCamTexture(devices[i].name, 640, 320); // Adjust resolution as needed
                    break;
                }
            }
        }

        if (webcam == null)
        {
            Debug.LogError("No front-facing camera found.");
            return;
        }

        webcam.Play();

        frame = new Texture2D(webcam.width, webcam.height, TextureFormat.RGB565, false);

        // Initialize frame dimensions
        frameWidth = webcam.width;
        frameHeight = webcam.height;

        // Start connection coroutine
        StartCoroutine(ConnectToServer());

        // Start the processing thread
        //Task.Run(() => ProcessAndSendFrames());
    }

    IEnumerator ConnectToServer()
    {
        while (true)
        {
            if (client == null || !client.Connected)
            {
                Debug.Log("Attempting to connect to server...");
                bool success = TryConnect();
                if (success)
                {
                    Debug.Log("Successfully connected to server.");
                }
                else
                {
                    Debug.Log("Retrying in 5 seconds...");
                    yield return new WaitForSeconds(5f); // Retry every 5 seconds
                }
            }
            else
            {
                yield return null; // If connected, pause the coroutine
            }
        }
    }

    bool TryConnect()
    {
        try
        {
            client = new TcpClient();
            client.Connect(serverIP, serverPort);
            stream = client.GetStream();
            return true;
        }
        catch (Exception ex)
        {
            Debug.LogError($"Connection attempt failed: {ex.Message}");
            return false;
        }
    }

    void Update()
    {
        if (Time.time >= nextFrameTime && webcam.didUpdateThisFrame)
        {
            nextFrameTime = Time.time + frameInterval;

            // Capture the frame and process it on the main thread
            frame.SetPixels(webcam.GetPixels());
            frame.Apply();

            // Get raw texture data
            byte[] rawData = frame.GetRawTextureData();

            try
            {
                byte[] sizeBytes = BitConverter.GetBytes(rawData.Length);
                byte[] widthBytes = BitConverter.GetBytes(frameWidth);
                byte[] heightBytes = BitConverter.GetBytes(frameHeight);

                // Send data to the server
                lock (stream) // Ensure thread-safe usage of the stream
                {
                    stream.Write(widthBytes, 0, 4);
                    stream.Write(heightBytes, 0, 4);
                    stream.Write(sizeBytes, 0, 4);
                    stream.Write(rawData, 0, rawData.Length);
                    stream.Flush();
                }
            }
            catch (Exception ex)
            {
                Debug.LogError($"Error during frame sending: {ex.Message}");
            }

        }
    }

    void ProcessAndSendFrames()
    {
        while (isStreaming)
        {
            if (client == null || !client.Connected || stream == null || !stream.CanWrite)
            {
                Thread.Sleep(100); // Avoid busy waiting
                continue;
            }

            byte[] rawDataToSend = null;
            int width, height;

            // Fetch the latest frame data atomically
            lock (frameLock)
            {
                if (latestFrameData != null)
                {
                    rawDataToSend = latestFrameData;
                    width = frameWidth;
                    height = frameHeight;
                }
                else
                {
                    Thread.Sleep(10); // If no frame is available, wait briefly
                    continue;
                }
            }

            try
            {
                byte[] sizeBytes = BitConverter.GetBytes(rawDataToSend.Length);
                byte[] widthBytes = BitConverter.GetBytes(width);
                byte[] heightBytes = BitConverter.GetBytes(height);

                // Send data to the server
                lock (stream) // Ensure thread-safe usage of the stream
                {
                    stream.Write(widthBytes, 0, 4);
                    stream.Write(heightBytes, 0, 4);
                    stream.Write(sizeBytes, 0, 4);
                    stream.Write(rawDataToSend, 0, rawDataToSend.Length);
                    stream.Flush();
                }
            }
            catch (Exception ex)
            {
                Debug.LogError($"Error during frame sending: {ex.Message}");
            }

            // Respect frame interval
            //Thread.Sleep((int)(frameInterval * 1000));
        }
    }

    void OnApplicationQuit()
    {
        // Cleanup
        isStreaming = false;
        webcam.Stop();
        if (stream != null) stream.Close();
        if (client != null) client.Close();
        Debug.Log("Connection closed.");
    }
}
