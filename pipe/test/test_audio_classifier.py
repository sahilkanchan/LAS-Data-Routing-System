import numpy as np
import pytest
from unittest.mock import MagicMock
from DataClassifier.AudioClassifier import AudioClassifier
from DataClassifier import DataClassifier  # Used for monkeypatching in init error test

@pytest.fixture
def mock_model():
    """
    Fixture that creates a mock model with 'transform' and 'predict' methods.
    'transform' returns an array with three scores and 'predict' returns a single label.
    """
    mock = MagicMock()
    # When transforming the input tensor, simulate returning raw scores.
    mock.transform.return_value = np.array([[2.0, 1.0, 0.1]])
    # Simulate a prediction output.
    mock.predict.return_value = ["speech"]
    return mock

@pytest.fixture
def mock_umap():
    """
    Fixture that creates a mock UMAP transformer.
    'transform' simulates projecting features into 2D coordinates.
    """
    mock = MagicMock()
    mock.transform.return_value = np.array([[0.5, 0.7]])
    return mock

def test_classify_data_without_umap(mock_model):
    """
    Test classify_data method when no UMAP transformer is provided.
    Checks that the prediction and confidence scores are set, and that no UMAP coordinates are added.
    """
    classifier = AudioClassifier(model=mock_model)
    tensor = np.array([[0.1, 0.2, 0.3]])
    
    prediction = classifier.classify_data(tensor)
    data = classifier.get_classifier_data()

    assert prediction == "speech"
    assert data["prediction"] == "speech"
    # Confidence scores expected from softmax on 3 scores (keys 0, 1, 2).
    assert 0 in data and 1 in data and 2 in data
    # No UMAP coordinates should be present.
    assert "x" not in data
    assert "y" not in data

def test_classify_data_with_umap(mock_model, mock_umap):
    """
    Test classify_data method when a UMAP transformer is provided.
    Checks that the prediction, confidence scores, and UMAP coordinates are correctly populated.
    """
    classifier = AudioClassifier(model=mock_model, umap_transformer=mock_umap)
    tensor = np.array([[0.4, 0.6, 0.8]])
    
    prediction = classifier.classify_data(tensor)
    data = classifier.get_classifier_data()

    assert prediction == "speech"
    assert data["prediction"] == "speech"
    # Check that UMAP coordinates are added.
    assert data["x"] == 0.5
    assert data["y"] == 0.7

def test_classify_data_handles_exception(mock_model):
    """
    Test that classify_data properly handles exceptions raised during model transformation.
    In this case, the model's transform method is forced to raise an Exception.
    The test expects an exception to be raised and that classifier_data remains unchanged.
    """
    # Force an exception when transform is called.
    mock_model.transform.side_effect = Exception("transform failed")
    classifier = AudioClassifier(model=mock_model)
    tensor = np.array([[0.1, 0.2, 0.3]])
    
    with pytest.raises(Exception, match="transform failed"):
        classifier.classify_data(tensor)
    
    # Since the exception occurs before any update, classifier_data should remain empty.
    assert classifier.get_classifier_data() == {}

def test_classify_data_umap_error(mock_model, mock_umap):
    """
    Test that classify_data handles errors when the UMAP transformer fails.
    In this test, UMAP's transform method raises an exception.
    Partial data (prediction and confidence scores) should be stored, but UMAP keys should not.
    """
    # Ensure model works fine.
    mock_model.transform.return_value = np.array([[2.0, 1.0, 0.1]])
    mock_model.predict.return_value = ["speech"]
    # Force UMAP transformer to throw an exception.
    mock_umap.transform.side_effect = Exception("umap transform failed")
    
    classifier = AudioClassifier(model=mock_model, umap_transformer=mock_umap)
    tensor = np.array([[0.4, 0.6, 0.8]])
    
    with pytest.raises(Exception, match="umap transform failed"):
        classifier.classify_data(tensor)
    
    # Retrieve the classifier data; it should have prediction and confidence scores but not UMAP coordinates.
    data = classifier.get_classifier_data()
    assert data["prediction"] == "speech"
    # Expect three confidence score keys (from softmax on three values).
    for key in [0, 1, 2]:
        assert key in data
    # UMAP keys should not have been added because of the exception.
    assert "x" not in data
    assert "y" not in data

def test_get_classifier_data_error(mock_model):
    """
    Test get_classifier_data error handling.
    Manually corrupt classifier_data to a type without the copy() method to force an exception.
    """
    classifier = AudioClassifier(model=mock_model)
    # Corrupt classifier_data by setting it to an integer (which does not have a copy method).
    classifier.classifier_data = 42

    with pytest.raises(Exception):
        classifier.get_classifier_data()

