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
using UnityEngine.UIElements;
using Unity.VisualScripting;
using static UnityEngine.ParticleSystem;

public class FaceActionController : MonoBehaviour
{
    public FaceEmotion faceEmotion;

    public NetworkController networkController;

    public GameObject confirmationPanel;
    public GameObject canvas;

    public GameObject rotatingGears;

    public GameObject infoText;

    public GameObject speechFlow;
    public GameObject particleSystem;
    public GameObject drops1;
    public GameObject drops2;

    public GameObject sleepZz;

    public GameObject water;
    public GameObject glass;

    public GameObject videoPlayer;
    public GameObject soundPlayer;
    private bool isPlaying = false;

    public GameObject videoObj;

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
    Color neutralEyeColor;
    Color startEyeColor;
    Color targetEyeColor;
    Color neutralBgColor;
    Color startBgColor;
    Color targetBgColor;

    public float blendDuration = 1f;

    private float breathPulse = 0;
    private bool breathUp = true;

    private bool isBlinking = false;
    private bool isBlinkingDisgusted = false;
    public float animationDuration = 0.2f; // duration in seconds
    private float elapsedTime = 0f;
    private bool goingUp = true;

    void Start()
    {
        Screen.sleepTimeout = SleepTimeout.NeverSleep;
        Screen.brightness = 1.0f;
        faceEmotion = new FaceEmotion();
        InvokeRepeating("EyeBreath", 0f, 0.035f);

        this.hideRotatingGears();
    }

    void OnApplicationPause(bool pauseStatus)
    {
        if (!pauseStatus)
        {
            // Restore screen settings when app resumes
            Screen.sleepTimeout = SleepTimeout.NeverSleep;
            Screen.brightness = 1.0f;
        }
    }

