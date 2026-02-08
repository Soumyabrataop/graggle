---
name: music-dwn
description: Search and download music from JioSaavn. Use when the user wants to find, download, or share a full song.
---

# Music Downloader

This skill allows you to search for songs and retrieve high-quality download links.

## Usage

1. **Search for a song**: Use the `search_music.py` script to find songs.
   ```bash
   python3 skills/music-dwn/scripts/search_music.py "Song Name"
   ```

2. **Download and Send**: After getting the `download_url`, use `curl` to download the file and the `message` tool to send it to the chat.

### Example Workflow

1. User says: "Find and send me 'Shape of You'."
2. Run: `python3 skills/music-dwn/scripts/search_music.py "Shape of You"`
3. Select the best match from the results.
4. Run: `curl -L "<download_url>" -o "Shape of You.m4a"`
5. Run: `message(action="send", filePath="Shape of You.m4a", message="Here is 'Shape of You'!")`
6. Run: `rm "Shape of You.m4a"`

## Notes
- The downloader prefers 320kbps quality when available.
- Files are typically in .m4a or .mp3 format depending on the source.
- Always clean up downloaded files after sending.
