using UnityEngine;

public class TouchCheck : MonoBehaviour
{
    void Update()
    {
        // Check for screen touch on Android
        if (Input.touchCount > 0)
        {
            for (int i = 0; i < Input.touchCount; i++)
            {
                Touch touch = Input.GetTouch(i);

                if (touch.phase == TouchPhase.Began)
                {
                    HandleTouch(touch.position);
                }
            }
        }

        // Fallback: Check for key press (X key)
        if (Input.GetKeyDown(KeyCode.X))
        {
            HandleKeyPress();
        }
    }

    /// <summary>
    /// Handles the touch event and performs an action.
    /// </summary>
    /// <param name="touchPosition">The position of the touch.</param>
    private void HandleTouch(Vector2 touchPosition)
    {
        Debug.Log($"Screen touched at: {touchPosition}");
        // Add your custom touch handling logic here
    }

    /// <summary>
    /// Handles the fallback key press event (X key).
    /// </summary>
    private void HandleKeyPress()
    {
        Debug.Log("X key pressed.");
        // Add your custom key press handling logic here
    }
}
