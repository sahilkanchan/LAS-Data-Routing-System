import os
import tempfile
from io import BytesIO
from pydub import AudioSegment
import boto3
import logging  # Use logging for error reporting and debugging

def load_audio_file(file_path: str, target_sample_rate: int = 16000, target_channels: int = 1) -> AudioSegment:
    """
    Loads an audio file from a given file path and converts it to the target sample rate and channels.
    
    Parameters:
        file_path (str): Path to the audio file.
        target_sample_rate (int): Desired sample rate in Hz (default 16000).
        target_channels (int): Desired number of audio channels (default 1).
    
    Returns:
        AudioSegment: The loaded audio segment after conversion.
    
    Raises:
        Exception: Propagates any exceptions encountered while loading or processing the file.
    """
    try:
        # Load the audio file using pydub's AudioSegment.
        audio = AudioSegment.from_file(file_path)
        # Check if conversion is required based on target sample rate and channels.
        if audio.frame_rate != target_sample_rate or audio.channels != target_channels:
            audio = audio.set_frame_rate(target_sample_rate).set_channels(target_channels)
        return audio
    except Exception as e:
        logging.exception("Error loading audio file from path %s: %s", file_path, e)
        raise

def load_audio_bytes(file_bytes: bytes, file_ext: str, target_sample_rate: int = 16000, target_channels: int = 1) -> str:
    """
    Loads audio data from bytes. If the file is not in WAV format, converts it to WAV.
    Returns the path to a temporary WAV file for further processing.
    
    Parameters:
        file_bytes (bytes): The audio data in bytes.
        file_ext (str): The file extension (e.g., '.mp3', '.wav').
        target_sample_rate (int): The desired sample rate (default 16000).
        target_channels (int): The desired number of audio channels (default 1).
    
    Returns:
        str: The file path to the temporary WAV file.
    
    Raises:
        Exception: Propagates any exceptions encountered during loading or conversion.
    """
    try:
        file_ext = file_ext.lower()
        # Load audio from bytes based on the file extension.
        if file_ext == ".mp3":
            audio = AudioSegment.from_mp3(BytesIO(file_bytes))
        else:
            # Remove the dot from extension and load file using appropriate format.
            audio = AudioSegment.from_file(BytesIO(file_bytes), format=file_ext.strip('.'))
        
        # Convert audio to target sample rate and channel count.
        audio = audio.set_frame_rate(target_sample_rate).set_channels(target_channels)
        # Create a temporary file for storing the converted WAV file.
        temp_file = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
        audio.export(temp_file.name, format="wav")
        temp_file.close()
        return temp_file.name
    except Exception as e:
        logging.exception("Error loading audio from bytes with extension %s: %s", file_ext, e)
        raise

def load_audio_local_file(file_path: str, target_sample_rate: int = 16000, target_channels: int = 1) -> str:
    """
    Loads audio data from a local file and converts it to a temporary WAV file.
    
    Parameters:
        file_path (str): The local path to the audio file.
        target_sample_rate (int): The desired sample rate in Hz (default 16000).
        target_channels (int): The desired number of audio channels (default 1).
    
    Returns:
        str: The path to the temporary WAV file.
    
    Raises:
        Exception: Propagates any exceptions encountered during processing.
    """
    try:
        # Load and convert the audio file to the target format.
        audio = load_audio_file(file_path, target_sample_rate, target_channels)
        # Create a temporary file to store the WAV version.
        temp_file = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
        audio.export(temp_file.name, format="wav")
        temp_file.close()
        return temp_file.name
    except Exception as e:
        logging.exception("Error loading audio from local file %s: %s", file_path, e)
        raise

def load_audio_local_folder(folder_path: str, target_sample_rate: int = 16000, target_channels: int = 1) -> list:
    """
    Loads audio data from all files in the specified folder and converts each to a temporary WAV file.
    
    Parameters:
        folder_path (str): Path to the folder containing audio files.
        target_sample_rate (int): The desired sample rate in Hz (default 16000).
        target_channels (int): The desired number of audio channels (default 1).
    
    Returns:
        list: A list of paths to the temporary WAV files generated from the audio files in the folder.
    """
    temp_files = []
    # Iterate over all files in the specified folder.
    for filename in os.listdir(folder_path):
        file_path = os.path.join(folder_path, filename)
        if os.path.isfile(file_path):
            try:
                # Convert local audio file to a temporary WAV file.
                temp_file_path = load_audio_local_file(file_path, target_sample_rate, target_channels)
                temp_files.append(temp_file_path)
            except Exception as e:
                # Log the error and continue processing other files.
                logging.error("Error processing file %s: %s", file_path, e)
                continue
    return temp_files

# S3 Utility Functions

def get_s3_client(aws_access_key_id, aws_secret_access_key):
    """
    Returns a boto3 S3 client using provided AWS credentials.
    
    Parameters:
        aws_access_key_id: AWS access key ID.
        aws_secret_access_key: AWS secret access key.
    
    Returns:
        boto3 S3 client instance.
    
    Raises:
        Exception: Propagates any exceptions during client creation.
    """
    try:
        return boto3.client(
            's3',
            aws_access_key_id=aws_access_key_id,
            aws_secret_access_key=aws_secret_access_key
        )
    except Exception as e:
        logging.exception("Error creating S3 client: %s", e)
        raise

def download_file_from_s3(bucket: str, key: str, s3) -> bytes:
    """
    Downloads a file from the specified S3 bucket using the given key.
    
    Parameters:
        bucket (str): The S3 bucket name.
        key (str): The object key in the S3 bucket.
        s3: A boto3 S3 client instance.
    
    Returns:
        bytes: The downloaded file content.
    
    Raises:
        Exception: Propagates any exceptions encountered during the download.
    """
    try:
        # Retrieve the object from the S3 bucket.
        response = s3.get_object(Bucket=bucket, Key=key)
        # Read the file content from the response body.
        file_content = response['Body'].read()
        return file_content
    except Exception as e:
        logging.exception("Error downloading file from S3 bucket %s with key %s: %s", bucket, key, e)
        raise

def upload_file_to_s3(file_path: str, bucket: str, key: str, s3) -> None:
    """
    Uploads a file from the given file path to the specified S3 bucket under the provided key.
    
    Parameters:
        file_path (str): The local file path of the file to upload.
        bucket (str): The name of the target S3 bucket.
        key (str): The destination key (path) for the file in the S3 bucket.
        s3: The boto3 S3 client instance.
    
    Raises:
        Exception: Propagates any exceptions encountered during the upload.
    """
    try:
        s3.upload_file(file_path, bucket, key)
    except Exception as e:
        logging.error("Error uploading file %s to bucket '%s' with key %s: %s", file_path, bucket, key, e)
        raise
