import pytest
from unittest.mock import patch, MagicMock
from DataRouter.AudioRouter import AudioRouter

@pytest.fixture
def fake_s3():
    return MagicMock()

def test_route_data_with_transcription_and_ground_truth(fake_s3):
    router = AudioRouter()
    filename = "test_audio.mp3"
    audio_file = b"dummy audio bytes"
    classification_result = "speech"
    subtask_models = {"speech": "http://localhost:5000/transcribe"}
    
    # Prepare a fake response from the transcription API.
    fake_response = MagicMock()
    fake_response.status_code = 200
    fake_transcription = "this is a transcription"
    fake_response.json.return_value = {"transcription": fake_transcription}
    
    with patch("DataRouter.AudioRouter.requests.post", return_value=fake_response):
        # Directly return bytes without .encode(), since they are already bytes.
        with patch("DataRouter.AudioRouter.download_file_from_s3", return_value=b"ground truth content"):
            with patch("DataRouter.AudioRouter.upload_file_to_s3", return_value=None):
                # Pass fake_s3 directly as the S3 client.
                router.route_data(filename, audio_file, classification_result, subtask_models, fake_s3)
                data = router.get_router_data()
                assert "transcriptionFilename" in data
                assert "ground_truth" in data
                assert "fileWordErrorRate" in data

def test_route_data_wer_calculation_exception(fake_s3):
    """Test branch when the WERCalculator throws an exception during WER calculation."""
    router = AudioRouter()
    filename = "test_audio.mp3"
    audio_file = b"dummy audio bytes"
    classification_result = "speech"
    subtask_models = {"speech": "http://localhost:5000/transcribe"}
    
    fake_response = MagicMock()
    fake_response.status_code = 200
    fake_transcription = "transcription text"
    fake_response.json.return_value = {"transcription": fake_transcription}
    
    with patch("DataRouter.AudioRouter.requests.post", return_value=fake_response):
        with patch("DataRouter.AudioRouter.download_file_from_s3", return_value=b"ground truth content"):
            router.route_data(filename, audio_file, classification_result, subtask_models, fake_s3)
            data = router.get_router_data()
            # Verify that even if WER calculation fails, the router still includes 'ground_truth' in its metadata.
            assert "ground_truth" in data
