from __future__ import annotations

import asyncio
import contextlib
import io
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path
from types import SimpleNamespace
from typing import Iterator, Optional


def _resolve_repo_root() -> Path:
    return Path(__file__).resolve().parents[3]


REPO_ROOT = _resolve_repo_root()
CONTEXT_ROOT = Path(
    os.environ.get(
        "VAULT_TRANSCRIPTION_CONTEXT_ROOT",
        str(REPO_ROOT / "context" / "Elegant-Transcriber-main"),
    )
)
BUNDLED_MODELS_ROOT = Path(
    os.environ.get(
        "VAULT_TRANSCRIPTION_BUNDLED_MODELS_DIR",
        str(CONTEXT_ROOT / "models"),
    )
)
USER_MODELS_ROOT = Path(
    os.environ.get(
        "VAULT_TRANSCRIPTION_USER_MODELS_DIR",
        str(REPO_ROOT / "electron" / "transcription" / "python" / "models"),
    )
)
RUNTIME_MODE = os.environ.get("VAULT_TRANSCRIPTION_RUNTIME_MODE", "source")
LOCAL_ONLY_RESOLUTION = (
    os.environ.get("VAULT_TRANSCRIPTION_LOCAL_ONLY_RESOLUTION", "1").lower()
    not in {"0", "false", "no"}
)
PARAKEET_V3_LOCAL_DIR = os.environ.get("VAULT_TRANSCRIPTION_PARAKEET_V3_DIR")
HUB_OFFLINE_ENV_KEYS = ("HF_HUB_OFFLINE", "TRANSFORMERS_OFFLINE")
NEMO_MODEL_URLS = {
    "nvidia/parakeet-tdt-0.6b-v2": (
        "https://huggingface.co/nvidia/parakeet-tdt-0.6b-v2/resolve/main/"
        "parakeet-tdt-0.6b-v2.nemo"
    ),
    "nvidia/parakeet-tdt-0.6b-v3": (
        "https://huggingface.co/nvidia/parakeet-tdt-0.6b-v3/resolve/main/"
        "parakeet-tdt-0.6b-v3.nemo"
    ),
}

os.environ.setdefault("HF_HUB_DISABLE_TELEMETRY", "1")
if LOCAL_ONLY_RESOLUTION:
    os.environ.setdefault("HF_HUB_OFFLINE", "1")
    os.environ.setdefault("TRANSFORMERS_OFFLINE", "1")

if str(CONTEXT_ROOT) not in sys.path:
    sys.path.insert(0, str(CONTEXT_ROOT))

import torch
import uvicorn
from fastapi import HTTPException
from pydantic import BaseModel

import download_model as source_download_model


def _patched_get_models_dir() -> Path:
    USER_MODELS_ROOT.mkdir(parents=True, exist_ok=True)
    return USER_MODELS_ROOT


def _get_local_model_path_for_root(repo_id: str, root: Path):
    if repo_id not in source_download_model.MODELS:
        return None

    org, name = repo_id.split("/", 1)
    filename = source_download_model.MODELS[repo_id]
    if filename:
        return root / org / name / filename
    return root / org / name


def _patched_get_local_model_path(repo_id: str):
    return _get_local_model_path_for_root(repo_id, _patched_get_models_dir())


def _find_local_model_in_root(repo_id: str, root: Path):
    local_path = _get_local_model_path_for_root(repo_id, root)
    if local_path is None:
        return None

    filename = source_download_model.MODELS.get(repo_id)
    if filename:
        if local_path.is_file():
            return str(local_path)
    else:
        if local_path.is_dir() and (local_path / "config.json").is_file():
            return str(local_path)
    return None


def _find_extra_local_model(repo_id: str):
    local_dir = EXTRA_MODEL_DIRECTORIES.get(repo_id)
    if local_dir and local_dir.exists() and (local_dir / "config.json").is_file():
        return str(local_dir)
    return None


def _get_model_storage_status(repo_id: str):
    bundled_path = _find_local_model_in_root(repo_id, BUNDLED_MODELS_ROOT)
    if bundled_path is None:
        bundled_path = _find_extra_local_model(repo_id)
    cache_path = _find_local_model_in_root(repo_id, USER_MODELS_ROOT)
    active_path = bundled_path or cache_path
    return {
        "bundled": bundled_path is not None,
        "bundled_path": bundled_path,
        "cached": active_path is not None,
        "cache_path": cache_path or active_path,
        "active_path": active_path,
    }


def _patched_find_local_model(repo_id: str):
    return _get_model_storage_status(repo_id)["active_path"]


