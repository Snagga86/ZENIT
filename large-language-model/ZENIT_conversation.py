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

def build_conversation_prompt(history, max_messages=5):
    """
    Build a conversation prompt using the last `max_messages` from the history.
    """
    messages = []
    for message in history.messages[-max_messages:]:  # Use the last N messages
        if isinstance(message, HumanMessage):
            messages.append(f"Human: {message.content}")
        elif isinstance(message, AIMessage):
            messages.append(f"AI: {message.content}")

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

        #print("full_prompt")
        #print(full_prompt)

        # Invoke the Ollama model with the full conversation context
        response = ollama_model.invoke(full_prompt)
        print(type(response))
        print(response.content)
        content = process_string(response.content)
        print(content)
        try:
            print("try decode JSON")
            # Step 2: Attempt to parse as JSON
            content_json = json.loads(content)
            print("Extracted JSON Object:", content)
        except json.JSONDecodeError:
            # Step 3: If not JSON, transform it into the desired JSON structure
            content_json = {
                "answer": content_json,
                "emotion": "neutral"
            }
            print("Transformed JSON Object:", content_json)

        # Add the model's response to the conversation history
        conversation_history.add_message(AIMessage(content=str(response.content)))

        print("hier unten")
        # Return the model's response as JSON
        #response_utf8 = str(response).encode("utf-8").decode("utf-8")
        #print(response_utf8)
        return content_json

    except Exception as e:
        # Handle errors gracefully
        app.logger.error(f"Error processing request: {e}")
        return jsonify({"error": str(e)}), 500

def process_string(input_string):
    # Find the first occurrence of '{' and '}'
    start_index = input_string.find('{')
    end_index = input_string.find('}', start_index)
    
    if start_index == -1:  # No '{' in the string
        return input_string
    
    # Extract all characters before the first '{'
    prefix = input_string[:start_index].strip()
    
    # If there are more than 15 characters before '{', include them in '{}'
    if len(prefix) > 15:
        if end_index != -1:  # Both '{' and '}' exist
            return f"{{{prefix}}}" + input_string[start_index:end_index + 1]
        else:  # Only '{' exists
            return f"{{{prefix}}}" + input_string[start_index:]
    else:
        # Original behavior for cases with <= 15 characters before '{'
        if end_index != -1:
            return input_string[start_index:end_index + 1]
        else:
            return input_string[start_index:]  # Only '{' exists, no '}'

# Return the input string unchanged if none of the conditions are met
    return input_string

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
