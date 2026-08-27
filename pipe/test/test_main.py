import sys
import os
import pytest
from unittest.mock import patch, MagicMock, mock_open
import pandas as pd

from main import (
    load_config,
    process_file,
    classify_file,
    route_data,
    run_batch,
    METADATA_DICT
)

@pytest.fixture
def mock_config():
    return {
        "csv_path": "dummy.csv",
        "bucket_name": "test-bucket",
        "model_path": "model.joblib",
        "aws_access_key_id": "fake_id",
        "aws_secret_access_key": "fake_secret",
        "subtask_models": {"speech": "http://localhost:5000/transcribe"}
    }

def test_load_config():
    fake_config = '{"csv_path": "test.csv"}'
    # Use mock_open from unittest.mock here.
    with patch("builtins.open", mock_open(read_data=fake_config)):
        config = load_config("fake_path.json")
        assert config["csv_path"] == "test.csv"

@patch("main.download_file_from_s3")
@patch("main.AudioProcessor")
@patch("boto3.client")
def test_process_file(mock_boto3_client, mock_processor_class, mock_download):
    mock_processor = MagicMock()
    mock_processor.process_audio_bytes.return_value = [1, 2, 3]
    mock_processor.get_analytics_data.return_value = {"duration": 3.5}
    mock_processor_class.return_value = mock_processor
    mock_download.return_value = b"audio_bytes"

    METADATA_DICT.clear()
    tensor, file_content, s3 = process_file(
        file_id=1,
        file_path="test.mp3",
        config={
            "bucket_name": "test-bucket",
            "aws_access_key_id": "id",
            "aws_secret_access_key": "secret"
        }
    )
    assert tensor == [1, 2, 3]
    assert METADATA_DICT[1][0]["duration"] == 3.5

@patch("main.AudioClassifier")
def test_classify_file(mock_classifier_class):
    mock_classifier = MagicMock()
    mock_classifier.classify_data.return_value = "speech"
    mock_classifier.get_classifier_data.return_value = {"confidence": 0.9}
    mock_classifier_class.return_value = mock_classifier
    METADATA_DICT.clear()
    METADATA_DICT[2] = [{}]
    result = classify_file(2, [1, 2, 3], model="mock_model", umap_transformer=None)
    assert result == "speech"
    assert METADATA_DICT[2][1]["confidence"] == 0.9

def fake_process_file(file_id, file_path, config):
    METADATA_DICT[file_id] = [{}, {}, {}]
    return ([0.1, 0.2], b"audio_data", MagicMock())

@patch("main.process_file", side_effect=fake_process_file)
@patch("main.classify_file", return_value="music")
@patch("main.route_data")
@patch("main.pd.read_csv")
@patch("main.os.path.isfile", return_value=True)
def test_run_batch_valid(mock_isfile, mock_read_csv, mock_route, mock_classify, mock_process):
    df_mock = MagicMock()
    df_mock.columns = ["Paths"]
    # Simulate a CSV with one valid path.
    df_mock.__getitem__.return_value.dropna.return_value.tolist.return_value = ["file1.mp3"]
    mock_read_csv.return_value = df_mock

    METADATA_DICT.clear()

    run_batch(
        config={
            "csv_path": "dummy.csv",
            "bucket_name": "test-bucket",
            "subtask_models": {"speech": "http://localhost:5000/transcribe"},
            "aws_access_key_id": "id",
            "aws_secret_access_key": "secret"
        },
        model="mock_model",
        umap_transformer=None
    )
    mock_process.assert_called_once()
    mock_classify.assert_called_once()
    mock_route.assert_called_once()

def test_run_batch_invalid_csv():
    # Test run_batch when the CSV file does not exist.
    METADATA_DICT.clear()
    with patch("main.os.path.isfile", return_value=False):
         # Call run_batch: since the file does not exist, it logs an error and returns.
         run_batch(
             config={"csv_path": "nonexistent.csv"},
             model="mock_model",
             umap_transformer=None
         )
         # Assert that METADATA_DICT remains empty.
         assert METADATA_DICT == {}

def test_run_batch_missing_paths_column():
    # Test run_batch when CSV exists but is missing the "Paths" column.
    METADATA_DICT.clear()
    with patch("main.os.path.isfile", return_value=True):
         df_mock = MagicMock()
         # Simulate CSV with the wrong column.
         df_mock.columns = ["NotPaths"]
         with patch("main.pd.read_csv", return_value=df_mock):
             run_batch(
                 config={
                     "csv_path": "dummy.csv",
                     "bucket_name": "test-bucket",
                     "subtask_models": {"speech": "http://localhost:5000/transcribe"},
                     "aws_access_key_id": "id",
                     "aws_secret_access_key": "secret"
                 },
                 model="mock_model",
                 umap_transformer=None
             )
             # When 'Paths' is missing, run_batch should log an error and do nothing.
             assert METADATA_DICT == {}
