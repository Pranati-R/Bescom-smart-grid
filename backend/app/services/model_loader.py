"""
Centralized ML Model Loader
===========================
Auto-detects and loads trained models from backend/models/ directory.
Supports: .pth (PyTorch), .pkl (scikit-learn), .joblib, .h5/.keras (Keras), .onnx
Gracefully handles missing or corrupt models — never crashes the server.
"""

import os
import logging
from pathlib import Path
from typing import Dict, Any, Optional

logger = logging.getLogger("gridshield.model_loader")

# Resolve model directory: backend/models/
# __file__ = backend/app/services/model_loader.py  → parents[2] = backend/
MODELS_DIR = Path(__file__).parents[2] / "models"


class ModelRegistry:
    """Holds loaded model instances with metadata."""

    def __init__(self):
        self._models: Dict[str, Any] = {}
        self._meta: Dict[str, dict] = {}

    def register(self, name: str, model: Any, meta: dict):
        self._models[name] = model
        self._meta[name] = meta
        logger.info(f"✅ Model registered: {name}")

    def get(self, name: str) -> Optional[Any]:
        return self._models.get(name)

    def is_loaded(self, name: str) -> bool:
        return name in self._models and self._models[name] is not None

    def health(self) -> dict:
        status = {}
        for name, meta in self._meta.items():
            status[name] = {
                "loaded": self.is_loaded(name),
                "type": meta.get("type", "unknown"),
                "path": meta.get("path", ""),
                "size_bytes": meta.get("size_bytes", 0),
            }
        return status

    def list_models(self) -> list:
        return list(self._meta.keys())


