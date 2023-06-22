var globalStore = {
    filename: "",
    communicationLevel: ["only_verbal","only_nonverbal","verbal_and_nonverbal"], // or "random or order"
    currentCommunicationLevel: "",
    communicationMode: "order",
    countVisits: 0,
    welcomeDistance: 2.0
  };
  
  export default globalStore;