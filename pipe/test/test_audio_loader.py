import os
import pytest
from unittest.mock import patch, MagicMock
from FileRetrieval.AudioLoader import (
    load_audio_file,
    load_audio_bytes,
    load_audio_local_file,
    load_audio_local_folder,
    get_s3_client,
    download_file_from_s3,
    upload_file_to_s3
)

##############################
# Tests for Audio Loading Functions
##############################

@patch("FileRetrieval.AudioLoader.AudioSegment.from_file")
@patch("FileRetrieval.AudioLoader.tempfile.NamedTemporaryFile")
def test_load_audio_file_success(mock_tempfile, mock_from_file):
    # Create a fake audio segment with non-target frame_rate/channels.
    mock_audio = MagicMock()
    mock_audio.frame_rate = 44100
    mock_audio.channels = 2
    # When converting, return the same object.
    mock_audio.set_frame_rate.return_value = mock_audio
    mock_audio.set_channels.return_value = mock_audio
    mock_from_file.return_value = mock_audio

    result = load_audio_file("fake_path.wav")
    assert result is mock_audio
    # Conversion must be applied to match target 16000 Hz and 1 channel.
    mock_audio.set_frame_rate.assert_called_with(16000)
    mock_audio.set_channels.assert_called_with(1)

@patch("FileRetrieval.AudioLoader.AudioSegment.from_mp3")
@patch("FileRetrieval.AudioLoader.tempfile.NamedTemporaryFile")
def test_load_audio_bytes_mp3(mock_tempfile, mock_from_mp3):
    # Setup a fake audio object for mp3.
    mock_audio = MagicMock()
    mock_audio.set_frame_rate.return_value = mock_audio
    mock_audio.set_channels.return_value = mock_audio
    mock_audio.export.return_value = None
    mock_from_mp3.return_value = mock_audio

    mock_temp_file = MagicMock()
    mock_temp_file.name = "temp.wav"
    mock_tempfile.return_value = mock_temp_file

    result_path = load_audio_bytes(b"fake_mp3_data", ".mp3")
    assert result_path == "temp.wav"
    mock_audio.export.assert_called_once()

@patch("FileRetrieval.AudioLoader.AudioSegment.from_file")
@patch("FileRetrieval.AudioLoader.tempfile.NamedTemporaryFile")
def test_load_audio_bytes_non_mp3(mock_tempfile, mock_from_file):
    # Test when file extension is not .mp3 (e.g. .wav).
    mock_audio = MagicMock()
    mock_audio.set_frame_rate.return_value = mock_audio
    mock_audio.set_channels.return_value = mock_audio
    mock_audio.export.return_value = None
    mock_from_file.return_value = mock_audio

    mock_temp_file = MagicMock()
    mock_temp_file.name = "temp.wav"
    mock_tempfile.return_value = mock_temp_file

    result_path = load_audio_bytes(b"fake_wav_data", ".wav")
    assert result_path == "temp.wav"
    # Assert that from_file was used (instead of from_mp3)
    mock_from_file.assert_called_once()
    mock_audio.export.assert_called_once()

@patch("FileRetrieval.AudioLoader.AudioSegment.from_file")
@patch("FileRetrieval.AudioLoader.tempfile.NamedTemporaryFile")
def test_load_audio_local_file(mock_tempfile, mock_from_file):
    mock_audio = MagicMock()
    mock_audio.set_frame_rate.return_value = mock_audio
    mock_audio.set_channels.return_value = mock_audio
    mock_audio.export.return_value = None
    mock_from_file.return_value = mock_audio

    mock_temp_file = MagicMock()
    mock_temp_file.name = "temp.wav"
    mock_tempfile.return_value = mock_temp_file

    result_path = load_audio_local_file("file.mp3")
    assert result_path == "temp.wav"
    mock_audio.export.assert_called_once()

@patch("FileRetrieval.AudioLoader.os.listdir", return_value=["file1.wav", "file2.wav"])
@patch("FileRetrieval.AudioLoader.os.path.isfile", return_value=True)
@patch("FileRetrieval.AudioLoader.load_audio_local_file", return_value="temp.wav")
def test_load_audio_local_folder(mock_loader, mock_isfile, mock_listdir):
    result = load_audio_local_folder("mock_folder")
    assert result == ["temp.wav", "temp.wav"]
    assert mock_loader.call_count == 2

@patch("FileRetrieval.AudioLoader.AudioSegment.from_file", side_effect=Exception("load error"))
def test_load_audio_file_failure(mock_from_file):
    with pytest.raises(Exception, match="load error"):
        load_audio_file("non_existent_file.wav")

##############################
# Tests for S3 Utility Functions
##############################

@patch("FileRetrieval.AudioLoader.boto3.client")
def test_get_s3_client(mock_boto3_client):
    mock_client = MagicMock()
    mock_boto3_client.return_value = mock_client
    client = get_s3_client("fake_access_key", "fake_secret_key")
    assert client is mock_client
    mock_boto3_client.assert_called_with(
        's3',
        aws_access_key_id="fake_access_key",
        aws_secret_access_key="fake_secret_key"
    )

@patch("FileRetrieval.AudioLoader.boto3.client")
def test_download_file_from_s3(mock_boto3_client):
    mock_s3 = MagicMock()
    mock_boto3_client.return_value = mock_s3
    mock_response = {"Body": MagicMock(read=MagicMock(return_value=b"file_content"))}
    mock_s3.get_object.return_value = mock_response

    result = download_file_from_s3("test-bucket", "file.mp3", mock_s3)
    assert result == b"file_content"
    mock_s3.get_object.assert_called_with(Bucket="test-bucket", Key="file.mp3")

@patch("FileRetrieval.AudioLoader.boto3.client")
def test_upload_file_to_s3_success(mock_boto3_client):
    mock_s3 = MagicMock()
    # Call the function; no exception should be raised.
    upload_file_to_s3("local_file.wav", "test_bucket", "file_key", mock_s3)
    mock_s3.upload_file.assert_called_with("local_file.wav", "test_bucket", "file_key")

@patch("FileRetrieval.AudioLoader.boto3.client")
def test_upload_file_to_s3_failure(mock_boto3_client):
    mock_s3 = MagicMock()
    mock_s3.upload_file.side_effect = Exception("upload error")
    with pytest.raises(Exception, match="upload error"):
        upload_file_to_s3("local_file.wav", "test_bucket", "file_key", mock_s3)