    private void OnAudioPlaybackComplete()
    {
        Debug.Log("Audio playback has finished!");
        var payload = "{\"action\": \"speechEnded\" }";
        this.networkController.sendMessage(payload);
        // Add your custom logic here
    }
    // Update is called once per frame
    void Update()
    {
        if (isPlaying && !this.soundPlayer.GetComponent<AudioSource>().isPlaying)
        {
            isPlaying = false;
            if(this.soundPlayer.GetComponent<AudioSource>().clip.name != "confirmSpeechInput")
            {
                OnAudioPlaybackComplete();
            }
        }

        if (lastEmotion != displayEmotion)
        {
            Debug.Log("change face: " + displayEmotion);
            this.startFace = this.getStartFace(eyeLeft, eyeRight);
            this.targetFace = faceEmotion.getEyeShapeValuesByEmotion(displayEmotion);
            this.startEyeColor = this.eyeMaterial.color;
            this.targetEyeColor = faceEmotion.getEyeColorByEmotion(displayEmotion);
            this.startBgColor = this.bgMaterial.color;
            this.targetBgColor = faceEmotion.getBgColorByEmotion(displayEmotion);
            t = 0.0f;
            tMulti = 1.0f;


            if (displayEmotion == "hot")
            {
                this.targetBgColor = new Color(178f / 255f, 0f, 0f);
                this.targetEyeColor = new Color(191f / 255f, 207f / 255f, 1f);
                this.targetFace = faceEmotion.getEyeShapeValuesByEmotion("Disgust");
                this.drops1.GetComponent<ParticleSystem>().GetComponent<ParticleSystem>().Play();
                this.drops2.GetComponent<ParticleSystem>().GetComponent<ParticleSystem>().Play();
            }
            else
            {
                this.drops1.GetComponent<ParticleSystem>().GetComponent<ParticleSystem>().Stop();
                this.drops2.GetComponent<ParticleSystem>().GetComponent<ParticleSystem>().Stop();
            }

            if (displayEmotion == "thirsty")
            {
                this.targetFace = faceEmotion.getEyeShapeValuesByEmotion("Joy");
                this.targetBgColor = new Color(255f / 255f, 220f / 255f, 115f / 255f);
                this.targetEyeColor = new Color(255f / 255f, 107f / 255f, 1f);
                this.particleSystem.GetComponent<ParticleSystem>().GetComponent<ParticleSystem>().Play();
                this.glass.GetComponent<ObjectMover>().StartMovement();
                this.water.GetComponent<ObjectMover>().StartMovement();
            }
            else
            {
                this.glass.GetComponent<ObjectMover>().StartInverseMovement();
                this.water.GetComponent<ObjectMover>().StartInverseMovement();
                this.particleSystem.GetComponent<ParticleSystem>().GetComponent<ParticleSystem>().Stop();
            }

            if (displayEmotion == "sleepy")
            {
                this.targetFace = faceEmotion.getEyeShapeValuesByEmotion("Sleepy");
                //this.targetBgColor = new Color(255f / 255f, 220f / 255f, 115f / 255f);
                //this.targetEyeColor = new Color(255f / 255f, 107f / 255f, 1f);
                this.sleepZz.GetComponent<ParticleSystem>().GetComponent<ParticleSystem>().Play();
                this.targetEyeColor = new Color(115f / 255f, 115f / 255f, 115f / 255f);
            }
            else
            {
                this.sleepZz.GetComponent<ParticleSystem>().GetComponent<ParticleSystem>().Stop();
            }

        }


        this.setFace(eyeLeft, eyeRight, this.startFace, this.targetFace);
        this.UpdateEyeColor(this.eyeMaterial, this.startEyeColor, this.targetEyeColor);
        this.UpdateEyeColor(this.bgMaterial, this.startBgColor, this.targetBgColor);

        if (isBlinking)
        {
            elapsedTime += Time.deltaTime;
            float t = elapsedTime / animationDuration;

            if (goingUp)
            {
                this.eyeLeft.SetBlendShapeWeight((int)EmotionShapes.blendshapeNumbers.Full, Mathf.Lerp(0, 100, t));
                this.eyeRight.SetBlendShapeWeight((int)EmotionShapes.blendshapeNumbers.Full, Mathf.Lerp(0, 100, t));

                if (t >= 1f)
                {
                    goingUp = false;
                    elapsedTime = 0f; // reset timer for the downward animation
                }
            }
            else
            {
                this.eyeLeft.SetBlendShapeWeight((int)EmotionShapes.blendshapeNumbers.Full, Mathf.Lerp(100, 0, t));
                this.eyeRight.SetBlendShapeWeight((int)EmotionShapes.blendshapeNumbers.Full, Mathf.Lerp(100, 0, t));
                if (t >= 1f)
                {
                    isBlinking = false; // stop the animation
                    elapsedTime = 0f;
                    goingUp = true;
}
            }
        }
        if (isBlinkingDisgusted)
        {
            elapsedTime += Time.deltaTime;
            float t = elapsedTime / animationDuration;

            if (goingUp)
            {
                this.eyeLeft.SetBlendShapeWeight((int)EmotionShapes.blendshapeNumbers.Disgusted, Mathf.Lerp(0, 40, t));
                this.eyeRight.SetBlendShapeWeight((int)EmotionShapes.blendshapeNumbers.Disgusted, Mathf.Lerp(0, 40, t));

                if (t >= 1f)
                {
                    goingUp = false;
                    elapsedTime = 0f; // reset timer for the downward animation
                }
            }
            else
            {
                this.eyeLeft.SetBlendShapeWeight((int)EmotionShapes.blendshapeNumbers.Disgusted, Mathf.Lerp(40, 0, t));
                this.eyeRight.SetBlendShapeWeight((int)EmotionShapes.blendshapeNumbers.Disgusted, Mathf.Lerp(40, 0, t));
                if (t >= 1f)
                {
                    isBlinkingDisgusted = false; // stop the animation
                    elapsedTime = 0f;
                    goingUp = true;
                }
            }
        }


        lastEmotion = displayEmotion;
    }

    internal void addSpeechVisual(int lengthWord)
    {
        Debug.Log("Length: " + lengthWord);
        if (lengthWord <= 0) return;
        if (lengthWord > 10) lengthWord = 10;

        ParticleSystem speechFlow = this.speechFlow.GetComponent<ParticleSystem>();
        var mainModule = speechFlow.main;
        mainModule.startSize3D = true;

        float scale = 1f / (11f - (float)lengthWord);
        Debug.Log(scale);
        var emitParams = new ParticleSystem.EmitParams
        {
            startSize3D = new Vector3(scale, 1f, 1f) // Set scale for this particle
        };

        speechFlow.Emit(emitParams, 1);

        // Scale only the X-axis of the particle
        /*var particles = new ParticleSystem.Particle[1];
        int numParticles = speechFlow.GetParticles(particles);
        if (numParticles > 0)
        {
            particles[0].startSize3D = new Vector3((1/(11-length)), particles[0].startSize3D.y, particles[0].startSize3D.z);
            speechFlow.SetParticles(particles, numParticles);
        }*/
    }

