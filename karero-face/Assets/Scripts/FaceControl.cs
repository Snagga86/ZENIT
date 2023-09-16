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

public class FaceControl : MonoBehaviour
{
    public GameObject videoPlayer;
    public GameObject soundPlayer;
    public GameObject DebugTrace;

    public WebSocket webSocket;
    public string WS = "ws://192.168.0.101:3344";

    private string TEXT_FOLDER = "Text/";
    private string VIDEO_FOLDER = "Videos/";
    private const string serverUrl = "http://192.168.0.101:1340/getAudio";

    public UdpClient udpClient = new UdpClient();
    public IPEndPoint from = new IPEndPoint(0, 0);
    private object obj = null;
    byte[] receivedBytes;
    public string displayEmotion = "";
    private string lastEmotion = "init";

    public SkinnedMeshRenderer eyeLeft;
    public SkinnedMeshRenderer eyeRight;

    public FaceEmotion faceEmotion;
    public Face targetFace;
    public Face startFace;
    private static float t = 0.0f;
    private static float tMulti = 1.5f;

    private Coroutine blinkCoroutine;

    

    private string nv_action = "";
    private string v_action = "";

    void Start()
    {
        faceEmotion = new FaceEmotion();
        //AudioClip newAudioClip;
        //newAudioClip = Resources.Load<AudioClip>(TEXT_FOLDER + "greeting/1");


        //Debug.Log(newAudioClip);
        //Debug.Log(TEXT_FOLDER + jsonControlObject.extra + "/" + UnityEngine.Random.Range(1, 4) + ".mp3");
        //this.soundPlayer.GetComponent<AudioSource>().clip = newAudioClip;
        //this.soundPlayer.GetComponent<AudioSource>().Play();
    }

    public void connectToWebsocket(string websocketDescription) { 

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
                displayEmotion = jsonControlObject.data;
            }

            if (jsonControlObject.mode == "setVideo")
            {
                VideoClip newVideoClip;
                switch (jsonControlObject.data)
                {
                    case "show":
                        Debug.Log("show video");
                        this.videoPlayer.GetComponent<VideoPlayer>().renderMode = VideoRenderMode.CameraNearPlane;
                        break;
                    case "hide":
                        Debug.Log("hide video");
                        this.videoPlayer.GetComponent<VideoPlayer>().renderMode = VideoRenderMode.APIOnly;
                        break;
                    case "start":
                        Debug.Log("start video");
                        this.videoPlayer.GetComponent<VideoPlayer>().Play();
                        break;
                    case "stop":
                        Debug.Log("stop video");
                        this.videoPlayer.GetComponent<VideoPlayer>().Stop();
                        break;
                    case "name":
                        Debug.Log("name video");
                        //implement video src change
                        newVideoClip = Resources.Load<VideoClip>(VIDEO_FOLDER + jsonControlObject.extra);
                        break;
                    case "showAndPlay":
                        Debug.Log("show and play video");
                        this.videoPlayer.GetComponent<VideoPlayer>().renderMode = VideoRenderMode.CameraNearPlane;
                        newVideoClip = Resources.Load<VideoClip>(VIDEO_FOLDER + jsonControlObject.extra);
                        this.videoPlayer.GetComponent<VideoPlayer>().clip = newVideoClip;
                        this.videoPlayer.GetComponent<VideoPlayer>().Play();
                        break;
                    case "stopAndHide":
                        Debug.Log("stop and hide video");
                        this.videoPlayer.GetComponent<VideoPlayer>().Stop();
                        this.videoPlayer.GetComponent<VideoPlayer>().renderMode = VideoRenderMode.APIOnly;
                        break;
                }
            }

