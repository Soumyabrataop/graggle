---
name: webscout-search
description: Comprehensive web search using multiple engines (DuckDuckGo, Yahoo, Bing, Yep).
metadata: { "openclaw": { "emoji": "🔍", "requires": { "bins": ["uv"] } } }
---

# webscout-search

Access diverse search engines for text, images, news, and maps.

## Commands

- **DuckDuckGo Text Search**: `uv run webscout text -k "query"`
- **DuckDuckGo Image Search**: `uv run webscout images -k "query"`
- **Yahoo Search**: `uv run webscout yahoo_text -k "query"`
- **Bing Search**: `uv run webscout bing_text -k "query"`
- **Yep Search**: `uv run webscout yep_text -k "query"`

## Advanced Options

- **News from last week**: `uv run webscout news -k "query" -t w`
- **Weather info**: `uv run webscout weather -l "location"`
- **Translation**: `uv run webscout translate -k "text" -to es`
