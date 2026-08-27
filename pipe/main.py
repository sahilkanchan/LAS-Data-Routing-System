import os
import uuid
import datetime
import argparse
import pandas as pd
import time
import json
from tqdm import tqdm
import joblib
import umap
from pydub import AudioSegment  # For in-memory audio conversion
import boto3
import logging

# Import components from each pipeline stage.
from InputProcessor.AudioProcessor import AudioProcessor
from DataClassifier.AudioClassifier import AudioClassifier
from DataRouter.AudioRouter import AudioRouter
from DB_Util.MetadataSaver import save_metadata
from FileRetrieval.AudioLoader import download_file_from_s3, get_s3_client  # S3 logic comes from audio_loader

# Suppress specific UMAP-related warnings.
import warnings
warnings.filterwarnings("ignore", category=UserWarning, module="umap")

# GLOBAL VARIABLE TO STORE METADATA FROM ALL PIECES OF THE PIPELINE
METADATA_DICT = {}

# Configure logging for the application.
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

def print_logo():
    """
    Prints the ASCII art logo along with a welcome message.
    """
    logo = r"""
    
    __    ___   _____    ____        __           ____              __
   / /   /   | / ___/   / __ \____ _/ /_____ _   / __ \____  __  __/ /____  _____
  / /   / /| | \__ \   / / / / __ `/ __/ __ `/  / /_/ / __ \/ / / / __/ _ \/ ___/
 / /___/ ___ |___/ /  / /_/ / /_/ / /_/ /_/ /  / _, _/ /_/ / /_/ / /_/  __/ /    
/_____/_/  |_/____/  /_____/\__,_/\__/\__,_/  /_/ |_|\____/\__,_/\__/\___/_/
    
    """
    print(logo)
    print("Welcome to the Audio Processing CLI - Main Branch\n")

def parse_arguments():
    """
    Parse the command-line arguments to obtain the configuration file path.
    
    Returns:
        argparse.Namespace: The parsed arguments containing the config file path.
    """
    parser = argparse.ArgumentParser(description="Audio Processing CLI")
    parser.add_argument(
        '-c', '--config',
        type=str,
        required=True,
        help='Path to the JSON config file'
    )
    return parser.parse_args()

def load_config(config_path):
    """
    Loads a JSON configuration file.
    
    Parameters:
        config_path (str): The path to the JSON config file.
    
    Returns:
        dict: The parsed configuration dictionary.
    """
    with open(config_path, "r") as f:
        return json.load(f)

def process_file(file_id, file_path, config):
    """
    Unified function to process a single audio file.
    
    The function determines if the file is stored on S3 or on the local file system,
    processes the audio accordingly, and stores initial analytics metadata.
    
    Parameters:
        file_id      : An identifier for the file (e.g., its order in the CSV).
        file_path    : The S3 key or local file path of the audio file.
        config       : The configuration dictionary which may include S3 credentials.
    
    Returns:
        tuple: (feature_tensor, file_content, s3) where:
            - feature_tensor: The extracted feature vector, or error dictionary if failed.
            - file_content: The raw file bytes (for S3 processing) or None for local files.
            - s3: The S3 client instance (if using S3) or None for local files.
    """
    try:
        bucket_name = config.get("bucket_name", None)
        aws_access_key_id = config.get("aws_access_key_id")
        aws_secret_access_key = config.get("aws_secret_access_key")
        processor = AudioProcessor()
       
        # If bucket_name is provided, process the file from S3.
        if bucket_name:
            # Establish S3 connection using credentials from the config file.
            s3 = get_s3_client(aws_access_key_id, aws_secret_access_key)
            # Download the file content as bytes.
            file_content = download_file_from_s3(bucket_name, file_path, s3)
            # Determine file extension from the file path.
            file_ext = os.path.splitext(file_path)[1].lower()
            # Process the audio bytes to extract features.
            feature_tensor = processor.process_audio_bytes(file_content, file_ext, original_file_name=file_path)
        else:
            # For local file processing, use the file from the local filesystem.
            feature_tensor = processor.process_audio_file(file_path)
            # For consistency, set file_content and s3 to None.
            file_content = None
            s3 = None

        # Initialize metadata entry for this file and store analytics data from processing.
        METADATA_DICT[file_id] = []
        METADATA_DICT[file_id].append(processor.get_analytics_data())
        return feature_tensor, file_content, s3

    except Exception as e:
        logging.exception("Error processing file %s: %s", file_path, e)
        return {"filename": file_path, "status": f"Error: {e}"}

def classify_file(file_id, tensor, model, umap_transformer):
    """
    Classifies the feature tensor extracted from the audio file.
    
    Parameters:
        file_id       : Identifier for the file.
        tensor        : Feature vector from audio processing.
        model         : The pre-loaded classification model.
        umap_transformer: The UMAP transformer (if available) to project features.
    
    Returns:
        The classification result.
    """
    try:
        classifier = AudioClassifier(model, umap_transformer)
        classification = classifier.classify_data(tensor)
        # Store classification results from the classifier.
        METADATA_DICT[file_id].append(classifier.get_classifier_data())
        return classification
    except Exception as e:
        logging.exception("Error classifying file %s: %s", file_id, e)
        raise

