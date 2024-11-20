using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class RotateGear : MonoBehaviour
{
    [Tooltip("Rotation speed in degrees per second")]
    public float rotationSpeed = 50f; // Set the speed of rotation

    void Start()
    {
        // Start the rotation immediately on object creation
        Rotate();
    }

    void Rotate()
    {
        // Rotate around Z-axis (or change the axis if needed)
        transform.Rotate(0f, rotationSpeed * Time.deltaTime, 0f);
    }

    void Update()
    {
        Rotate();
    }
}

