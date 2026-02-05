---
name: webscout-developer
description: Developer tools including GitAPI, web crawling (Scout), and model conversion.
metadata: { "openclaw": { "emoji": "👨‍💻", "requires": { "bins": ["uv"] } } }
---

# webscout-developer

Tools for data extraction, web parsing, and model quantization.

## GitAPI
- GitHub data extraction without authentication for public data.

## Scout
- Advanced web parsing and crawling library.
- Intelligent HTML/XML parsing.

## GGUF Conversion
- Convert and quantize Hugging Face models to GGUF format for offline use.
- Command: `python -m webscout.Extra.gguf convert -m "model_id" -q "quantization_method"`

## CLI Frameworks
- **SwiftCLI**: Elegant command-line interfaces.
- **LitPrinter**: Styled console output with colors.
- **LitAgent**: Modern user agent generator.
