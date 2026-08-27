from .DataRouter import DataRouter
from FileRetrieval.AudioLoader import download_file_from_s3, get_s3_client, upload_file_to_s3
from tools.WERCalculator import WERCalculator
import requests
import tempfile
import os
import time
from io import BytesIO
import logging  # Use logging for proper error and warning messages

class AudioRouter(DataRouter):
    """
    AudioRouter is a subclass of DataRouter that handles audio data routing.
    It routes audio files to the appropriate processing component and manages integration of:
      - Subtask transcription via an API call.
      - Downloading and processing the corresponding ground truth file from S3.
      - Calculating the Word Error Rate (WER) between transcription and ground truth.
      
    All routing metadata (such as API route, delivery time, file keys, and WER) are stored 
    in the 'router_data' dictionary.
    """
    
    def __init__(self):
        """
        Initializes the AudioRouter with an empty router_data dictionary.
        """
        try:
            # Initialize the router data dictionary to store routing metadata.
            self.router_data = {}
        except Exception as e:
            logging.exception("Error initializing AudioRouter: %s", e)
            raise

    def route_data(self, filename, audio_file, classification_result, subtask_models, s3):
        """
        Routes the audio data based on the classification result.
        
        The process includes:
          1. Determining the subtask API route from classification_result.
          2. Sending the audio file (wrapped as BytesIO) to the subtask API for transcription.
          3. Measuring the delivery time for the API call.
          4. Creating a temporary transcription file from the API response (if received).
          5. Downloading the corresponding ground truth file from S3.
          6. Writing the ground truth bytes to a temporary file.
          7. Calculating the Word Error Rate (WER) using the transcription and ground truth.
          8. Optionally uploading the transcription file to S3 and cleaning up temporary files.
          
        Parameters:
            filename (str): The name of the audio file.
            audio_file (bytes): Raw content of the audio file.
            classification_result (str/int): Classification label used to determine the subtask API.
            subtask_models (dict): Mapping from classification labels (as strings) to API endpoints.
            s3: An S3 client/resource for S3 operations (download/upload).
        """
        transcription_file = None   # Temporary file path for the transcription text file.
        gt_temp_file = None         # Temporary file path for the ground truth text file.
        s3_transcription_key = None # S3 key for the transcription file (currently remains unset).
        
        # Retrieve the API route using the classification result.
        api_route = subtask_models.get(str(classification_result), None)
        if api_route is None:
            logging.warning("API route for classification %s not found", classification_result)
        else:
            # Record the subtask API route in router_data.
            self.router_data['subtask_model'] = api_route
            try:
                # Prepare the file payload for the API request.
                files = {
                    'file': (filename, BytesIO(audio_file), 'audio/mpeg')  # Adjust MIME type if needed.
                }
                delivery_start_time = time.time()
                # Perform a POST request to the subtask API endpoint with the audio file.
                response = requests.post(api_route, files=files)
                delivery_end_time = time.time()
                # Calculate the delivery time in milliseconds.
                delivery_time = int((delivery_end_time - delivery_start_time) * 1000)
                self.router_data["delivery_time"] = delivery_time

                if response.status_code == 200:
                    # Parse the transcription from the API response.
                    transcription = response.json().get('transcription')
                    if transcription:
                        # Create a temporary file for the transcription in the system's temp directory.
                        temp_dir = tempfile.gettempdir()
                        original_basename = os.path.basename(filename)
                        name_without_ext, _ = os.path.splitext(original_basename)
                        stt_filename = f"STT_{name_without_ext}.txt"
                        transcription_file = os.path.join(temp_dir, stt_filename)
                        
                        # Write the transcription content to the temporary file.
                        with open(transcription_file, 'w') as f:
                            f.write(transcription)
                        
                        # Save the transcription file name in router_data.
                        self.router_data['transcriptionFilename'] = stt_filename  

                        s3_transcription_key = stt_filename  # Set the S3 key for the transcription file.
                    else:
                        logging.warning("No transcription received from API for %s.", filename)
                else:
                    # Log the error details if the API response status is not successful.
                    logging.error("Error %s for %s: %s", response.status_code, filename, response.text)
            except Exception as e:
                # Log any exception that occurs during the API call and transcription process.
                logging.exception("Failed to process %s: %s", filename, e)
        
        # Construct the S3 key for the ground truth file by replacing the file extension with .txt.
        base, ext = os.path.splitext(filename)
        gt_file_key = base + ".txt"
        # Save the ground truth file key in router_data for downstream use.
        self.router_data['ground_truth'] = gt_file_key
        
        try:
            # Attempt to download the ground truth file content from S3.
            ground_truth = download_file_from_s3('las.senior-design-spring2025-datarouting', gt_file_key, s3)
        except Exception as e:
            logging.exception("Failed to download ground truth file %s from S3: %s", gt_file_key, e)
            ground_truth = None

        # If ground truth data is available, write it to a temporary file.
        if ground_truth:
            try:
                temp_dir = tempfile.gettempdir()
                original_basename = os.path.basename(filename)
                name_without_ext, _ = os.path.splitext(original_basename)
                gt_filename = f"GT_{name_without_ext}.txt"
                gt_temp_file = os.path.join(temp_dir, gt_filename)
                # Write the ground truth content, assumed to be utf-8 encoded bytes, to the temp file.
                with open(gt_temp_file, 'w') as f:
                    f.write(ground_truth.decode('utf-8'))
            except Exception as e:
                logging.exception("Error writing ground truth to temporary file for %s: %s", filename, e)
        
        # If both transcription and ground truth files are available, calculate the Word Error Rate.
        if transcription_file and gt_temp_file:
            try:
                wer_calc = WERCalculator()
                wer = wer_calc.calculate_wer(transcription_file, gt_temp_file)
                # Store the rounded WER in router_data.
                self.router_data['fileWordErrorRate'] = round(wer, 4)
            except Exception as e:
                logging.exception("Error calculating WER for %s: %s", filename, e)
        
        # If a transcription file was created and an S3 key is set (if applicable), upload to S3.
        if transcription_file and s3_transcription_key:
            try:
                upload_file_to_s3(transcription_file, 'las.senior-design-spring2025-datarouting', s3_transcription_key, s3)
            except Exception as upload_error:
                logging.exception("Failed to upload transcription file to S3 for %s: %s", filename, upload_error)
            try:
                os.remove(transcription_file)
            except Exception as remove_error:
                logging.exception("Failed to remove temporary transcription file %s: %s", transcription_file, remove_error)
        
        # Clean up the temporary ground truth file if it was created.
        if gt_temp_file:
            try:
                os.remove(gt_temp_file)
            except Exception as remove_error:
                logging.exception("Failed to remove temporary ground truth file %s: %s", gt_temp_file, remove_error)

    def get_router_data(self):
        """
        Returns a copy of the router data dictionary containing all routing metadata.
        
        Returns:
            dict: The router_data which includes details like:
                  - 'subtask_model': API endpoint used.
                  - 'delivery_time': API call delivery time in ms.
                  - 'transcriptionFilename': Name of the temporary transcription file.
                  - 'ground_truth': Ground truth file key.
                  - 'fileWordErrorRate': Computed Word Error Rate.
        """
        try:
            return self.router_data.copy()
        except Exception as e:
            logging.exception("Error retrieving router data: %s", e)
            raise
