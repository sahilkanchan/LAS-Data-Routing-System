import os
import time
import warnings
import numpy as np
import librosa
import torch
from transformers import Wav2Vec2Processor, Wav2Vec2Model, logging as transformers_logging
from pydub import AudioSegment

warnings.simplefilter("ignore", FutureWarning)
transformers_logging.set_verbosity_error()



# Import loader functions from audio_loader.py
from FileRetrieval.AudioLoader import load_audio_bytes, load_audio_local_file, load_audio_local_folder

# Assuming InputProcessor is a base class in your project.
from .InputProcessor import InputProcessor

class AudioProcessor(InputProcessor):
    
    def __init__(self):
        """
        Initialize the Wave2Vec processor, model, and analytics storage.
        """
        self.processor = Wav2Vec2Processor.from_pretrained("facebook/wav2vec2-base-960h")
        self.model = Wav2Vec2Model.from_pretrained("facebook/wav2vec2-base-960h")
        self.processor_data = {}

    def get_file_size(self, file_path: str) -> int:
        """
        Returns the size of the file in bytes.
        """
        return os.path.getsize(file_path) if os.path.exists(file_path) else 0

    def initialize_metadata(self, file_path: str):
        """
        Initializes metadata for the given file.
        """
        self.processor_data = {
            "filename": os.path.basename(file_path),
            "byte_size": self.get_file_size(file_path),
            "processing_time": None,
            "validation_status": None,
            "feature_extraction_success": None,
            "feature_shape": None
        }

    def validate_input(self, input_path: str) -> bool:
        """
        Validates the audio file before processing.
        """
        try:
            self.initialize_metadata(input_path)
            if not input_path.lower().endswith('.wav'):
                self.processor_data["validation_status"] = False
                return False
            audio = AudioSegment.from_wav(input_path)
            if audio.frame_rate != 16000:
                self.processor_data["validation_status"] = False
                return False
            if audio.channels != 1:
                self.processor_data["validation_status"] = False
                return False
            if len(audio) < 1000:
                self.processor_data["validation_status"] = False
                return False
            self.processor_data["validation_status"] = True
            return True
        except Exception as e:
            self.processor_data["validation_status"] = False
            return False

    def process_input(self, input_path: str) -> np.ndarray:
        """
        Processes an audio file using Wave2Vec for feature extraction.
        """
        try:
            if not self.processor_data.get("validation_status", False):
                self.processor_data["feature_extraction_success"] = False
                return np.array([])
            audio, sr = librosa.load(input_path, sr=16000)
            input_values = self.processor(
                audio, 
                sampling_rate=16000, 
                return_tensors="pt", 
                padding="longest"
            ).input_values
            with torch.no_grad():
                feature_vector = self.model(input_values).last_hidden_state.mean(dim=1).detach().numpy()
            self.processor_data["feature_extraction_success"] = True
            self.processor_data["feature_shape"] = feature_vector.shape
            return feature_vector
        except Exception as e:
            self.processor_data["feature_extraction_success"] = False
            return np.array([])

    def process_audio_bytes(self, file_bytes: bytes, file_ext: str, original_file_name: str = None) -> np.ndarray:
        """
        Processes audio data provided as bytes by converting the data to a WAV file using the audio_loader.
        """
        try:
            temp_file_path = load_audio_bytes(file_bytes, file_ext)
            if not self.validate_input(temp_file_path):
                return np.array([])
            feature_tensor = self.process_input(temp_file_path)
            if original_file_name is not None:
                self.processor_data["filename"] = original_file_name
            return feature_tensor
        except Exception as e:
            return np.array([])

    def process_audio_file(self, file_path: str) -> np.ndarray:
        """
        Processes an audio file from the local disk using the audio_loader function for local files.
        """
        try:
            start_time = time.time()
            temp_file_path = load_audio_local_file(file_path)
            if not self.validate_input(temp_file_path):
                return np.array([])
            feature_tensor = self.process_input(temp_file_path)
            end_time = time.time()
            processing_time = int((end_time - start_time) * 1000)
            self.processor_data["processing_time"] = processing_time
            self.processor_data["filename"] = os.path.basename(file_path)
            return feature_tensor
        except Exception as e:
            return np.array([])

    def process_audio_folder(self, folder_path: str) -> dict:
        """
        Processes all audio files in a given local folder.
        Returns a dictionary mapping original file names to their extracted feature vectors.
        """
        features_dict = {}
        for filename in os.listdir(folder_path):
            file_path = os.path.join(folder_path, filename)
            if os.path.isfile(file_path):
                feature_vector = self.process_audio_file(file_path)
                features_dict[filename] = feature_vector
        return features_dict

    def get_analytics_data(self) -> dict:
        """
        Returns the data collected during processing for analytics.
        """
        return self.processor_data.copy()