    internal void showRotatingGears()
    {
        Debug.Log("showRotatingGears");
        this.rotatingGears.SetActive(true);
    }

    internal void hideRotatingGears()
    {
        Debug.Log("hideRotatingGears");
        this.rotatingGears.SetActive(false);
    }

    internal void showConfirmationPanel()
    {
        //this.videoPlayer.GetComponent<VideoPlayer>().renderMode = VideoRenderMode.CameraNearPlane;
        this.confirmationPanel.SetActive(true);
    }

    internal void hideConfirmationPanel()
    {
        //this.videoPlayer.GetComponent<VideoPlayer>().renderMode = VideoRenderMode.APIOnly;
        this.confirmationPanel.SetActive(false);
    }

    internal void showVideo()
    {
        //this.videoPlayer.GetComponent<VideoPlayer>().renderMode = VideoRenderMode.CameraNearPlane;
        this.videoObj.SetActive(true);
    }

    internal void hideVideo()
    {
        //this.videoPlayer.GetComponent<VideoPlayer>().renderMode = VideoRenderMode.APIOnly;
        this.videoObj.SetActive(false);
    }

    internal void startVideo()
    {
        Debug.Log("Play video");
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
        if (this.soundPlayer.GetComponent<AudioSource>() != null)
        {
            this.soundPlayer.GetComponent<AudioSource>().Play();
            isPlaying = true;
        }
        else
        {
            Debug.LogError("AudioSource is not assigned.");
        }
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

    internal void setInfoText(string text)
    {
        Debug.Log("setInfoText");
        Debug.Log(this.infoText.GetComponent<Blink>());
        this.infoText.GetComponent<Blink>().setText(text);
    }

    internal void showInfoText(bool show)
    {
        this.infoText.SetActive(show);
    }

    internal void blink()
    {
        this.isBlinking = true;
    }
    internal void blinkDisgusted()
    {
        this.isBlinkingDisgusted = true;
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
        tmpLeftEye.sleepy = leftEye.GetBlendShapeWeight((int)EmotionShapes.blendshapeNumbers.Sleepy);

        tmpRightEye.angry = rightEye.GetBlendShapeWeight((int)EmotionShapes.blendshapeNumbers.Angry);
        tmpRightEye.disgusted = rightEye.GetBlendShapeWeight((int)EmotionShapes.blendshapeNumbers.Disgusted);
        tmpRightEye.full = rightEye.GetBlendShapeWeight((int)EmotionShapes.blendshapeNumbers.Full);
        tmpRightEye.kreis = rightEye.GetBlendShapeWeight((int)EmotionShapes.blendshapeNumbers.Kreis);
        tmpRightEye.sad = rightEye.GetBlendShapeWeight((int)EmotionShapes.blendshapeNumbers.Sad);
        tmpRightEye.happy = rightEye.GetBlendShapeWeight((int)EmotionShapes.blendshapeNumbers.Happy);
        tmpRightEye.sleepy = rightEye.GetBlendShapeWeight((int)EmotionShapes.blendshapeNumbers.Sleepy);

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
        eye.SetBlendShapeWeight((int)EmotionShapes.blendshapeNumbers.Sleepy, Mathf.Lerp(eyeBlendshapeDataStart.sleepy, eyeBlendshapeDataEnd.sleepy * 100, t));

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
    public Sleepy sleepy;
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
        this.sleepy = new Sleepy();
        this.neutral = new Neutral();
    }

    public Face getEyeShapeValuesByEmotion(string emotion)
    {
        switch (emotion.ToLower())
        {
            case "annoyance":
                return this.anger.annoyance;
                break;
            case "anger":
                return this.anger.anger;
                break;
            case "rage":
                return this.anger.rage;
                break;
            case "vigilance":
                return this.anticipation.vigilance;
                break;
            case "anticipation":
                return this.anticipation.anticipation;
                break;
            case "interest":
                return this.anticipation.interest;
                break;
            case "serenety":
                return this.joy.serenety;
                break;
            case "joy":
                return this.joy.joy;
                break;
            case "ecstasy":
                return this.joy.ecstasy;
                break;
            case "accepptance":
                return this.trust.acceptance;
                break;
            case "trust":
                return this.trust.trust;
                break;
            case "admiration":
                return this.trust.admiration;
                break;
            case "apprehension":
                return this.fear.apprehension;
                break;
            case "fear":
                return this.fear.fear;
                break;
            case "terror":
                return this.fear.terror;
                break;
            case "distraction":
                return this.surprise.distraction;
                break;
            case "surprise":
                return this.surprise.surprise;
                break;
            case "amazement":
                return this.surprise.amazement;
                break;
            case "pensiveness":
                return this.sadness.pensiveness;
                break;
            case "sadness":
                return this.sadness.sadness;
                break;
            case "grief":
                return this.sadness.grief;
                break;
            case "boredom":
                return this.disgust.boredom;
                break;
            case "disgust":
                return this.disgust.disgust;
                break;
            case "loathing":
                return this.disgust.loathing;
                break;
            case "contempt":
                return this.contempt.contempt;
                break;
            case "neutral":
                return this.neutral.neutral;
                break;
            case "idle1":
                return this.neutral.idle1;
                break;
            case "idle2":
                return this.neutral.idle2;
                break;
            case "sleepy":
                return this.sleepy.sleepy;
                break;
            default:
                return this.neutral.neutral;
                break;
        }

        return this.neutral.neutral;
    }

    public Color getBgColorByEmotion(string emotion)
    {
        /*if (emotion == "Apprehension" || emotion == "Fear" || emotion == "Terror")
        {
            return new Color(1f, 1f, 1f);
        }*/
        return new Color(0f, 0f, 0f);
    }

    public Color getEyeColorByEmotion(string emotion)
    {
        Color color = new Color(255f, 255f, 255f);
        /*
        switch (emotion.ToLower())
        {
            
            case "annoyance":
                color = new Color(255f, 255f, 0f);
                break;
            case "anger":
                color = new Color(255f, 0f, 0f);
                break;
            case "rage":
                color = new Color(255f, 0f, 0f);
                break;
            case "vigilance":
                color = new Color(255f, 255f, 0f);
                break;
            case "anticipation":
                color = new Color(255f, 255f, 0f);
                break;
            case "interest":
                color = new Color(255f, 255f, 0f);
                break;
            case "serenety":
                color = new Color(255f, 153f, 255f);
                break;
            case "joy":
                color = new Color(255f, 153f, 255f);
                break;
            case "ecstasy":
                color = new Color(255f, 153f, 255f);
                break;
            case "accepptance":
                color = new Color(255f, 255f, 0f);
                break;
            case "trust":
                color = new Color(255f, 255f, 0f);
                break;
            case "admiration":
                color = new Color(255f, 255f, 0f);
                break;
            case "apprehension":
                color = new Color(0f, 0f, 0f);
                break;
            case "fear":
                color = new Color(0f, 0f, 0f);
                break;
            case "terror":
                color = new Color(0f, 0f, 0f);
                break;
            case "distraction":
                color = new Color(69f, 166f, 159f);
                break;
            case "surprise":
                color = new Color(69f, 166f, 159f);
                break;
            case "amazement":
                color = new Color(69f, 166f, 159f);
                break;
            case "pensiveness":
                color = new Color(75f, 75f, 75f);
                break;
            case "sadness":
                color = new Color(75f, 75f, 75f);
                break;
            case "grief":
                color = new Color(75f, 75f, 75f);
                break;
            case "boredom":
                color = new Color(120f, 140f, 40f);
                break;
            case "disgust":
                color = new Color(120f, 140f, 40f);
                break;
            case "loathing":
                color = new Color(120f, 140f, 40f);
                break;
            case "contempt":
                color = new Color(140f, 140f, 140f);
                break;
            case "neutral":
                color = new Color(62f, 140f, 59f);
                break;
            case "idle1":
                color = new Color(255f, 255f, 0f);
                break;
            case "idle2":
                color = new Color(255f, 255f, 0f);
                break;
        default:
                color = new Color(255f, 255f, 0f);
                break;
        }*/
        color = new Color(75f, 156f, 48f);
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

public class Sleepy
{
    public Face sleepy;

    public Sleepy()
    {
        EmotionShapes lShape = new EmotionShapes();
        EmotionShapes rShape = new EmotionShapes();
        lShape.sleepy = 1f;
        rShape.sleepy = 1f;
        sleepy = new Face(lShape, rShape);
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
    public enum blendshapeNumbers { Kreis, Sad, Full, Happy, Angry, Disgusted, Sleepy }

    public float kreis = 0;
    public float sad = 0;
    public float full = 0;
    public float happy = 0;
    public float angry = 0;
    public float disgusted = 0;
    public float sleepy = 0;
}