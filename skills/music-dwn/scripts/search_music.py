import sys
import requests
import json

def search_song(query):
    BASE_URL = "https://jiosavan-api2.vercel.app/api"
    SEARCH_ENDPOINT = f"{BASE_URL}/search/songs"
    
    try:
        params = {"query": query, "limit": 5}
        response = requests.get(SEARCH_ENDPOINT, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        if not data.get("success") or "data" not in data:
            return {"success": False, "message": "No results found"}
        
        results_data = data["data"]["results"]
        if not results_data:
            return {"success": False, "message": "No songs found"}
        
        results = []
        for song_data in results_data:
            title = song_data.get('name', 'Unknown')
            artists_data = song_data.get('artists', {})
            primary_artists = artists_data.get('primary', [])
            artists = ', '.join([a.get('name', '') for a in primary_artists if a.get('name')]) if primary_artists else 'Unknown'
            album = song_data.get('album', {}).get('name', 'Unknown')
            duration = song_data.get('duration', 0)
            download_urls = song_data.get("downloadUrl", [])
            
            if not download_urls:
                continue
            
            # Prefer high quality
            best_url = next((dl.get('url') for dl in download_urls if dl.get('quality') == '320kbps'), None)
            if not best_url:
                best_url = download_urls[-1].get('url') # Usually the last one is best quality if 320 is missing
            
            results.append({
                "title": title,
                "artists": artists,
                "album": album,
                "duration": f"{duration // 60}:{duration % 60:02d}",
                "download_url": best_url
            })
        
        return {"success": True, "results": results}
        
    except Exception as e:
        return {"success": False, "message": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "message": "Query required"}))
        sys.exit(1)
    
    query = " ".join(sys.argv[1:])
    print(json.dumps(search_song(query), indent=2))
