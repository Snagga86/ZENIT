# ZENIT Conversation and Model Integration

This repository contains scripts for setting up a Flask-based conversation system using the ZENIT model for natural language interactions, along with supporting scripts for environment setup.

## Setup Instructions

### Prerequisites

1. **Python Requirements**:

   - Python 3.8 or higher
   - Install dependencies listed in the `requirements.txt` file (see below for commands).
   - Ensure Flask and other necessary Python packages are installed.

2. **Install Required Libraries**:
   The project uses:

   - `flask`
   - `langchain-core`
   - `json`
   - `re`

   Use the following command to install these packages:

   ```bash
   pip install flask langchain-core
   ```

---

### Steps to Run

1. **Setting Up the Environment**:
   Use the `Modelfile` script to prepare and initialize the necessary model environment.

2. **Start the Server**:
   Run the `start.bat` script to initiate the Flask application:

   ```cmd
   start.bat
   ```

3. **Run the Main Script**:
   Launch the `ZENIT_conversation.py` file to start the Flask server and enable interaction with the ZENIT model:

   ```bash
   python ZENIT_conversation.py
   ```

---

### Key Features

- **Interactive Chat**:
  Processes human-like conversations using the ZENIT model, supporting dynamic conversation history.

- **JSON Repair**:
  Automatically detects and repairs JSON structures in responses for robust error handling.

- **Flask API**:
  Exposes endpoints for interaction with external applications.

---

### Notes

- The server runs on `127.0.0.1:12345` by default.
- Use POST requests with the `/ask` endpoint to send queries and receive responses.
- Customize the `Modelfile` and scripts to suit specific requirements.
