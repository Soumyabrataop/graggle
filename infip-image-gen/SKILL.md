---
name: infip-image-gen
description: Generate high-quality images using the Infip API. Use when the user requests image generation, specifically mentioning "infip" or asking for "img4" model images.
---

# Infip Image Generation

This skill uses the Infip API to generate images from text prompts.

## Workflow

1.  **Extract Prompt**: Identify the user's desired image description.
2.  **Generate Image**: Run the generation script:
    ```bash
    python3 scripts/generate_image.py "your prompt here" "output_filename.png"
    ```
3.  **Send to User**: Use the `message` tool to send the resulting file.
    - Set `action: "send"`
    - Set `filePath: "/home/codespace/.openclaw/workspace/infip-image-gen/output_filename.png"` (or the absolute path to your output)
    - Set `caption: "Here is your generated image! 🦂"`

## Features
- **Model**: Uses the `img4` model for high fidelity.
- **Aspect Ratio**: Defaults to `1792x1024`.
- **Automatic Key Handling**: The script handles session-based API key generation.
