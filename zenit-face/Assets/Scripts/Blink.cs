using System.Collections;
using System.Collections.Generic;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

public class Blink : MonoBehaviour
{
    private TextMeshProUGUI textField;
    private bool isBlinking = false;

    // Start is called before the first frame update
    void Start()
    {
        this.textField = this.gameObject.GetComponent<TextMeshProUGUI>();
        Debug.Log(this.gameObject);
        Debug.Log(this.textField);
    }

    public void setText(string text)
    {
        this.textField.text = text;
    }

    void OnEnable()
    {
        StartCoroutine(BlinkText());
    }

    IEnumerator BlinkText()
    {
        while (true)
        {
            yield return new WaitForSeconds(1.5f); // Wait for 2 seconds

            isBlinking = true;
            this.textField.enabled = !this.textField.enabled; // Toggle visibility

            yield return new WaitForSeconds(1.5f); // Wait for another 2 seconds

            isBlinking = false;
            this.textField.enabled = true; // Ensure the text is visible after blinking
        }
    }
}