            if (jsonControlObject.mode == "setSound")
            {
                AudioClip newAudioClip;
                Debug.Log(jsonControlObject);
                switch (jsonControlObject.data)
                {
                    case "play":
                        Debug.Log("play sound");
                        this.soundPlayer.GetComponent<AudioSource>().Play();
                        break;
                    case "stop":
                        Debug.Log("stop sound");
                        this.soundPlayer.GetComponent<AudioSource>().Stop();
                        this.soundPlayer.GetComponent<AudioSource>().time = 0;
                        break;
                    case "name":
                        Debug.Log("name sound");
                        newAudioClip = Resources.Load<AudioClip>(TEXT_FOLDER + jsonControlObject.extra + "/" + UnityEngine.Random.Range(1, 4));
                        this.soundPlayer.GetComponent<AudioSource>().clip = newAudioClip;
                        break;
                    case "nameAndPlay":
                        Debug.Log("nameAndPlay");
                        if(jsonControlObject.extra.Contains("perform-performance*")){
                            newAudioClip = Resources.Load<AudioClip>(TEXT_FOLDER + jsonControlObject.extra.Split('*')[0] + "/" + jsonControlObject.extra.Split('*')[1]);
                        }
                        else
                        {
                            newAudioClip = Resources.Load<AudioClip>(TEXT_FOLDER + jsonControlObject.extra + "/" + UnityEngine.Random.Range(1, 4));
                        }
                        
                        Debug.Log(newAudioClip);
                        //Debug.Log(TEXT_FOLDER + jsonControlObject.extra + "/" + UnityEngine.Random.Range(1, 4) + ".mp3");
                        this.soundPlayer.GetComponent<AudioSource>().clip = newAudioClip;
                        this.soundPlayer.GetComponent<AudioSource>().Play();
                        break;
                    case "speak":
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
        webSocket.Connect();
    }


    void ReceivedUDPPacket(IAsyncResult result)
    {
        //var recvBuffer = udpClient.EndReceive(result, ref from);

        //displayEmotion = Encoding.UTF8.GetString(recvBuffer);
        //Debug.Log(displayEmotion);
        //Debug.Log(GameObject.Find("Emotion").GetComponent<TextMeshPro>());
        GameObject.Find("Emotion").GetComponent<TextMeshPro>().text = displayEmotion;

        this.gameObject.transform.Rotate(new Vector3(1, 0, 0), 1.2f);
        this.gameObject.transform.Rotate(new Vector3(0, 1, 0), 1.8f);
    }

    private void FixedUpdate()
    {

    }
    void Update()
    {
        //udpClient.BeginReceive(new AsyncCallback(ReceivedUDPPacket), obj);

#if !UNITY_WEBGL || UNITY_EDITOR
        if (this.webSocket != null)
        {
            webSocket.DispatchMessageQueue();
        }
        
#endif

        //Debug.Log(GameObject.Find("Emotion").GetComponent<TextMeshProUGUI>());
        //GameObject.Find("Emotion").GetComponent<TextMeshProUGUI>().text = displayEmotion;


        if (lastEmotion != displayEmotion && displayEmotion != "Idle1" && displayEmotion != "Idle1")
        {
            if(this.blinkCoroutine != null)StopCoroutine(this.blinkCoroutine);
            this.startFace = this.getStartFace(eyeLeft, eyeRight);
            //Debug.Log("startFace: " + startFace);
            this.targetFace = faceEmotion.getEyeShapeValuesByEmotion(displayEmotion);
            t = 0.0f;
            tMulti = 1.0f;
        }
        this.setFace(eyeLeft, eyeRight, this.startFace, this.targetFace);
        

        if (lastEmotion != displayEmotion && displayEmotion == "Idle1" || displayEmotion == "Idle2")
        {
            Debug.Log("start Coroutine");
            this.blinkCoroutine = StartCoroutine(this.BlinkCoroutine());
        }
        lastEmotion = displayEmotion;
    }

    private IEnumerator BlinkCoroutine()
    {
        Debug.Log("Coroutine go");
        tMulti = 0.17f;
        while (1 < 2)
        {
            Debug.Log("go while");
            this.startFace = this.getStartFace(eyeLeft, eyeRight);
            //Debug.Log("startFace: " + startFace);
            this.targetFace = faceEmotion.getEyeShapeValuesByEmotion("Idle1");
            t = 0.0f;
            
            this.setFace(eyeLeft, eyeRight, this.startFace, this.targetFace);
            // Wait for 2 seconds
            yield return new WaitForSeconds(3.2f);
            Debug.Log("Coroutine resumed after 0.5 seconds");
            this.startFace = this.getStartFace(eyeLeft, eyeRight);
            //Debug.Log("startFace: " + startFace);
            this.targetFace = faceEmotion.getEyeShapeValuesByEmotion("Neutral");
            t = 0.0f;
            int randomValue = UnityEngine.Random.Range(6, 12);

            this.setFace(eyeLeft, eyeRight, this.startFace, this.targetFace);
            yield return new WaitForSeconds(2.7f);
        }
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

                this.soundPlayer.GetComponent<AudioSource>().clip = newAudioClip;
                this.soundPlayer.GetComponent<AudioSource>().Play();
            }
            else
            {
                Debug.LogError($"Failed to load audio: {www.error}");
            }
        }
    }

    Face getStartFace(SkinnedMeshRenderer leftEye, SkinnedMeshRenderer rightEye)
    {
        EmotionShapes tmpLeftEye = new EmotionShapes();
        EmotionShapes tmpRightEye = new EmotionShapes();

        tmpLeftEye.angry = leftEye.GetBlendShapeWeight((int)EmotionShapes.blendshapeNumbers.Angry);
        tmpLeftEye.disgusted = leftEye.GetBlendShapeWeight((int)EmotionShapes.blendshapeNumbers.Disgusted);
        tmpLeftEye.full = leftEye.GetBlendShapeWeight((int)EmotionShapes.blendshapeNumbers.Full);
        tmpLeftEye.kreis = leftEye.GetBlendShapeWeight((int)EmotionShapes.blendshapeNumbers.Kreis);
        tmpLeftEye.sad = leftEye.GetBlendShapeWeight((int)EmotionShapes.blendshapeNumbers.Sad);
        tmpLeftEye.happy = leftEye.GetBlendShapeWeight((int)EmotionShapes.blendshapeNumbers.Happy);

        tmpRightEye.angry = rightEye.GetBlendShapeWeight((int)EmotionShapes.blendshapeNumbers.Angry);
        tmpRightEye.disgusted = rightEye.GetBlendShapeWeight((int)EmotionShapes.blendshapeNumbers.Disgusted);
        tmpRightEye.full = rightEye.GetBlendShapeWeight((int)EmotionShapes.blendshapeNumbers.Full);
        tmpRightEye.kreis = rightEye.GetBlendShapeWeight((int)EmotionShapes.blendshapeNumbers.Kreis);
        tmpRightEye.sad = rightEye.GetBlendShapeWeight((int)EmotionShapes.blendshapeNumbers.Sad);
        tmpRightEye.happy = rightEye.GetBlendShapeWeight((int)EmotionShapes.blendshapeNumbers.Happy);

        return new Face(tmpLeftEye, tmpRightEye);
    }

    void setFace(SkinnedMeshRenderer leftEye, SkinnedMeshRenderer rightEye, Face startFace, Face targetFace)
    {
        this.SetEye(leftEye, "left", startFace, targetFace);
        this.SetEye(rightEye, "right", startFace, targetFace);
    }
    void SetEye(SkinnedMeshRenderer eye, string eyePosition, Face startFace, Face targetFace)
    {
        EmotionShapes eyeBlendshapeDataStart = new EmotionShapes();
        EmotionShapes eyeBlendshapeDataEnd = new EmotionShapes();

        //Debug.Log(startFace);
        //Debug.Log(targetFace);
        if (eyePosition == "left")
        {
            eyeBlendshapeDataStart = startFace.leftEye;
            eyeBlendshapeDataEnd = targetFace.leftEye;
        }
        else if (eyePosition == "right")
        {
            eyeBlendshapeDataStart = startFace.rightEye;
            eyeBlendshapeDataEnd = targetFace.rightEye;
        }

        eye.SetBlendShapeWeight((int)EmotionShapes.blendshapeNumbers.Full, Mathf.Lerp(eyeBlendshapeDataStart.full, eyeBlendshapeDataEnd.full * 100, t));
        eye.SetBlendShapeWeight((int)EmotionShapes.blendshapeNumbers.Sad, Mathf.Lerp(eyeBlendshapeDataStart.sad, eyeBlendshapeDataEnd.sad * 100, t));
        eye.SetBlendShapeWeight((int)EmotionShapes.blendshapeNumbers.Kreis, Mathf.Lerp(eyeBlendshapeDataStart.kreis, eyeBlendshapeDataEnd.kreis * 100, t));
        eye.SetBlendShapeWeight((int)EmotionShapes.blendshapeNumbers.Disgusted, Mathf.Lerp(eyeBlendshapeDataStart.disgusted, eyeBlendshapeDataEnd.disgusted * 100, t));
        eye.SetBlendShapeWeight((int)EmotionShapes.blendshapeNumbers.Happy, Mathf.Lerp(eyeBlendshapeDataStart.happy, eyeBlendshapeDataEnd.happy * 100, t));
        eye.SetBlendShapeWeight((int)EmotionShapes.blendshapeNumbers.Angry, Mathf.Lerp(eyeBlendshapeDataStart.angry, eyeBlendshapeDataEnd.angry * 100, t));

        t += tMulti * Time.deltaTime;
    }

}

