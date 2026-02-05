import requests
import json
import sys
import os

def generate_image(prompt, output_path="generated_image.png"):
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
        # Some keys are returned as JSON, check if it's JSON
        try:
            key_json = key_response.json()
            api_key = key_json.get('api_key', api_key)
        except:
            pass
            
        if not api_key:
            print("Failed to obtain API Key")
            return None
    except Exception as e:
        print(f"Error obtaining API Key: {e}")
        return None

    # Step 2: Generate Image
    gen_url = "https://api.infip.pro/v1/images/generations"
    gen_headers = {
        "accept": "application/json",
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "img4",
        "n": 1,
        "prompt": prompt,
        "response_format": "url",
        "size": "1792x1024"
    }
    
    try:
        gen_response = requests.post(gen_url, headers=gen_headers, json=payload)
        gen_response.raise_for_status()
        result = gen_response.json()
        image_url = result['data'][0]['url']
    except Exception as e:
        print(f"Error generating image: {e}")
        if 'gen_response' in locals():
            print(f"Response: {gen_response.text}")
        return None

    # Step 3: Download Image
    try:
        img_data = requests.get(image_url).content
        with open(output_path, 'wb') as handler:
            handler.write(img_data)
        print(f"Image saved to: {output_path}")
        return output_path
    except Exception as e:
        print(f"Error downloading image: {e}")
        return None

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 generate_image.py <prompt> [output_path]")
        sys.exit(1)
    
    prompt = sys.argv[1]
    out = sys.argv[2] if len(sys.argv) > 2 else "generated_image.png"
    generate_image(prompt, out)