class ModelLoader:
    """
    Scans the models directory and loads all supported model files.
    Mapping of filename stem → model name used throughout the inference service.

    Expected file names (place in backend/models/):
        best_forecast_model.pth    → TFTModel (demand forecasting)
        best_theft_model.pth       → TheftTransformer (theft detection)
        best_gnn_model.pth         → GATModel (peer/graph intelligence)
        anomaly_detector.pkl       → scikit-learn anomaly model
        transformer_overload.pkl   → overload predictor
        demand_forecast.h5         → Keras LSTM forecast model
    """

    MODEL_MAP = {
        "best_forecast_model": "forecast",
        "best_theft_model": "theft",
        "best_gnn_model": "gnn",
        "anomaly_detector": "anomaly",
        "transformer_overload": "overload",
        "demand_forecast": "forecast_keras",
        "risk_scorer": "risk",
    }

    def __init__(self):
        self.registry = ModelRegistry()
        self._torch_available = False
        self._sklearn_available = False
        self._tf_available = False
        self._onnx_available = False

    def _check_dependencies(self):
        """Silently check which ML libraries are available."""
        try:
            import torch
            self._torch_available = True
            logger.info("PyTorch available")
        except ImportError:
            logger.warning("PyTorch not installed — .pth models will not load")

        try:
            import joblib
            self._sklearn_available = True
            logger.info("scikit-learn/joblib available")
        except ImportError:
            logger.warning("joblib not installed — .pkl/.joblib models will not load")

        try:
            import tensorflow  # noqa
            self._tf_available = True
            logger.info("TensorFlow/Keras available")
        except ImportError:
            logger.warning("TensorFlow not installed — .h5/.keras models will not load")

        try:
            import onnxruntime  # noqa
            self._onnx_available = True
            logger.info("ONNX Runtime available")
        except ImportError:
            logger.warning("onnxruntime not installed — .onnx models will not load")

    def _load_pytorch(self, path: Path, model_name: str):
        """Load a PyTorch state_dict and rebuild the model architecture."""
        try:
            import torch
            import sys

            # Add the models directory to sys.path so we can import architecture classes
            models_dir = str(MODELS_DIR)
            if models_dir not in sys.path:
                sys.path.insert(0, models_dir)

            state_dict = torch.load(str(path), map_location=torch.device("cpu"), weights_only=True)

            # Determine architecture from model name
            model_obj = None
            if "forecast" in model_name:
                try:
                    from bescom_models import TFTModel
                    # Infer input_size from state dict
                    first_key = next(iter(state_dict))
                    input_size = state_dict[first_key].shape[-1] if len(state_dict[first_key].shape) > 1 else 1
                    model_obj = TFTModel(input_size=input_size)
                    model_obj.load_state_dict(state_dict)
                    model_obj.eval()
                except Exception as arch_err:
                    logger.warning(f"Could not reconstruct TFTModel: {arch_err}")

            elif "theft" in model_name:
                try:
                    from bescom_models import TheftTransformer
                    model_obj = TheftTransformer()
                    model_obj.load_state_dict(state_dict)
                    model_obj.eval()
                except Exception as arch_err:
                    logger.warning(f"Could not reconstruct TheftTransformer: {arch_err}")

            elif "gnn" in model_name:
                try:
                    from bescom_models import GATModel
                    model_obj = GATModel()
                    model_obj.load_state_dict(state_dict)
                    model_obj.eval()
                except Exception as arch_err:
                    logger.warning(f"Could not reconstruct GATModel: {arch_err}")

            if model_obj is not None:
                return model_obj
            else:
                # Return raw state dict as fallback — can be used for metadata
                logger.warning(f"Returning raw state_dict for {model_name} (no architecture match)")
                return {"state_dict": state_dict, "raw": True}

        except Exception as e:
            logger.error(f"Failed to load PyTorch model {path.name}: {e}")
            return None

    def _load_sklearn(self, path: Path):
        """Load a scikit-learn or joblib model."""
        try:
            import joblib
            return joblib.load(str(path))
        except Exception as e:
            logger.error(f"Failed to load sklearn model {path.name}: {e}")
            return None

    def _load_keras(self, path: Path):
        """Load a Keras/TF model."""
        try:
            import tensorflow as tf
            return tf.keras.models.load_model(str(path))
        except Exception as e:
            logger.error(f"Failed to load Keras model {path.name}: {e}")
            return None

    def _load_onnx(self, path: Path):
        """Load an ONNX model for inference."""
        try:
            import onnxruntime as ort
            return ort.InferenceSession(str(path))
        except Exception as e:
            logger.error(f"Failed to load ONNX model {path.name}: {e}")
            return None

    def load_all(self):
        """
        Scan MODELS_DIR and load all recognized model files.
        Safe — never raises, always continues on errors.
        """
        self._check_dependencies()

        if not MODELS_DIR.exists():
            logger.warning(f"Models directory not found: {MODELS_DIR}")
            return

        logger.info(f"Scanning models directory: {MODELS_DIR}")

        supported_extensions = {".pth", ".pt", ".pkl", ".joblib", ".h5", ".keras", ".onnx"}

        for path in MODELS_DIR.iterdir():
            if not path.is_file():
                continue  # Skip directories (e.g., partially saved pth folders)
            if path.suffix not in supported_extensions:
                continue

            stem = path.stem
            model_name = self.MODEL_MAP.get(stem, stem.replace("-", "_"))

            logger.info(f"Loading: {path.name} → '{model_name}'")

            model = None
            size_bytes = path.stat().st_size

            if path.suffix in (".pth", ".pt"):
                if self._torch_available:
                    model = self._load_pytorch(path, model_name)
            elif path.suffix in (".pkl", ".joblib"):
                if self._sklearn_available:
                    model = self._load_sklearn(path)
            elif path.suffix in (".h5", ".keras"):
                if self._tf_available:
                    model = self._load_keras(path)
            elif path.suffix == ".onnx":
                if self._onnx_available:
                    model = self._load_onnx(path)

            self.registry.register(
                name=model_name,
                model=model,
                meta={
                    "type": path.suffix,
                    "path": str(path),
                    "size_bytes": size_bytes,
                    "loaded": model is not None,
                }
            )

        loaded_count = sum(1 for m in self.registry._meta.values() if m.get("loaded"))
        logger.info(f"Model loading complete: {loaded_count}/{len(self.registry._meta)} models loaded")


# Singleton instance — imported and initialized at startup
model_loader = ModelLoader()