public class FaceEmotion
{
    public Anger anger;
    public Anticipation anticipation;
    public Joy joy;
    public Trust trust;
    public Fear fear;
    public Surprise surprise;
    public Sadness sadness;
    public Disgust disgust;
    public Contempt contempt;
    public Neutral neutral;


    public FaceEmotion()
    {
        this.anger = new Anger();
        this.anticipation = new Anticipation();
        this.joy = new Joy();
        this.trust = new Trust();
        this.fear = new Fear();
        this.surprise = new Surprise();
        this.sadness = new Sadness();
        this.disgust = new Disgust();
        this.contempt = new Contempt();
        this.neutral = new Neutral();
    }

    public Face getEyeShapeValuesByEmotion(string emotion)
    {
        switch (emotion)
        {
            case "Annoyance":
                return this.anger.annoyance;
                break;
            case "Anger":
                return this.anger.anger;
                break;
            case "Rage":
                return this.anger.rage;
                break;
            case "Vigilance":
                return this.anticipation.vigilance;
                break;
            case "Anticipation":
                return this.anticipation.anticipation;
                break;
            case "Interest":
                return this.anticipation.interest;
                break;
            case "Serenety":
                return this.joy.serenety;
                break;
            case "Joy":
                return this.joy.joy;
                break;
            case "Ecstasy":
                return this.joy.ecstasy;
                break;
            case "Accepptance":
                return this.trust.acceptance;
                break;
            case "Trust":
                return this.trust.trust;
                break;
            case "Admiration":
                return this.trust.admiration;
                break;
            case "Apprehension":
                return this.fear.apprehension;
                break;
            case "Fear":
                return this.fear.fear;
                break;
            case "Terror":
                return this.fear.terror;
                break;
            case "Distraction":
                return this.surprise.distraction;
                break;
            case "Surprise":
                return this.surprise.surprise;
                break;
            case "Amazement":
                return this.surprise.amazement;
                break;
            case "Pensiveness":
                return this.sadness.pensiveness;
                break;
            case "Sadness":
                return this.sadness.sadness;
                break;
            case "Grief":
                return this.sadness.grief;
                break;
            case "Boredom":
                return this.disgust.boredom;
                break;
            case "Disgust":
                return this.disgust.disgust;
                break;
            case "Loathing":
                return this.disgust.loathing;
                break;
            case "Contempt":
                return this.contempt.contempt;
                break;
            case "Neutral":
                return this.neutral.neutral;
                break;
            case "Idle1":
                return this.neutral.idle1;
                break;
            case "Idle2":
                return this.neutral.idle2;
                break;
            default:
                return this.neutral.neutral;
                break;
        }

        return this.neutral.neutral;
    }
}

