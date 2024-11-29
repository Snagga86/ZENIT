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

    private float frameInterval = 1f / 10f; // 5 FPS
    private float nextFrameTime = 0f;

    void Start()
    {
        try
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
                        webcam = new WebCamTexture(devices[i].name, 1920, 1080); // Adjust resolution as needed
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

            // Connect to the server
            client = new TcpClient(serverIP, serverPort);
            stream = client.GetStream();
            Debug.Log("Connected to server.");
        }
        catch (System.Exception ex)
        {
            Debug.LogError($"Error connecting to server: {ex.Message}");
        }
    }

    void Update()
    {
        if (stream == null || !stream.CanWrite) return;

        if (Time.time >= nextFrameTime && webcam.didUpdateThisFrame)
        {
            Debug.Log("frame send proc");
            nextFrameTime = Time.time + frameInterval;

            try
            {
                Debug.Log("try");
                // Update the existing Texture2D
                frame.SetPixels(webcam.GetPixels());
                frame.Apply();

                // Convert to JPEG
                byte[] imageData = frame.EncodeToJPG();
                byte[] sizeBytes = System.BitConverter.GetBytes(imageData.Length);
                Debug.Log(frame);
                Debug.Log(sizeBytes);
                // Send the data
                BinaryWriter writer = new BinaryWriter(stream);
                Debug.Log("before write");
                Debug.Log($"Sending frame size: {imageData.Length}");
                writer.Write(sizeBytes);
                writer.Write(imageData);
                writer.Flush();
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
    byte[] GetTestImageBytes()
    {
        // Create a simple 2x2 texture with solid colors for testing
        Texture2D testTexture = new Texture2D(2, 2, TextureFormat.RGB24, false);

        // Set colors
        testTexture.SetPixels(new Color[]
        {
        Color.red, Color.green,
        Color.blue, Color.white
        });
        testTexture.Apply();

        // Encode to JPEG
        byte[] imageData = testTexture.EncodeToJPG();

        Debug.Log("Generated test image byte array.");
        return imageData;
    }

}