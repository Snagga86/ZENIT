using UnityEngine;

public class ObjectMover : MonoBehaviour
{
    public Transform pointA; // The starting point
    public Transform pointB; // The ending point

    private Transform startPoint; // The starting point
    private Transform endPoint; // The ending point

    public float speed = 2.0f; // The speed of movement

    private float startTime;
    private float journeyLength;
    private bool isMoving = false;

    private void Start()
    {
        endPoint = pointA;
        startPoint = pointB;
        // Calculate the distance between pointA and pointB
        journeyLength = Vector3.Distance(pointA.position, pointB.position);
    }

    public void StartMovement()
    {
        endPoint = pointB;
        startPoint = pointA;

        StartMoving();
    }

    public void StartInverseMovement()
    {
        endPoint = pointA;
        startPoint = pointB;

        StartMoving();
    }

    private void Update()
    {
        //Debug.Log("update");
        if (isMoving)
        {
            //Debug.Log("move");
            // Calculate the distance covered (how far we've moved since the start time)
            float distanceCovered = (Time.time - startTime) * speed;

            // Calculate the fraction of the journey completed
            float fractionOfJourney = distanceCovered / journeyLength;

            // Move the object smoothly using Lerp (Linear Interpolation)
            transform.position = Vector3.Lerp(startPoint.position, endPoint.position, fractionOfJourney);

            // If we've reached the destination, stop moving
            if (fractionOfJourney >= 1.0f)
            {
                isMoving = false;
            }
        }
    }

    public void StartMoving()
    {
        if(!isMoving && transform.position != endPoint.position)
        {
            startTime = Time.time;
            isMoving = true;
        }
    }
}