public class Anger
{
    public Face annoyance;
    public Face anger;
    public Face rage;

    public Anger()
    {
        EmotionShapes lShape = new EmotionShapes();
        EmotionShapes rShape = new EmotionShapes();
        lShape.angry = 0.4f;
        rShape.angry = 0.4f;
        annoyance = new Face(lShape, rShape);

        lShape = new EmotionShapes();
        rShape = new EmotionShapes();
        lShape.angry = 1.0f;
        rShape.angry = 1.0f;
        anger = new Face(lShape, rShape);

        lShape = new EmotionShapes();
        rShape = new EmotionShapes();
        lShape.angry = 1.0f;
        rShape.angry = 1.0f;
        lShape.full = 0.3f;
        rShape.full = 0.3f;
        rage = new Face(lShape, rShape);
    }
}
public class Anticipation
{
    public Face interest;
    public Face anticipation;
    public Face vigilance;
    public Anticipation()
    {
        EmotionShapes lShape = new EmotionShapes();
        EmotionShapes rShape = new EmotionShapes();
        lShape.full = 0.3f;
        rShape.full = 0.3f;
        interest = new Face(lShape, rShape);

        lShape = new EmotionShapes();
        rShape = new EmotionShapes();
        lShape.full = 0.3f;
        rShape.full = 0.3f;
        anticipation = new Face(lShape, rShape);

        lShape = new EmotionShapes();
        rShape = new EmotionShapes();
        lShape.full = 0.3f;
        rShape.full = 0.3f;
        vigilance = new Face(lShape, rShape);
    }
}

