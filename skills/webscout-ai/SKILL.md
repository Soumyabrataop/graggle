---
name: webscout-ai
description: AI interaction with over 90 providers (OpenAI, Gemini, Groq, Meta).
metadata: { "openclaw": { "emoji": "🤖", "requires": { "bins": ["uv"] } } }
---

# webscout-ai

Access a wide range of AI models through a consistent interface.

## Supported Providers
- **Popular**: OpenAI, Gemini, Meta, Groq, Llama, DeepInfra, Cohere, PerplexityLabs, YepChat.
- **Compatibility**: Native API, OpenAI-compatible, and Local LLMs.

## Features
- **AI Search**: AI-powered search engines.
- **OpenAI-Compatible API Server**: Start with `webscout-server`.
- **Tool Calling**: Supported by providers like Groq.

## Usage (Python)
```python
from webscout import Meta
meta_ai = Meta()
response = meta_ai.chat("Query")
```
