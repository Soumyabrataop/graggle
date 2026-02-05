---
name: infip-image-gen
description: Generate high-quality images using the Infip API. Use when the user requests image generation.
---

# Infip Image Generation

This skill uses the Infip API to generate images from text prompts with dynamic model selection.

## Workflow

1.  **Extract Prompt**: Identify the user's desired image description.
2.  **Select Model**: 
    - Read `scripts/models.json` for the available model list.
    - Present the models to the user as **inline buttons** using the `message` tool.
    - The `callback_data` for each button should be formatted as: `generate_infip_image <model_name> <prompt>`.
3.  **Generate Image**: Once a model is selected, run the generation script:
    ```bash
    python3 scripts/generate_image.py "your prompt here" --model "<selected_model>" --output "output_filename.png"
    ```
4.  **Send to User**: Use the `message` tool to send the resulting file with a caption.

## Features
- **Dynamic Selection**: Inline buttons for easy model switching.
- **Model Synced**: Models are symlinked from the `infip-models` skill.
- **Aspect Ratio**: Defaults to `1792x1024`.
- **Automatic Key Handling**: The script handles session-based API key generation.
