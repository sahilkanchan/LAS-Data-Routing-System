import pytest
import numpy as np
import torch
from unittest.mock import patch, MagicMock
from contextlib import nullcontext
from InputProcessor.AudioProcessor import AudioProcessor

@pytest.fixture
def processor():
    # Patch out Wav2Vec2Processor and Wav2Vec2Model loading so that AudioProcessor initializes properly.
    from InputProcessor.AudioProcessor import Wav2Vec2Processor, Wav2Vec2Model
    with patch.object(Wav2Vec2Processor, 'from_pretrained', return_value=MagicMock()), \
         patch.object(Wav2Vec2Model, 'from_pretrained', return_value=MagicMock()):
        yield AudioProcessor()

@patch("InputProcessor.AudioProcessor.AudioSegment")
def test_validate_input_valid(mock_audio_segment, processor):
    mock_audio = MagicMock()
    mock_audio.frame_rate = 16000
    mock_audio.channels = 1
    mock_audio.__len__.return_value = 2000  
    mock_audio_segment.from_wav.return_value = mock_audio

    result = processor.validate_input("valid.wav")
    analytics = processor.get_analytics_data()
    assert result is True
    assert analytics["validation_status"] is True

@patch("InputProcessor.AudioProcessor.AudioSegment.from_wav")
def test_validate_input_invalid_sample_rate(mock_from_wav, processor):
    mock_audio = MagicMock()
    mock_audio.frame_rate = 44100
    mock_audio.channels = 1
    mock_audio.__len__.return_value = 2000
    mock_from_wav.return_value = mock_audio

    result = processor.validate_input("bad.wav")
    analytics = processor.get_analytics_data()
    assert result is False
    assert analytics["validation_status"] is False

def test_process_input_success(processor):
    # Mark input as valid.
    processor.processor_data["validation_status"] = True
    dummy_audio = np.random.rand(16000).astype(np.float32)
    dummy_feature = np.array([[0.1] * 768])
    # Set up fake model inference chain:
    # Create a dummy chain for model inference:
    #  processor.model() returns an object whose .last_hidden_state.mean(dim=1).detach().numpy() returns dummy_feature.
    fake_inference = MagicMock()
    fake_inference.last_hidden_state = MagicMock(
        mean=lambda dim: MagicMock(
            detach=lambda: MagicMock(
                numpy=lambda: dummy_feature
            )
        )
    )
    processor.model = MagicMock(return_value=fake_inference)
    # Simulate processor's internal tokenization step (if called)
    processor.processor.__call__ = MagicMock(return_value=MagicMock(input_values=torch.tensor([[1.0] * 10])))
    with patch("InputProcessor.AudioProcessor.librosa.load", return_value=(dummy_audio, 16000)), \
         patch("InputProcessor.AudioProcessor.torch.no_grad", return_value=nullcontext()):
         out = processor.process_input("some.wav")
         assert isinstance(out, np.ndarray)
         # Expect the dummy feature to be returned.
         assert out.shape == (1, 768)
         analytics = processor.get_analytics_data()
         assert analytics["feature_extraction_success"] is True

def test_process_input_inference_failure(processor):
    # Mark input as valid.
    processor.processor_data["validation_status"] = True
    dummy_audio = np.random.rand(16000).astype(np.float32)
    with patch("InputProcessor.AudioProcessor.librosa.load", return_value=(dummy_audio, 16000)), \
         patch("InputProcessor.AudioProcessor.torch.no_grad", return_value=nullcontext()):
         # Set processor.model to raise an exception when called.
         processor.model = MagicMock(side_effect=Exception("model error"))
         # Instead of expecting an exception, we assume the code catches it and returns an empty array.
         out = processor.process_input("fail_inference.wav")
         assert isinstance(out, np.ndarray)
         assert out.size == 0
         analytics = processor.get_analytics_data()
         # Assuming that on error, feature extraction is marked as unsuccessful.
         assert analytics.get("feature_extraction_success") in (False, None)

def test_process_audio_bytes_validation_fail(processor):
    processor.processor_data = {}
    with patch("InputProcessor.AudioProcessor.load_audio_bytes", return_value="temp.wav"), \
         patch.object(processor, "validate_input", return_value=False):
         out = processor.process_audio_bytes(b"fake", ".mp3", "orig.mp3")
         assert isinstance(out, np.ndarray)
         assert out.shape == (0,)
         analytics = processor.get_analytics_data()
         assert analytics.get("feature_extraction_success") in (False, None)

def test_process_audio_file_validation_fail(processor):
    processor.processor_data = {}
    with patch("InputProcessor.AudioProcessor.load_audio_local_file", return_value="temp.wav"), \
         patch.object(processor, "validate_input", return_value=False):
         out = processor.process_audio_file("local.wav")
         assert isinstance(out, np.ndarray)
         assert out.shape == (0,)
         analytics = processor.get_analytics_data()
         assert analytics.get("feature_extraction_success") in (False, None)

def test_get_analytics_data_returns_copy(processor):
    processor.processor_data = {"filename": "test.wav", "byte_size": 12345}
    data = processor.get_analytics_data()
    assert data == {"filename": "test.wav", "byte_size": 12345}
    assert data is not processor.processor_data