public class Joy
{
    public Face serenety;
    public Face joy;
    public Face ecstasy;
    public Joy()
    {
        EmotionShapes lShape = new EmotionShapes();
        EmotionShapes rShape = new EmotionShapes();
        lShape.happy = 0.5f;
        rShape.happy = 0.5f;
        serenety = new Face(lShape, rShape);

        lShape = new EmotionShapes();
        rShape = new EmotionShapes();
        lShape.happy = 1.0f;
        rShape.happy = 1.0f;
        joy = new Face(lShape, rShape);

        lShape = new EmotionShapes();
        rShape = new EmotionShapes();
        lShape.happy = 1.0f;
        rShape.happy = 1.0f;
        lShape.full = 0.3f;
        rShape.full = 0.3f;
        ecstasy = new Face(lShape, rShape);
    }
}

public class Trust
{
    public Face acceptance;
    public Face trust;
    public Face admiration;

    public Trust()
    {
        EmotionShapes lShape = new EmotionShapes();
        EmotionShapes rShape = new EmotionShapes();
        lShape.happy = 0.3f;
        rShape.happy = 0.3f;
        acceptance = new Face(lShape, rShape);

        lShape = new EmotionShapes();
        rShape = new EmotionShapes();
        lShape.happy = 1.0f;
        rShape.happy = 1.0f;
        trust = new Face(lShape, rShape);

        lShape = new EmotionShapes();
        rShape = new EmotionShapes();
        lShape.full = 0.3f;
        rShape.full = 0.3f;
        admiration = new Face(lShape, rShape);
    }
}

public class Fear
{
    public Face apprehension;
    public Face fear;
    public Face terror;

    public Fear()
    {
        EmotionShapes lShape = new EmotionShapes();
        EmotionShapes rShape = new EmotionShapes();
        lShape.kreis = 0.3f;
        rShape.kreis = 0.3f;
        apprehension = new Face(lShape, rShape);

        lShape = new EmotionShapes();
        rShape = new EmotionShapes();
        lShape.kreis = 0.5f;
        rShape.kreis = 0.5f;
        fear = new Face(lShape, rShape);

        lShape = new EmotionShapes();
        rShape = new EmotionShapes();
        lShape.kreis = 0.5f;
        rShape.kreis = 0.5f;
        lShape.full = 0.4f;
        rShape.full = 0.4f;
        terror = new Face(lShape, rShape);
    }
}

public class Surprise
{
    public Face distraction;
    public Face surprise;
    public Face amazement;

