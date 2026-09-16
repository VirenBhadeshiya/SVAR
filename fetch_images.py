import urllib.request
import urllib.parse
import json
import os
import traceback
from typing import Dict, Any, List, cast

os.makedirs('./public/images/gallery', exist_ok=True)

url = "https://commons.wikimedia.org/w/api.php"
params = {
    "action": "query",
    "format": "json",
    "generator": "search",
    "gsrsearch": "Garba",
    "gsrnamespace": "6",
    "gsrlimit": "50",
    "prop": "imageinfo",
    "iiprop": "url|extmetadata"
}

USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

def fetch_json(url: str, params: Dict[str, Any]) -> Dict[str, Any]:
    query_string = urllib.parse.urlencode(params)
    full_url = f"{url}?{query_string}"
    req = urllib.request.Request(full_url, headers={'User-Agent': USER_AGENT, 'Accept': 'application/json'})
    with urllib.request.urlopen(req) as response:
        return cast(Dict[str, Any], json.loads(response.read().decode()))

def download_file(url, filepath):
    req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT, 'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8'})
    with urllib.request.urlopen(req, timeout=15) as response, open(filepath, 'wb') as out_file:
        out_file.write(response.read())

print("Fetching image list from Wikimedia Commons...")
pages: Dict[str, Any] = {}
try:
    response_data = fetch_json(url, params)
    query_data = response_data.get('query', {})
    if isinstance(query_data, dict):
        pages_val = query_data.get('pages', {})
        if isinstance(pages_val, dict):
            pages = pages_val
except Exception as e:
    print(f"Failed to fetch metadata: {e}")

count: int = 1
items: List[Dict[str, Any]] = []

for page_id, page_info in pages.items():
    if not isinstance(page_info, dict):
        continue
    if 'imageinfo' in page_info:
        img_url = str(page_info['imageinfo'][0]['url'])
        title = str(page_info['title']).replace('File:', '').split('.')[0]
        title = str(title)[:30]
        if img_url.lower().endswith(('.jpg', '.png', '.jpeg')):
            if img_url.startswith('http:'):
                img_url = img_url.replace('http:', 'https:')
            print(f"Downloading {count}: {img_url}")
            try:
                filename = f"gallery_{count}.jpg"
                filepath = f"./public/images/gallery/{filename}"
                download_file(img_url, filepath)
                
                items.append({
                    "id": count,
                    "title": title,
                    "src": f"/images/gallery/{filename}",
                    "category": "All"
                })
                count = count + 1
                if count > 50:
                    break
            except Exception as e:
                print(f"Failed to download {img_url}: {e}")

# If we don't have enough, fetch Navratri
if count <= 50:
    params["gsrsearch"] = "Navratri festival"
    try:
        response_data = fetch_json(url, params)
        query_data = response_data.get('query', {})
        if isinstance(query_data, dict):
            pages_val = query_data.get('pages', {})
            if isinstance(pages_val, dict):
                pages = pages_val
    except Exception as e:
        print(f"Failed to fetch metadata: {e}")
        pages = {}
        
    for page_id, page_info in pages.items():
        if not isinstance(page_info, dict):
            continue
        if 'imageinfo' in page_info:
            img_url = str(page_info['imageinfo'][0]['url'])
            title = str(page_info['title']).replace('File:', '').split('.')[0]
            title = str(title)[:30]
            if img_url.lower().endswith(('.jpg', '.png', '.jpeg')):
                if img_url.startswith('http:'):
                    img_url = img_url.replace('http:', 'https:')
                print(f"Downloading {count}: {img_url}")
                try:
                    filename = f"gallery_{count}.jpg"
                    filepath = f"./public/images/gallery/{filename}"
                    download_file(img_url, filepath)
                    
                    items.append({
                        "id": count,
                        "title": title,
                        "src": f"/images/gallery/{filename}",
                        "category": "All"
                    })
                    count = count + 1
                    if count > 50:
                        break
                except Exception as e:
                    print(f"Failed to download {img_url}: {e}")

with open('./public/data/gallery.json', 'w', encoding='utf-8') as f:
    json.dump(items, f, indent=2)

print(f"Successfully downloaded {count-1} images.")