def route_data(file_id, file_path, audio_file, classification_result, subtask_models, s3):
    """
    Routes the audio file data based on its classification and stores the routing metadata.
    
    Parameters:
        file_id            : Identifier for the file.
        file_path          : The original file path or S3 key.
        audio_file         : The raw audio file content (if available).
        classification_result: The result from the classifier.
        subtask_models     : Dictionary mapping classifications to subtask API endpoints.
        s3                 : The S3 client instance (if applicable).
    """
    try:
        router = AudioRouter()
        router.route_data(file_path, audio_file, classification_result, subtask_models, s3)
        # Append routing metadata to the global metadata dictionary.
        METADATA_DICT[file_id].append(router.get_router_data())
    except Exception as e:
        logging.exception("Error routing data for file %s: %s", file_id, e)
        raise

def run_batch(config, model, umap_transformer):
    """
    Runs the entire processing pipeline on a batch of files as specified in the CSV.
    
    Reads the CSV for file paths, processes, classifies, and routes each file sequentially,
    and updates the metadata for each processing stage.
    
    Parameters:
        config         : The configuration dictionary.
        model          : The classification model.
        umap_transformer: The UMAP transformer for feature projection.
    """
    try:
        csv_path = config.get("csv_path")
        subtask_models = config.get("subtask_models")
        # Ensure that the CSV file exists.
        if not os.path.isfile(csv_path):
            logging.error("CSV file %s does not exist.", csv_path)
            return
        df = pd.read_csv(csv_path)
        # Check for the presence of the required 'Paths' column.
        if "Paths" not in df.columns:
            logging.error("CSV does not contain 'Paths' column.")
            return
        files = df["Paths"].dropna().tolist()
    except Exception as e:
        logging.exception("Error reading CSV file: %s", e)
        return

    # Process each file in the CSV.
    for i, file_path in enumerate(tqdm(files, desc="Processing Files", unit="file"), start=1):
        try:
            # Process the file (from S3 or locally), and capture processing time.
            processor_start = time.time()
            tensor, audio_file, s3 = process_file(i, file_path, config)
            processor_end = time.time()
            processing_time = int((processor_end - processor_start) * 1000)
            METADATA_DICT[i][0]["processing_time"] = processing_time

            # Classify the processed file and record classification time.
            classifier_start = time.time()
            classification = classify_file(i, tensor, model, umap_transformer)
            classifier_end = time.time()
            classification_time = int((classifier_end - classifier_start) * 1000)
            METADATA_DICT[i][1]["classification_time"] = classification_time
            
            # Route the data based on classification and record routing time.
            routing_start = time.time()
            route_data(i, file_path, audio_file, classification, subtask_models, s3)
            routing_end = time.time()
            routing_time = int((routing_end - routing_start) * 1000)
            METADATA_DICT[i][2]["routing_time"] = routing_time
        except Exception as e:
            logging.exception("Error processing batch for file ID %s: %s", i, e)

def main():
    """
    The main function that orchestrates the audio processing pipeline.
    
    It:
      1. Displays the ASCII logo and welcome message.
      2. Parses command-line arguments for the configuration file.
      3. Loads the JSON configuration.
      4. Loads the pre-trained model and (optionally) prepares the UMAP transformer.
      5. Runs the batch processing pipeline.
      6. Saves all collected metadata to the database.
    """
    print_logo()
    args = parse_arguments()
    config = load_config(args.config)
    model_path = config.get("model_path", "/app/DataClassifier/model/trained_model.joblib")
    
    try:
        model = joblib.load(model_path)
        logging.info("Model loaded successfully from %s", model_path)
    except Exception as e:
        logging.error("Error loading model from %s: %s", model_path, e)
        return

    umap_transformer = None
    centroid_coords = None
    # If the model has centroids, perform a UMAP projection for visualization.
    if hasattr(model, "cluster_centers_"):
        centroids = model.cluster_centers_
        umap_transformer = umap.UMAP(n_components=2, random_state=42)
        centroid_coords = umap_transformer.fit_transform(centroids)
        logging.info("UMAP transformer applied to model centroids.")

    model_name = model_path
    start = time.time()

    run_batch(config, model, umap_transformer)

    end = time.time()
    total_time = int((end - start) * 1000)
    # Save metadata into the database.
    try:
        save_metadata(METADATA_DICT, total_time, model_name, centroid_coords)
        logging.info("Metadata saved successfully. Total processing time: %sms", total_time)
    except Exception as e:
        logging.exception("Error saving metadata: %s", e)

if __name__ == "__main__":
    main()