source_download_model.get_models_dir = _patched_get_models_dir
source_download_model.get_local_model_path = _patched_get_local_model_path
source_download_model.find_local_model = _patched_find_local_model

from config.server_settings import TranscriptionSettings
from core.models.metadata import ModelMetadata
import core.models.manager as source_model_manager
from core.models.manager import ModelManager
from core.server.api_server import (
    WorkItem,
    _build_settings,
    _load_audio_from_file,
    _state,
    create_app,
    set_app_state,
)
logger = source_model_manager.logger

DEFAULT_MODEL_NAME = "Parakeet TDT 0.6B v3"
FALLBACK_MODEL_NAME = "Parakeet TDT 0.6B v2"
DEFAULT_PRECISION = "float32"


def _default_extra_model_directories() -> dict[str, Path]:
    result: dict[str, Path] = {}
    candidates = []

    if PARAKEET_V3_LOCAL_DIR:
        candidates.append(Path(PARAKEET_V3_LOCAL_DIR))

    candidates.append(REPO_ROOT / "electron" / "transcription" / "models" / "parakeet-v3")
    candidates.append(REPO_ROOT / "context" / "parakeet")

    for candidate in candidates:
        if (candidate / "config.json").is_file() and (candidate / "model.safetensors").is_file():
            result["nvidia/parakeet-tdt-0.6b-v3"] = candidate
            break

    return result


EXTRA_MODEL_DIRECTORIES = _default_extra_model_directories()


def _build_missing_model_error(model_id: str) -> RuntimeError:
    return RuntimeError(
        "Selected model is not installed locally. Download it from the Vault "
        "transcription workspace while online, or restore the bundled runtime."
    )


def _patched_get_remote_nemo_size(model_id: str) -> int:
    if LOCAL_ONLY_RESOLUTION:
        return 0
    return _original_get_remote_nemo_size(model_id)


@contextlib.contextmanager
def _hub_online_context() -> Iterator[None]:
    saved = {key: os.environ.get(key) for key in HUB_OFFLINE_ENV_KEYS}
    for key in HUB_OFFLINE_ENV_KEYS:
        os.environ[key] = "0"
    try:
        yield
    finally:
        for key, value in saved.items():
            if LOCAL_ONLY_RESOLUTION and value is None:
                os.environ[key] = "1"
            elif value is None:
                os.environ.pop(key, None)
            else:
                os.environ[key] = value


