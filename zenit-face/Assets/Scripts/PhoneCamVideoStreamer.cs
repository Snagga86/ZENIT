using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Net.Sockets;
using UnityEngine;

public class PhoneCamVideoStreamer : MonoBehaviour
{
    public string serverIP = "192.168.123.101"; // Replace with your server's IP
    public int serverPort = 6666;

    private WebCamTexture webcam;
    private TcpClient client;
    private NetworkStream stream;
    private Texture2D frame;

    private float frameInterval = 1f / 2f; // 5 FPS
    private float nextFrameTime = 0f;

    private bool isConnecting = false;

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
                    webcam = new WebCamTexture(devices[i].name); // Adjust resolution as needed
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

        // Reuse the same Texture2D
        frame = new Texture2D(webcam.width, webcam.height, TextureFormat.RGB24, false);

        // Start connection coroutine
        StartCoroutine(ConnectToServer());
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
        catch (System.Exception ex)
        {
            Debug.LogError($"Connection attempt failed: {ex.Message}");
            return false;
        }
    }

    void Update()
    {
        if (client == null || !client.Connected || stream == null || !stream.CanWrite) return;

        if (Time.time >= nextFrameTime && webcam.didUpdateThisFrame)
        {
            nextFrameTime = Time.time + frameInterval;

            try
            {
                // Update the existing Texture2D
                frame.SetPixels(webcam.GetPixels());
                frame.Apply();

                // Convert to JPEG
                byte[] imageData = frame.GetRawTextureData();
                byte[] sizeBytes = System.BitConverter.GetBytes(imageData.Length);

                int width = webcam.width;
                int height = webcam.height;
                byte[] widthBytes = System.BitConverter.GetBytes(width);
                byte[] heightBytes = System.BitConverter.GetBytes(height);

                stream.Write(widthBytes, 0, 4);
                stream.Write(heightBytes, 0, 4);
                stream.Write(sizeBytes, 0, 4);
                stream.Write(imageData, 0, imageData.Length);
                stream.Flush();

            }
            catch (System.Exception ex)
            {
                Debug.LogError($"Error during frame sending: {ex.Message}");
            }
        }
    }

    void OnApplicationQuit()
    {
        // Cleanup
        webcam.Stop();
        if (stream != null) stream.Close();
        if (client != null) client.Close();
        Debug.Log("Connection closed.");
    }
}