    public Surprise()
    {
        EmotionShapes lShape = new EmotionShapes();
        EmotionShapes rShape = new EmotionShapes();
        lShape.kreis = 1.0f;
        rShape.kreis = 1.0f;
        distraction = new Face(lShape, rShape);

        lShape = new EmotionShapes();
        rShape = new EmotionShapes();
        lShape.kreis = 1.0f;
        rShape.kreis = 1.0f;
        lShape.full = 0.04f;
        rShape.full = 0.04f;
        surprise = new Face(lShape, rShape);

        lShape = new EmotionShapes();
        rShape = new EmotionShapes();
        lShape.kreis = 0.5f;
        rShape.kreis = 0.5f;
        lShape.full = 0.08f;
        rShape.full = 0.08f;
        amazement = new Face(lShape, rShape);
    }
}

public class Sadness
{
    public Face pensiveness;
    public Face sadness;
    public Face grief;

    public Sadness()
    {
        EmotionShapes lShape = new EmotionShapes();
        EmotionShapes rShape = new EmotionShapes();
        lShape.sad = 0.5f;
        rShape.sad = 0.5f;
        pensiveness = new Face(lShape, rShape);

        lShape = new EmotionShapes();
        rShape = new EmotionShapes();
        lShape.sad = 1.0f;
        rShape.sad = 1.0f;
        sadness = new Face(lShape, rShape);

        lShape = new EmotionShapes();
        rShape = new EmotionShapes();
        lShape.sad = 1.0f;
        rShape.sad = 1.0f;
        lShape.full = 0.4f;
        rShape.full = 0.4f;
        grief = new Face(lShape, rShape);
    }
}

public class Disgust
{
    public Face boredom;
    public Face disgust;
    public Face loathing;

    public Disgust()
    {
        EmotionShapes lShape = new EmotionShapes();
        EmotionShapes rShape = new EmotionShapes();
        lShape.disgusted = 0.5f;
        rShape.disgusted = 0.5f;
        boredom = new Face(lShape, rShape);

        lShape = new EmotionShapes();
        rShape = new EmotionShapes();
        lShape.disgusted = 1.0f;
        rShape.disgusted = 1.0f;
        disgust = new Face(lShape, rShape);

        lShape = new EmotionShapes();
        rShape = new EmotionShapes();
        lShape.disgusted = 1.0f;
        rShape.disgusted = 1.0f;
        lShape.full = 0.1f;
        rShape.full = 0.1f;
        loathing = new Face(lShape, rShape);
    }
}

public class Contempt
{
    public Face contempt;

    public Contempt()
    {
        EmotionShapes lShape = new EmotionShapes();
        EmotionShapes rShape = new EmotionShapes();
        lShape.disgusted = 0.2f;
        rShape.disgusted = 0.5f;
        contempt = new Face(lShape, rShape);
    }
}

public class Neutral
{
    public Face neutral;
    public Face idle1;
    public Face idle2;

    public Neutral()
    {
        EmotionShapes lShape = new EmotionShapes();
        EmotionShapes rShape = new EmotionShapes();

        neutral = new Face(lShape, rShape);

        lShape = new EmotionShapes();
        rShape = new EmotionShapes();
        lShape.full = 0.23f;
        rShape.full = 0.23f;
        idle1 = new Face(lShape, rShape);

        lShape = new EmotionShapes();
        rShape = new EmotionShapes();
        lShape.happy = 0.42f;
        rShape.happy = 0.42f;
        idle2 = new Face(lShape, rShape);
    }
}

public class Face
{
    public EmotionShapes leftEye;
    public EmotionShapes rightEye;

    public Face(EmotionShapes leftEye, EmotionShapes rightEye)
    {
        this.leftEye = leftEye;
        this.rightEye = rightEye;
    }
}

public class EmotionShapes
{
    public enum blendshapeNumbers { Kreis, Sad, Full, Happy, Angry, Disgusted }

    public float kreis = 0;
    public float sad = 0;
    public float full = 0;
    public float happy = 0;
    public float angry = 0;
    public float disgusted = 0;
}