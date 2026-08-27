from .DataClassifier import DataClassifier
import os
import numpy as np
import joblib
from scipy.special import softmax
import time
import umap  # Use UMAP for dimensionality reduction instead of t-SNE
import logging  # Import logging for error handling

class AudioClassifier(DataClassifier):
    """
    Class for audio data classifiers.
    All audio data classifiers should inherit from this class.
    
    This class uses a provided machine learning model to transform audio data into features,
    compute softmax confidence scores, and predict the audio class. Additionally, if a pre-fitted 
    UMAP transformer is supplied, it reduces the feature dimensionality to 2D coordinates for visualization.
    """

    def __init__(self, model, umap_transformer=None):
        """
        Initialize the AudioClassifier with a model and an optional UMAP transformer.
        
        Parameters:
            model: A pre-loaded model which must implement the 'transform' and 'predict' methods.
            umap_transformer: An optional, pre-fitted UMAP transformer object (default is None). 
                              If provided, it is used to generate 2D coordinates from transformed features.
        """
        # Ensure to initialize the base DataClassifier
        super().__init__()
        try:
            self.model = model
            self.umap_transformer = umap_transformer  # Store the optional UMAP transformer
            self.classifier_data = {}  # Dictionary to hold predictions, confidence scores, and UMAP coordinates
        except Exception as e:
            logging.exception("Error initializing AudioClassifier: %s", e)
            raise

    def classify_data(self, tensor):
        """
        Classify the given audio data tensor.
        
        This function performs the following steps:
          1. Uses the model's 'transform' method to compute raw features from the input tensor.
          2. Computes confidence scores using the softmax function (for one sample).
          3. Obtains a prediction using the model's 'predict' method.
          4. Stores the prediction and confidence scores in 'classifier_data'.
          5. If a UMAP transformer is provided, transforms the features to 2D coordinates for visualization.
        
        Parameters:
            tensor: The input audio data in tensor format to be classified.
            
        Returns:
            prediction: The predicted class label.
        """
        try:
            # Transform the input tensor to extract features using the pre-loaded model.
            transformed = self.model.transform(tensor)
            
            # Compute confidence scores using softmax along axis 1.
            # Assumes that the tensor consists of a single sample (hence [0] index after softmax).
            distance_from_centroids = softmax(transformed, axis=1)[0]
            
            # Predict the class label using the model's predict method; assume one sample.
            prediction = self.model.predict(tensor)[0]
            self.classifier_data['prediction'] = prediction
            
            # Store each confidence score in the classifier_data dictionary with the index as key.
            for i, distance in enumerate(distance_from_centroids):
                self.classifier_data[i] = distance
            
            # If a pre-fitted UMAP transformer is provided, project the transformed features to 2D.
            if self.umap_transformer is not None:
                tensor_coords = self.umap_transformer.transform(transformed)
                # Save the first two coordinates for the first sample
                self.classifier_data['x'] = tensor_coords[0][0]
                self.classifier_data['y'] = tensor_coords[0][1]
            
            # Return the prediction result for further processing.
            return prediction

        except Exception as e:
            # Log the error with a traceback for debugging and then re-raise the exception.
            logging.exception("Error in classify_data: %s", e)
            raise

    def get_classifier_data(self):
        """
        Retrieve a copy of the classifier data.
        
        Returns:
            A dictionary containing:
              - 'prediction': the class label predicted by the classifier.
              - Confidence scores for each class (indexed by integers).
              - 'x' and 'y': (optional) the 2D coordinates from UMAP transformation, if available.
        """
        try:
            # Return a copy of the classifier_data dictionary to ensure data encapsulation.
            return self.classifier_data.copy()
        except Exception as e:
            logging.exception("Error in get_classifier_data: %s", e)
            raise
