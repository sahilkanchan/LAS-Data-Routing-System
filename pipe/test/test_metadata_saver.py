import os
import tempfile
import pytest
from unittest.mock import patch, MagicMock
from DB_Util.MetadataSaver import save_metadata
import numpy as np

@pytest.fixture
def fake_metadata():
    return {
        1: [
            {
                "filename": "audio1.wav",
                "byte_size": 123456,
                "processing_time": 321,
                "feature_extraction_success": True,
                "feature_shape": (1, 768)
            },
            {
                "prediction": 2,
                "processing_time": 120,
                "x": 0.5,
                "y": 0.9
            },
            {
                "routing_time": 100,
                "subtask_model": "http://localhost:5000/transcribe",
                "delivery_time": 200,
                "fileWordErrorRate": 0.05,
                "transcriptionFilename": "transcriptions/STT_audio1.txt",
                "ground_truth": "audio1.txt"
            }
        ]
    }

@pytest.fixture
def fake_centroids():
    return np.array([[0.1, 0.2], [0.3, 0.4]])

@patch("DB_Util.MetadataSaver.connector.MySQLConnection")
@patch("DB_Util.MetadataSaver.os.getenv")
def test_save_metadata_success(mock_getenv, mock_mysql, fake_metadata, fake_centroids):
    # Mock DB credentials via environment variables.
    mock_getenv.side_effect = lambda key: {
        "DB_USERNAME": "user",
        "DB_PASSWORD": "pass",
        "DB_HOST": "localhost",
        "DB_PORT": "3306",
        "DB_DATABASE": "DataRoutingDB"
    }[key]

    # Create a mock connection and cursor.
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    # Ensure that close() and rollback() are tracked.
    mock_cursor.close = MagicMock()
    mock_conn.rollback = MagicMock()
    mock_conn.cursor.return_value = mock_cursor
    # Ensure connection is "connected" so that close() is triggered.
    mock_conn.is_connected.return_value = True
    mock_mysql.return_value = mock_conn

    # Simulate auto-increment IDs for Batch and Model.
    mock_cursor.fetchone.side_effect = [(10,), (20,)]

    save_metadata(fake_metadata, total_time=1000, model_name="mock_model.joblib", umap_coords=fake_centroids)

    # Check that an INSERT INTO Batch query was executed with expected parameters.
    batch_insert_found = any(
        "INSERT INTO Batch" in str(call_obj.args[0]) and call_obj.args[1][0] == len(fake_metadata) and call_obj.args[1][1] == 1000
        for call_obj in mock_cursor.execute.call_args_list
    )
    assert batch_insert_found, "INSERT INTO Batch call not found with expected values"

    # Verify centroid inserts (should be two records).
    centroid_calls = [call_obj for call_obj in mock_cursor.execute.call_args_list if "INSERT INTO Centroids" in call_obj.args[0]]
    assert len(centroid_calls) == 2, "Expected 2 centroid inserts"

    # Verify that per-file metadata inserts are done for InputProcessor and DataClassifier.
    input_processor_found = any("INSERT INTO InputProcessor" in call_obj.args[0] for call_obj in mock_cursor.execute.call_args_list)
    classifier_found = any("INSERT INTO DataClassifier" in call_obj.args[0] for call_obj in mock_cursor.execute.call_args_list)
    assert input_processor_found, "InputProcessor insert not found"
    assert classifier_found, "DataClassifier insert not found"

    # Verify that DataRouter insert includes the ground truth filename.
    data_router_insert = None
    for call_obj in mock_cursor.execute.call_args_list:
        if "INSERT INTO DataRouter" in call_obj.args[0]:
            data_router_insert = call_obj.args[1]
            break
    assert data_router_insert is not None, "DataRouter insert not found"
    # The 8th parameter (index 7) should match the ground truth key.
    assert data_router_insert[7] == "audio1.txt", "Ground truth key not properly inserted"

    assert mock_conn.commit.called, "Commit should be called when successful"
    assert mock_cursor.close.called, "Cursor's close() should be called"
    assert mock_conn.close.called, "Connection's close() should be called"

@patch("DB_Util.MetadataSaver.connector.MySQLConnection", side_effect=Exception("Connection error"))
@patch("DB_Util.MetadataSaver.os.getenv")
def test_save_metadata_connection_error(mock_getenv, mock_mysql, fake_metadata, fake_centroids):
    # Simulate DB connection error.
    mock_getenv.side_effect = lambda key: {
        "DB_USERNAME": "user",
        "DB_PASSWORD": "pass",
        "DB_HOST": "localhost",
        "DB_PORT": "3306",
        "DB_DATABASE": "DataRoutingDB"
    }[key]
    # Calling save_metadata should simply return without propagating the exception.
    save_metadata(fake_metadata, total_time=1000, model_name="mock_model.joblib", umap_coords=fake_centroids)
    # Since connection creation fails, no commit, rollback, or close can be tested here.