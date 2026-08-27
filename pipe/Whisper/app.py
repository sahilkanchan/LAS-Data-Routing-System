"""
Whisper Transcription API Server

This Flask application provides an HTTP API that accepts audio files and returns
their transcriptions using OpenAI's Whisper model. The API has a single endpoint
'/transcribe' that processes POST requests with audio file attachments.

OpenAI Whisper is a state-of-the-art speech recognition model that supports
multiple languages and is trained on a diverse range of audio.
"""
from flask import Flask, request, jsonify
import whisper
import os

# Initialize Flask application
app = Flask(__name__)

# Load the Whisper model
# The "large-v3-turbo" model provides the best balance of accuracy and speed
# Note: First load will download the model if not already cached (~3GB)
model = whisper.load_model("large-v3-turbo")

@app.route('/transcribe', methods=['POST'])
def transcribe():
    """
    API endpoint to transcribe audio files.
    
    Expects:
        - A multipart/form-data POST request with a file field named 'file'
        - Supported audio formats include MP3, WAV, FLAC, etc.
    
    Returns:
        - JSON response with the transcription text
        - Error message with HTTP status code if something goes wrong
    """
    # Check if request contains a file
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files['file']
    
    # Check if file field was submitted but no file was selected
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    # Save the uploaded file temporarily to process with Whisper
    # Using /tmp directory for better compatibility with containerized environments
    temp_path = os.path.join("/tmp", file.filename)
    file.save(temp_path)

    # Transcribe the audio file using Whisper model
    try:
        # The transcribe method processes the audio and returns a dictionary
        # with the transcribed text and other metadata
        result = model.transcribe(temp_path)
        
        # Remove the temporary file to avoid filling up storage
        os.remove(temp_path)
        
        # Return just the transcription text in the response
        return jsonify({"transcription": result["text"]})
    except Exception as e:
        # Handle any errors during transcription
        return jsonify({"error": str(e)}), 500

# Run the Flask application when this script is executed directly
if __name__ == '__main__':
    # Listen on all network interfaces (0.0.0.0) to make it accessible
    # from outside the container when deployed
    app.run(host='0.0.0.0', port=5000)