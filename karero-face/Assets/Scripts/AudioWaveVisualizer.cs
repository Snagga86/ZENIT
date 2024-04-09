using UnityEngine;

[RequireComponent(typeof(AudioSource))]
[RequireComponent(typeof(LineRenderer))]
public class AudioWaveVisualizer : MonoBehaviour
{
    public float frequency = 1f;
    public float amplitude = 1f;
    public int resolution = 1000;

    private AudioSource audioSource;
    private LineRenderer lineRenderer;

    private void Start()
    {
        audioSource = GetComponent<AudioSource>();
        lineRenderer = GetComponent<LineRenderer>();

        lineRenderer.positionCount = resolution;
    }

    private void Update()
    {
        float[] samples = new float[resolution];
        audioSource.GetOutputData(samples, 0);

        for (int i = 0; i < resolution; i++)
        {
            float x = (float)i / (float)resolution;
            float y = Mathf.Sin(x * frequency * 2f * Mathf.PI) * amplitude * samples[i];

            lineRenderer.SetPosition(i, new Vector3(x, y, 0f));
        }
    }
}