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

public class FaceActionController : MonoBehaviour
{
    public FaceEmotion faceEmotion;

    public GameObject particleSystem;
    public GameObject videoPlayer;
    public GameObject soundPlayer;

    public string displayEmotion = "";
    private string lastEmotion = "init";

    private string TEXT_FOLDER = "Sounds/";
    private string VIDEO_FOLDER = "Videos/";

    public SkinnedMeshRenderer eyeLeft;
    public SkinnedMeshRenderer eyeRight;

    public Face targetFace;
    public Face startFace;
    private static float t = 0.0f;
    private static float tMulti = 1.5f;

    public Material eyeMaterial;
    public Material bgMaterial;
    Color startEyeColor;
    Color targetEyeColor;
    Color startBgColor;
    Color targetBgColor;

    public float blendDuration = 1f;

    private float breathPulse = 0;
    private bool breathUp = true;

    private Coroutine blinkCoroutine;


    void Start()
    {
        faceEmotion = new FaceEmotion();
        InvokeRepeating("EyeBreath", 0f, 0.035f);

    }

    // Update is called once per frame
    void Update()
    {
        if (lastEmotion != displayEmotion)
        {
            Debug.Log("change face: " + displayEmotion);
            if (this.blinkCoroutine != null) StopCoroutine(this.blinkCoroutine);
            this.startFace = this.getStartFace(eyeLeft, eyeRight);
            //Debug.Log("startFace: " + startFace);
            this.targetFace = faceEmotion.getEyeShapeValuesByEmotion(displayEmotion);
            this.startEyeColor = this.eyeMaterial.color;
            this.targetEyeColor = faceEmotion.getEyeColorByEmotion(displayEmotion);
            this.startBgColor = this.bgMaterial.color;
            this.targetBgColor = faceEmotion.getBgColorByEmotion(displayEmotion);
            t = 0.0f;
            tMulti = 1.0f;
        }

        if (displayEmotion == "Hot")
        {
            this.targetBgColor = new Color(178/255,255,255);
            this.targetEyeColor = new Color(191/255, 207/255, 255/255);
            this.targetFace = faceEmotion.getEyeShapeValuesByEmotion("Disgust");
        }


        if (displayEmotion == "Joy" || displayEmotion == "Contempt")
        {
            Debug.Log("play");
            this.particleSystem.GetComponent<ParticleSystem>().GetComponent<ParticleSystem>().Play();
        }
        else
        {
            this.particleSystem.GetComponent<ParticleSystem>().GetComponent<ParticleSystem>().Stop();
        }

        this.setFace(eyeLeft, eyeRight, this.startFace, this.targetFace);
        this.UpdateEyeColor(this.eyeMaterial, this.startEyeColor, this.targetEyeColor);
        this.UpdateEyeColor(this.bgMaterial, this.startBgColor, this.targetBgColor);

        lastEmotion = displayEmotion;
    }

    internal void showVideo()
    {
        this.videoPlayer.GetComponent<VideoPlayer>().renderMode = VideoRenderMode.CameraNearPlane;
    }

    internal void hideVideo()
    {
        this.videoPlayer.GetComponent<VideoPlayer>().renderMode = VideoRenderMode.APIOnly;
    }

    internal void startVideo()
    {
        this.videoPlayer.GetComponent<VideoPlayer>().Play();
    }

    internal void stopVideo()
    {
        this.videoPlayer.GetComponent<VideoPlayer>().Stop();
    }

    internal void nameVideo(string name)
    {
        VideoClip newVideoClip = Resources.Load<VideoClip>(this.VIDEO_FOLDER + name);
        this.videoPlayer.GetComponent<VideoPlayer>().clip = newVideoClip;
    }

    internal void playSound()
    {
        this.soundPlayer.GetComponent<AudioSource>().Play();
    }

    internal void stopSound()
    {
        this.soundPlayer.GetComponent<AudioSource>().Stop();
        this.soundPlayer.GetComponent<AudioSource>().time = 0;
    }

