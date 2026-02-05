import requests
import json
import os

def fetch_models():
    # Step 1: Generate API Key
    key_url = "https://infip.pro/api/generate-key"
    key_headers = {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1",
        "Referer": "https://infip.pro/api-keys"
    }
    
    try:
        key_response = requests.get(key_url, headers=key_headers)
        key_response.raise_for_status()
        api_key = key_response.text.strip()
        try:
            key_json = key_response.json()
            api_key = key_json.get('api_key', api_key)
        except:
            pass
            
        if not api_key:
            print("Failed to obtain API Key")
            return
    except Exception as e:
        print(f"Error obtaining API Key: {e}")
        return

    # Step 2: Fetch Models
    models_url = "https://api.infip.pro/v1/models"
    headers = {
        "accept": "application/json",
        "Authorization": f"Bearer {api_key}"
    }
    
    try:
        response = requests.get(models_url, headers=headers)
        response.raise_for_status()
        models_data = response.json()
        
        # Extract model names/IDs
        # Assuming OpenAI format: {"data": [{"id": "...", ...}, ...]}
        models_list = []
        if isinstance(models_data, dict) and 'data' in models_data:
            models_list = [m['id'] for m in models_data['data']]
        elif isinstance(models_data, list):
            models_list = [m['id'] if isinstance(m, dict) and 'id' in m else m for m in models_data]
        else:
            print("Unexpected models format")
            print(json.dumps(models_data, indent=2))
            return

        # Step 3: Save to model.json
        output_file = "model.json"
        with open(output_file, 'w') as f:
            json.dump(models_list, f, indent=2)
            
        print(f"Successfully collected {len(models_list)} models in {output_file}")
        print(json.dumps(models_list, indent=2))
        
    except Exception as e:
        print(f"Error fetching models: {e}")
        if 'response' in locals():
            print(f"Response: {response.text}")

if __name__ == "__main__":
    fetch_models()
