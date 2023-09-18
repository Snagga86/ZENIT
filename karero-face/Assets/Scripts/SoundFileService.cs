using UnityEngine;
using System.Collections;
using UnityEngine.Networking;
using System;

public class SoundFileService : MonoBehaviour
{
    private const string serverUrl = "http://192.168.123.101:1339/getAudio"; // Replace with your server's IP and port
    private string filename = "SupermanistbesseralseinEis.wav"; // Set the default filename or change it in the Unity inspector

    void Start()
    {
        StartCoroutine(RequestAudio(filename));
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
                AudioClip audioClip = DownloadHandlerAudioClip.GetContent(www);

                // Do something with the audio clip, e.g., play it
                AudioSource audioSource = GetComponent<AudioSource>();
                audioSource.clip = audioClip;
                audioSource.Play();
            }
            else
            {
                Debug.LogError($"Failed to load audio: {www.error}");
            }
        }
    }
}
