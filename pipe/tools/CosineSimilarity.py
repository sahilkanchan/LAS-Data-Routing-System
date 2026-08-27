"""
Cosine Similarity Calculator

This module provides a utility class for calculating the Cosine Similarity
between a speech-to-text output and a ground truth transcription.

Cosine similarity measures the similarity between two non-zero vectors by calculating
the cosine of the angle between them. It's a common metric in text analysis for
determining how similar two documents are regardless of their size.
"""
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

class CosineSimilarity:
    """
    Class for calculating Cosine Similarity between transcriptions.
    
    This class uses scikit-learn's TF-IDF vectorizer to convert text to vectors
    and then calculates the cosine similarity between them.
    """
    
    @staticmethod
    def calculate_cosine_similarity(speechToTextFile, groundTruthFile):
        """
        Calculate Cosine Similarity between reference and hypothesis.

        Args:
            speechToTextFile (str): Path to the file containing the speech-to-text output.
            groundTruthFile (str): Path to the file containing the ground truth transcription.

        Returns:
            float: The cosine similarity score as a value between 0 and 1, where:
                  - 1 means identical (perfect similarity)
                  - 0 means completely different (orthogonal)
                  - Values in between represent partial similarity
        """
        # Open and read the speech-to-text output file
        sttFile = open(speechToTextFile, 'r')
        # Open and read the ground truth file
        gtFile = open(groundTruthFile, 'r')
        
        # Extract the text content, removing leading/trailing whitespace
        reference = gtFile.read().strip()
        hypothesis = sttFile.read().strip()
        
        # Close the files to free up resources
        sttFile.close()
        gtFile.close()
        
        # Create TF-IDF vectors from the texts
        vectorizer = TfidfVectorizer()
        tfidf_matrix = vectorizer.fit_transform([reference, hypothesis])
        
        # Calculate cosine similarity
        # The result is a 2x2 matrix, but we only need the similarity between the two texts (position [0,1])
        similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
        
        return similarity