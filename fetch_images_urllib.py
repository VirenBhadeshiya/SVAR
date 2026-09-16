import urllib.request
import json
import os
import random

data_path = './public/data/gallery.json'
target_dir = './public/images/gallery'

with open(data_path, 'r', encoding='utf-8') as f:
    existing_items = json.load(f)

ai_items = [x for x in existing_items if 'ai_img_' in x.get('src', '')]
count = len(ai_items) + 1
final_items = list(ai_items)
print(f"Starting with {len(ai_items)} AI items.")

searches = ["Navratri+Garba", "Dandiya", "Garba+dance"]
headers = {'User-Agent': 'Mozilla/5.0 SVAR-Navratri/1.0'}

for search in searches:
    if count > 50:
        break
    url = f"https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrsearch={search}&gsrnamespace=6&gsrlimit=40&prop=imageinfo&iiprop=url"
    req = urllib.request.Request(url, headers=headers)
    try:
        print(f"Searching {search}...")
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
        pages = data.get('query', {}).get('pages', {})
        
        for page_id, page in pages.items():
            if count > 50:
                break
            if 'imageinfo' not in page: continue
            
            img_url = str(page['imageinfo'][0]['url'])
            title = str(page['title']).replace('File:', '').split('.')[0]
            title = title[:30] # type: ignore
            
            if img_url.lower().endswith(('.jpg', '.jpeg', '.png')):
                filepath = os.path.join(target_dir, f"real_garba_{count}.jpg")
                img_req = urllib.request.Request(img_url, headers=headers)
                try:
                    with urllib.request.urlopen(img_req) as img_resp:
                        img_data = img_resp.read()
                        if len(img_data) > 15000:
                            with open(filepath, 'wb') as out_file:
                                out_file.write(img_data)
                            
                            cats = ["Dance", "Devotion", "Crowd", "Celebrities"]
                            final_items.append({
                                "id": count,
                                "title": title.strip() or f"Navratri Magic {count}",
                                "src": f"/images/gallery/real_garba_{count}.jpg",
                                "category": random.choice(cats)
                            })
                            print(f"Downloaded {count}: {img_url}")
                            count = count + 1 # type: ignore
                        else:
                            print(f"Skipped small ({len(img_data)}): {img_url}")
                except Exception as e:
                    print(f"Failed {img_url}: {e}")
    except Exception as e:
        print(f"Search failed {search}: {e}")
        
with open(data_path, 'w', encoding='utf-8') as f:
    json.dump(final_items, f, indent=2)

print(f"Done. Saved {len(final_items)} images.")
