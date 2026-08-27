"""
Word Error Rate (WER) Calculator

This module provides a utility class for calculating the Word Error Rate between
a speech-to-text output and a ground truth transcription.

WER is a common metric used to evaluate the accuracy of speech recognition systems.
It represents the percentage of words that were incorrectly recognized, calculated as:
WER = (Substitutions + Deletions + Insertions) / (Total Words in Reference)
"""
import evaluate

class WERCalculator:
    """
    Class for calculating Word Error Rate between transcriptions.
    
    This class uses the Hugging Face 'evaluate' library to compute WER,
    which handles tokenization and alignment between reference and hypothesis texts.
    """
    
    # Load the WER metric once as a class variable to avoid reloading
    # This improves performance when calculating WER for multiple files
    wer = evaluate.load("wer")
    
    @staticmethod
    def calculate_wer(speechToTextFile, groundTruthFile):
        """
        Calculate Word Error Rate (WER) between reference and hypothesis.

        Args:
            speechToTextFile (str): Path to the file containing the speech-to-text output.
            groundTruthFile (str): Path to the file containing the ground truth transcription.

        Returns:
            float: The WER score as a value between 0 and 1, where:
                  - 0 means perfect recognition (no errors)
                  - 1 means complete mismatch (all words wrong)
                  - Values in between represent the error percentage
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
        
        # Calculate WER using the evaluate library
        # The compute method expects lists of references and predictions
        wer_score = WERCalculator.wer.compute(references=[reference], predictions=[hypothesis])
        
        return wer_score