def _download_http_file(url: str, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    partial_path = destination.with_suffix(f"{destination.suffix}.part")
    request = urllib.request.Request(
        url,
        headers={"User-Agent": "VaultTranscription/1.0"},
    )

    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            total_bytes = int(response.headers.get("Content-Length", "0") or 0)
            downloaded = 0
            chunk_size = 1024 * 1024
            with partial_path.open("wb") as handle:
                while True:
                    chunk = response.read(chunk_size)
                    if not chunk:
                        break
                    handle.write(chunk)
                    downloaded += len(chunk)
                    if total_bytes > 0 and downloaded % (64 * chunk_size) < chunk_size:
                        pct = min(100, int((downloaded / total_bytes) * 100))
                        print(
                            f"[TranscriptionEngine] Downloading model: {pct}%",
                            flush=True,
                        )
    except urllib.error.URLError as error:
        if partial_path.exists():
            partial_path.unlink()
        raise RuntimeError(f"Failed to download model from {url}: {error}") from error

    if not partial_path.exists() or partial_path.stat().st_size <= 0:
        raise RuntimeError(f"Download from {url} did not produce a file.")

    partial_path.replace(destination)


def _vault_download_model(model_id: str) -> str:
    if model_id not in source_download_model.MODELS:
        raise ValueError(f"Unknown model: {model_id}")

    existing = _patched_find_local_model(model_id)
    if existing:
        return existing

    filename = source_download_model.MODELS.get(model_id)
    local_path = _patched_get_local_model_path(model_id)
    if local_path is None:
        raise ValueError(f"Unknown model: {model_id}")

    if filename:
        if local_path.is_file():
            return str(local_path)

        direct_url = NEMO_MODEL_URLS.get(model_id)
        if direct_url:
            print(
                f"[TranscriptionEngine] Downloading {model_id}/{filename} to {local_path.parent}",
                flush=True,
            )
            _download_http_file(direct_url, local_path)
            if local_path.is_file():
                size_mb = local_path.stat().st_size / 1024 / 1024
                print(
                    f"[TranscriptionEngine] Model cached at: {local_path} ({size_mb:.1f} MB)",
                    flush=True,
                )
                return str(local_path)

        with _hub_online_context():
            from huggingface_hub import hf_hub_download

            print(
                f"[TranscriptionEngine] Downloading {model_id}/{filename} via Hugging Face Hub",
                flush=True,
            )
            hf_hub_download(
                repo_id=model_id,
                filename=filename,
                local_dir=str(local_path.parent),
                local_files_only=False,
                force_download=True,
            )

        if local_path.is_file():
            return str(local_path)
        raise RuntimeError(f"Download completed but file not found at {local_path}")

    with _hub_online_context():
        return source_download_model.download_model(model_id)


def _patched_download_model_sync(model_id: str):
    if LOCAL_ONLY_RESOLUTION:
        raise _build_missing_model_error(model_id)
    return _original_download_model_sync(model_id)


def _patched_thread_download(self, model_id: str):
    if LOCAL_ONLY_RESOLUTION:
        raise _build_missing_model_error(model_id)
    return _original_thread_download(self, model_id)


class _TransformersParakeetAdapter:
    def __init__(self, model, processor) -> None:
        self.model = model
        self.processor = processor
        self.device = getattr(model, "device", "cpu")
        self.dtype = getattr(model, "dtype", torch.float32)
        self.sample_rate = getattr(
            getattr(processor, "feature_extractor", None), "sampling_rate", 16000
        )

    def transcribe(
        self,
        audio_batches,
        batch_size: int = 1,
        timestamps: bool = False,
        return_hypotheses: bool = False,
        verbose: bool = False,
    ):
        results = []
        for audio in audio_batches:
            inputs = self.processor(
                [audio],
                sampling_rate=self.sample_rate,
                return_tensors="pt",
            )
            if hasattr(inputs, "to"):
                try:
                    inputs = inputs.to(self.model.device, dtype=self.model.dtype)
                except TypeError:
                    inputs = inputs.to(self.model.device)

            output = self.model.generate(**inputs, return_dict_in_generate=True)
            decoded = self.processor.decode(
                output.sequences.cpu(),
                skip_special_tokens=True,
            )
            text = decoded[0] if isinstance(decoded, (list, tuple)) else decoded
            text = str(text).strip()

            if return_hypotheses or timestamps:
                results.append(SimpleNamespace(text=text, timestamp=None))
            else:
                results.append(text)

        return results


def _patched_load_parakeet_model(local_path: str, device: str, torch_dtype):
    local_dir = Path(local_path)
    if local_dir.is_dir() and (local_dir / "config.json").is_file():
        with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
            from transformers import AutoModelForTDT, AutoProcessor

        logger.info(f"Loading local Transformers Parakeet model from {local_path}")
        processor = AutoProcessor.from_pretrained(
            local_path,
            local_files_only=LOCAL_ONLY_RESOLUTION,
        )
        model = AutoModelForTDT.from_pretrained(
            local_path,
            dtype=torch_dtype if device == "cuda" else torch.float32,
            device_map=device,
            local_files_only=LOCAL_ONLY_RESOLUTION,
        )
        model.eval()
        return _TransformersParakeetAdapter(model, processor)

    return _original_load_parakeet_model(local_path, device, torch_dtype)


_original_get_remote_nemo_size = source_model_manager._get_remote_nemo_size
_original_download_model_sync = source_model_manager._download_model_sync
_original_thread_download = source_model_manager._ModelLoaderThread._download
_original_load_parakeet_model = source_model_manager._load_parakeet_model
source_model_manager._get_remote_nemo_size = _patched_get_remote_nemo_size
source_model_manager._download_model_sync = _patched_download_model_sync
source_model_manager._ModelLoaderThread._download = _patched_thread_download
source_model_manager._load_parakeet_model = _patched_load_parakeet_model


class TranscribePathRequest(BaseModel):
    file_path: str
    model: Optional[str] = None
    precision: Optional[str] = None
    device: Optional[str] = None
    output_format: Optional[str] = None
    word_timestamps: Optional[bool] = None
    segment_length: Optional[int] = None
    segment_duration: Optional[int] = None


class DownloadModelRequest(BaseModel):
    model_id: str


def _build_default_settings() -> TranscriptionSettings:
    device = "cuda" if torch.cuda.is_available() else "cpu"
    default_model_name = (
        DEFAULT_MODEL_NAME
        if _is_model_ready(DEFAULT_MODEL_NAME)
        else FALLBACK_MODEL_NAME
        if _is_model_ready(FALLBACK_MODEL_NAME)
        else DEFAULT_MODEL_NAME
    )
    model_key = f"{default_model_name} - {DEFAULT_PRECISION}"
    return TranscriptionSettings(
        model_key=model_key,
        device=device,
        segment_length=90,
        segment_duration=10,
        output_format="json",
        word_timestamps=True,
        recursive=False,
        selected_extensions=[],
    )


def _is_model_ready(model_name: str) -> bool:
    model_id = ModelMetadata.get_model_id(model_name)
    if not model_id:
        return False
    return _patched_find_local_model(model_id) is not None


def build_app():
    model_manager = ModelManager()
    default_settings = _build_default_settings()
    set_app_state(model_manager=model_manager, default_settings=default_settings)
    app = create_app()

    @app.get("/vault/engine-info")
    async def engine_info():
        return {
            "context_root": str(CONTEXT_ROOT),
            "python_executable": sys.executable,
            "device_default": default_settings.device,
            "cuda_built": torch.version.cuda is not None,
            "cuda_available": torch.cuda.is_available(),
            "model_default": default_settings.model_key,
            "bundled_models_dir": str(BUNDLED_MODELS_ROOT),
            "user_models_dir": str(USER_MODELS_ROOT),
            "local_only_resolution": LOCAL_ONLY_RESOLUTION,
            "runtime_mode": RUNTIME_MODE,
            "default_model_ready": _is_model_ready(default_settings.model_key.split(" - ")[0]),
        }

    @app.get("/vault/models")
    async def vault_models():
        registry = ModelMetadata.get_all_models_with_precisions()
        result = {}
        for key, info in registry.items():
            storage = _get_model_storage_status(info["model_id"])
            result[key] = {
                "name": info["name"],
                "model_id": info["model_id"],
                "precision": info["precision"],
                "model_type": info["model_type"],
                "avg_vram_usage": info["avg_vram_usage"],
                "default_segment_length": info["default_segment_length"],
                "supports_timestamps": info["model_type"] != "canary",
                "bundled": storage["bundled"],
                "bundled_path": storage["bundled_path"],
                "cached": storage["cached"],
                "cache_path": storage["cache_path"],
                "installable": info["model_id"] in source_download_model.MODELS,
            }
        return result

    @app.post("/vault/download-model")
    async def download_model_endpoint(request: DownloadModelRequest):
        model_id = request.model_id.strip()
        if not model_id:
            raise HTTPException(status_code=400, detail="model_id is required")

        try:
            path = await asyncio.to_thread(_vault_download_model, model_id)
        except ValueError as error:
            raise HTTPException(status_code=400, detail=str(error)) from error
        except Exception as error:
            raise HTTPException(
                status_code=500,
                detail=f"Model download failed: {error}",
            ) from error

        storage = _get_model_storage_status(model_id)
        return {
            "model_id": model_id,
            "path": path,
            "bundled": storage["bundled"],
            "cached": storage["cached"],
            "cache_path": storage["cache_path"],
            "bundled_path": storage["bundled_path"],
        }

    @app.post("/vault/transcribe-path")
    async def transcribe_path(request: TranscribePathRequest):
        file_path = Path(request.file_path)
        if not file_path.exists() or not file_path.is_file():
            raise HTTPException(status_code=404, detail="Source file not found")

        try:
            audio = _load_audio_from_file(str(file_path))
        except Exception as error:
            raise HTTPException(
                status_code=400,
                detail=f"Failed to decode media file: {error}",
            ) from error

        try:
            settings, model_info = _build_settings(
                request.model,
                request.precision,
                request.device,
                request.output_format,
                request.word_timestamps,
                request.segment_length,
                request.segment_duration,
            )
        except ValueError as error:
            raise HTTPException(status_code=400, detail=str(error)) from error

        model_id = model_info.get("model_id")
        if model_id and _patched_find_local_model(model_id) is None:
            raise HTTPException(status_code=409, detail=str(_build_missing_model_error(model_id)))

        if _state.queue is None:
            raise HTTPException(status_code=503, detail="Transcription queue not ready")

        _state.cancel_event.clear()
        loop = asyncio.get_event_loop()
        future = loop.create_future()
        item = WorkItem(
            audio=audio,
            settings=settings,
            model_info=model_info,
            future=future,
        )

        await _state.queue.put(item)

        try:
            return await future
        except RuntimeError as error:
            raise HTTPException(status_code=503, detail=str(error)) from error
        except Exception as error:
            raise HTTPException(
                status_code=500,
                detail=f"Transcription failed: {error}",
            ) from error

    @app.post("/vault/cancel")
    async def cancel_transcription():
        _state.cancel_event.set()
        return {"cancelled": True}

    return app


def main():
    host = os.environ.get("VAULT_TRANSCRIPTION_HOST", "127.0.0.1")
    port = int(os.environ.get("VAULT_TRANSCRIPTION_PORT", "8765"))
    app = build_app()
    uvicorn.run(app, host=host, port=port, log_level="warning", access_log=False)


if __name__ == "__main__":
    main()