    internal void nameSound(string name)
    {
        AudioClip newAudioClip = Resources.Load<AudioClip>(TEXT_FOLDER + name);
        this.soundPlayer.GetComponent<AudioSource>().clip = newAudioClip;
    }

    internal void setAudioClip(AudioClip newAudioClip)
    {
        this.soundPlayer.GetComponent<AudioSource>().clip = newAudioClip;
    }

    internal void setEmotion(string emotion)
    {
        this.displayEmotion = emotion;
    }


    private void EyeBreath()
    {
        if (this.breathPulse > 8f)
        {
            this.breathUp = false;
        }
        else if (this.breathPulse <= 0.1f)
        {
            this.breathUp = true;
        }

        if (this.breathUp == true)
        {
            this.breathPulse += 0.08f;
        }
        else
        {
            this.breathPulse -= 0.08f;
        }
    }

    private void UpdateEyeColor(Material material, Color startColor, Color endColor)
    {
        Color lerpedColor = Color.Lerp(startColor, endColor, t);
        material.color = lerpedColor;
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

        eye.SetBlendShapeWeight((int)EmotionShapes.blendshapeNumbers.Full, Mathf.Lerp(eyeBlendshapeDataStart.full, eyeBlendshapeDataEnd.full * 100 + this.breathPulse, t));
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

    public Color getBgColorByEmotion(string emotion)
    {
        if (emotion == "Apprehension" || emotion == "Fear" || emotion == "Terror")
        {
            return new Color(1f, 1f, 1f);
        }
        return new Color(0f, 0f, 0f);
    }

    public Color getEyeColorByEmotion(string emotion)
    {
        Color color = new Color(255f, 255f, 255f);

        switch (emotion)
        {

            case "Annoyance":
                color = new Color(255f, 255f, 0f);
                break;
            case "Anger":
                color = new Color(255f, 0f, 0f);
                break;
            case "Rage":
                color = new Color(255f, 0f, 0f);
                break;
            case "Vigilance":
                color = new Color(255f, 255f, 0f);
                break;
            case "Anticipation":
                color = new Color(255f, 255f, 0f);
                break;
            case "Interest":
                color = new Color(255f, 255f, 0f);
                break;
            case "Serenety":
                color = new Color(255f, 153f, 255f);
                break;
            case "Joy":
                color = new Color(255f, 153f, 255f);
                break;
            case "Ecstasy":
                color = new Color(255f, 153f, 255f);
                break;
            case "Accepptance":
                color = new Color(255f, 255f, 0f);
                break;
            case "Trust":
                color = new Color(255f, 255f, 0f);
                break;
            case "Admiration":
                color = new Color(255f, 255f, 0f);
                break;
            case "Apprehension":
                color = new Color(0f, 0f, 0f);
                break;
            case "Fear":
                color = new Color(0f, 0f, 0f);
                break;
            case "Terror":
                color = new Color(0f, 0f, 0f);
                break;
            case "Distraction":
                color = new Color(69f, 166f, 159f);
                break;
            case "Surprise":
                color = new Color(69f, 166f, 159f);
                break;
            case "Amazement":
                color = new Color(69f, 166f, 159f);
                break;
            case "Pensiveness":
                color = new Color(75f, 75f, 75f);
                break;
            case "Sadness":
                color = new Color(75f, 75f, 75f);
                break;
            case "Grief":
                color = new Color(75f, 75f, 75f);
                break;
            case "Boredom":
                color = new Color(120f, 140f, 40f);
                break;
            case "Disgust":
                color = new Color(120f, 140f, 40f);
                break;
            case "Loathing":
                color = new Color(120f, 140f, 40f);
                break;
            case "Contempt":
                color = new Color(140f, 140f, 140f);
                break;
            case "Neutral":
                color = new Color(62f, 140f, 59f);
                break;
            case "Idle1":
                color = new Color(255f, 255f, 0f);
                break;
            case "Idle2":
                color = new Color(255f, 255f, 0f);
                break;
            default:
                color = new Color(255f, 255f, 0f);
                break;
        }

        color = new Color(color.r / 255, color.g / 255, color.b / 255);

        return color;
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