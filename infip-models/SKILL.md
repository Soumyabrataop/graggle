---
name: infip-models
description: Manage and fetch models from the Infip API. Use to discover available models and update the local model.json.
---

# Infip Models Manager

This skill fetches the latest available models from the Infip API and stores them in `model.json`.

## Workflow

1.  **Fetch Models**: Run the fetch script to generate a key and pull the model list.
    ```bash
    python3 scripts/fetch_models.py
    ```
2.  **View Models**: Check the generated `model.json` for the list of available IDs.

## Features
- **Automatic Key Rotation**: Generates a fresh session key for each fetch.
- **OpenAI Compatible**: Connects to the `/v1/models` endpoint.
- **Config Ready**: The output `model.json` can be used to populate OpenClaw model providers.
