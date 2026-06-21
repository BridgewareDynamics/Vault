# Third-Party Notices

The Vault includes third-party software and models subject to separate license terms.
Your rights to those components are governed by their respective licenses, not The Vault
Proprietary License. See [LICENSE](LICENSE) section 14.

## NVIDIA Parakeet ASR models (CC BY 4.0)

Transcription uses NVIDIA Parakeet automatic speech recognition models, including
`nvidia/parakeet-tdt-0.6b-v2` and `nvidia/parakeet-tdt-0.6b-v3`.

- **Copyright:** NVIDIA Corporation
- **License:** [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/)
- **Model cards:**
  - [parakeet-tdt-0.6b-v2](https://huggingface.co/nvidia/parakeet-tdt-0.6b-v2)
  - [parakeet-tdt-0.6b-v3](https://huggingface.co/nvidia/parakeet-tdt-0.6b-v3)
- **Full notice text:** [licenses/nvidia-parakeet-cc-by-4.0.txt](licenses/nvidia-parakeet-cc-by-4.0.txt)

Bundled or downloaded model weights include `MODEL_ATTRIBUTION.txt` beside the runtime
models directory when the transcription runtime is built.

## NVIDIA NeMo toolkit (Apache 2.0)

The bundled transcription runtime uses [NVIDIA NeMo](https://github.com/NVIDIA/NeMo) for
inference. NeMo is licensed under the Apache License 2.0.

## Other components

See [LICENSE](LICENSE) section 14 for PDF.js (Apache 2.0), Electron (MIT/BSD), Sharp
(Apache 2.0), FFmpeg in context builds (LGPL 2.1+), and other dependencies.
