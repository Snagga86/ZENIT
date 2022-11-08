using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class DebugButton : MonoBehaviour
{

    private bool panelActive = false;

    // Start is called before the first frame update
    void Start()
    {
        GameObject.Find("DetailPanel").SetActive(panelActive);
    }

    // Update is called once per frame
    void Update()
    {
        
    }


    public void togglePanel()
    {
        panelActive = !panelActive;
        GameObject.Find("Canvas/ShowDebug/DetailPanel").SetActive(panelActive);
    }
}
