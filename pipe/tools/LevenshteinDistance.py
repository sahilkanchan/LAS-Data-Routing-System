"""
Levenshtein Distance Calculation

This module provides a function to calculate the Levenshtein distance between two text files.
The Levenshtein distance is a measure of the difference between two sequences. 
It is defined as the minimum number of single-character edits (insertions, deletions, or substitutions) 
required to change one word into the other. 
"""
from Levenshtein import distance

class LevenshteinDistance:
    
    @staticmethod
    def calculate_levenshtein_distance(speechToTextFile, groundTruthFile):
        """
        Calculate Levenshtein Distance between reference and hypothesis.

        Args:
            speechToTextFile (str): Path to the file containing the speech-to-text output.
            groundTruthFile (str): Path to the file containing the ground truth transcription.

        Returns:
            int: The Levenshtein distance between the two texts.
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
        
        # Calculate Levenshtein distance
        # other params: 
            # weight: Tuple[int, int, int] for weighting insertions, deletions, substitutions
            # processor: Callable[[str], str] for pre-processing the strings
            # score_cutoff: Optional[int] for early stopping if distance exceeds this value
            # score_hint: Optional[int] for hinting the expected distance
        lev_distance = distance(reference, hypothesis)
        
        return lev_distance