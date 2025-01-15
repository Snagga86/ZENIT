from flask import Flask, request, jsonify
from langchain_core.chat_history import InMemoryChatMessageHistory
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate
from langchain_ollama import ChatOllama
import json
import re

# Initialize Flask app
app = Flask(__name__)

# Create a single in-memory conversation history
conversation_history = InMemoryChatMessageHistory()

# Initialize the Ollama model
ollama_model = ChatOllama(model="ZENIT", keep_alive = -1)  # Replace "base" with "3.2" if needed

def build_conversation_prompt(history, max_messages=3):
    """
    Build a conversation prompt using the last `max_messages` from the history.
    """
    messages = []
    for message in history.messages[-max_messages:]:  # Use the last N messages
        if isinstance(message, HumanMessage):
            messages.append(f"Human: {message.content}")
        elif isinstance(message, AIMessage):
            messages.append(f"ZENIT: {message.content}")

    print(messages)
    return "\n".join(messages)
    
@app.route('/ask', methods=['POST'])
def ask():
    """
    Flask endpoint to process user prompts and return model responses.
    Uses a single static conversation history with a ChatPromptTemplate.
    """
    try:
        # Parse JSON request body
        data = request.json
        print("data")
        print(data)
        prompt = data.get("prompt", "").strip()
        print("prompt")
        print(prompt)

        if not prompt:
            return jsonify({"error": "Prompt is required"}), 400

        # Add the user's message to the conversation history
        conversation_history.add_message(HumanMessage(content=prompt))

        full_prompt = build_conversation_prompt(conversation_history)

        response = ollama_model.invoke(full_prompt)
        print("response: ")
        print(response)
        content_json = repair_json(response.content)
        print("repaired JSON: ")
        print(content_json)

        # Add the model's response to the conversation history
        conversation_history.add_message(AIMessage(content=str(content_json['answer'])))

        return content_json

    except Exception as e:
        # Handle errors gracefully
        app.logger.error(f"Error processing request: {e}")
        return jsonify({"answer": "uuups, da ist mir ein Fehler passiert", "emotion": "sadness"}), 500

def repair_json(input_string):
    # Ensure the string is in UTF-8
    if isinstance(input_string, bytes):
        input_string = input_string.decode('utf-8')

    # Extract potential JSON objects from the string
    json_pattern = re.compile(r'{\s*"answer"\s*:\s*".*?",\s*"emotion"\s*:\s*".*?"\s*}')
    match = json_pattern.search(input_string)
    if not match:
        return None  # Return None if no valid JSON object is found

    json_str = match.group()
    
    # Parse the JSON object
    try:
        json_obj = json.loads(json_str)
    except json.JSONDecodeError:
        return None

    # Check if the "text" field is itself a JSON object
    text_content = json_obj.get("answer", "")
    try:
        nested_json = json.loads(text_content)
        return nested_json  # Return the nested JSON if it exists
    except json.JSONDecodeError:
        pass

    # Handle string parts before the JSON
    pre_json_part = input_string[:match.start()].strip()
    if pre_json_part:
        # Check if the prefix is not content:, content=, zenit:, or zenit= and is longer than 15 chars
        pre_json_part_lower = pre_json_part.lower()
        if not (pre_json_part_lower.startswith(('content:', 'content=', 'zenit:', 'zenit=')) and len(pre_json_part) <= 15):
            text_content = pre_json_part + ' ' + text_content

    # Update the "text" field and return the modified JSON object
    json_obj["answer"] = text_content.strip()
    return json_obj

def getValidJSONAnswer(raw_answer):
    match = re.search(r"content='({.*?})'", raw_answer)
    if match:
        content_json_str = match.group(1)  # Extract the JSON-like content string

        # Step 2: Parse the extracted JSON string
        try:
            content_json = json.loads(content_json_str)  # Convert to Python dictionary
            print("Valid JSON Object:", content_json)
            return content_json;
        except json.JSONDecodeError as e:
            print("Failed to parse JSON:", e)
            return None;
    else:
        print("No valid JSON found in the input string.")
        return None;



if __name__ == "__main__":
    # Run the Flask app
    app.run(host="127.0.0.1", port=12345, debug=True)
