import requests
import os
import json

# Graggle's Image Generator Template
# This script uses the Stability AI API as an example.
# You will need an API key from https://platform.stability.ai/

def generate_image(prompt, api_key, output_path="generated_image.png"):
    """
    Generates an image based on a text prompt using Stability AI API.
    """
    print(f"🦂 Graggle is spinning a web for prompt: {prompt}")
    
    url = "https://api.stability.ai/v1/generation/stable-diffusion-v1-6/text-to-image"
    
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": f"Bearer {api_key}"
    }
    
    body = {
        "text_prompts": [
            {
                "text": prompt
            }
        ],
        "cfg_scale": 7,
        "height": 512,
        "width": 512,
        "samples": 1,
        "steps": 30,
    }

    response = requests.post(url, headers=headers, json=body)

    if response.status_code != 200:
        raise Exception(f"Non-200 response: {response.text}")

    data = response.json()

    # Decoding and saving the image
    for i, image in enumerate(data["artifacts"]):
        with open(output_path, "wb") as f:
            import base64
            f.write(base64.b64decode(image["base64"]))
            
    print(f"🦂 Sting complete. Image saved to {output_path}")

if __name__ == "__main__":
    # Replace with your actual API key
    MY_API_KEY = "YOUR_STABILITY_API_KEY_HERE"
    USER_PROMPT = "A cybernetic scorpion in a dark neon forest"
    
    try:
        generate_image(USER_PROMPT, MY_API_KEY)
    except Exception as e:
        print(f"🦂 Pincer error: {e}")
