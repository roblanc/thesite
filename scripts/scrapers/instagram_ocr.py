import os
import sys
import json
import instaloader
import google.generativeai as genai
from upstash_redis import Redis
from datetime import datetime
from dotenv import load_dotenv

# Încarcă mediul din proiectul tău
load_dotenv(os.path.join(os.path.dirname(__file__), '../../.env.local'))

# Configurare API-uri
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
REDIS_URL = os.getenv('UPSTASH_REDIS_REST_URL')
REDIS_TOKEN = os.getenv('UPSTASH_REDIS_REST_TOKEN')

if not GEMINI_API_KEY:
    print("EROARE: GEMINI_API_KEY lipsește!")
    sys.exit(1)

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-1.5-flash') # Flash e mai rapid și ieftin pentru OCR

def scrape_instagram(username, limit=3):
    L = instaloader.Instaloader(
        download_videos=False,
        download_geotags=False,
        download_comments=False,
        fatal_status_codes=[429],
    )
    
    try:
        profile = instaloader.Profile.from_username(L.context, username)
        posts = []
        count = 0
        for post in profile.get_posts():
            if count >= limit: break
            if not post.is_video:
                # Descărcăm doar dacă e imagine
                L.download_post(post, target=username)
                posts.append(post)
                count += 1
        return posts
    except Exception as e:
        print(f"Eroare scraping {username}: {e}")
        return None

def get_image_path(username, post_shortcode):
    # Instaloader salvează fișierele cu timestamp și shortcode
    for file in os.listdir(username):
        if post_shortcode in file and file.endswith('.jpg'):
            return os.path.join(username, file)
    return None

def process_image_with_gemini(image_path, is_profile=False, profile_name=None):
    try:
        img_data = genai.upload_file(path=image_path)
        
        if is_profile:
            name = profile_name or "această persoană publică"
            prompt = f"""
            Ești un jurnalist la thesite.ro. Analizează imaginea (postare Instagram de la {name}).
            Extrage declarația principală din imagine. Trebuie să fie scurtă (max 20 cuvinte), percutantă și în stilul persoanei.
            Returnează JSON valid:
            {{
              "text": "Declarația extrasă",
              "topic": "Subiectul (ex: Politică, Social, Stil de viață)",
              "date": "YYYY-MM-DD",
              "impact": "high/medium/low",
              "bias": "right/left/center"
            }}
            """
        else:
            prompt = """
            Ești un jurnalist la thesite.ro. 
            Analizează imaginea atașată (care este o postare de Instagram cu text). 
            Extrage textul din imagine și transformă-l într-o știre scurtă, clară și obiectivă în limba română.
            Returnează rezultatul strict în format JSON:
            {
              "title": "Titlu scurt și informativ",
              "description": "Descrierea completă a știrii bazată pe textul din imagine",
              "category": "Categorie (ex: Politică, Economie, Social, Tehnologie)",
              "summary": "Un rezumat de o propoziție"
            }
            Dacă nu există text relevant în imagine, returnează null.
            """
        
        response = model.generate_content([img_data, prompt])
        text = response.text.replace('```json', '').replace('```', '').strip()
        return json.loads(text)
    except Exception as e:
        print(f"Eroare procesare Gemini: {e}")
        return None

def sync_to_redis(news_item, profile_id=None):
    if not REDIS_URL or not REDIS_TOKEN:
        print("Redis neconfigurat. Rezultat:", json.dumps(news_item, indent=2))
        return

    # Normalize Redis URL
    url = REDIS_URL
    if not url.startswith('http'):
        url = f"https://{url}"

    redis = Redis(url=url, token=REDIS_TOKEN)
    
    if profile_id:
        CACHE_KEY = f"profile:statements:{profile_id}"
        existing = redis.get(CACHE_KEY) or []
        if isinstance(existing, str): existing = json.loads(existing)
        
        new_statement = {
            "id": f"ig-{datetime.now().timestamp()}",
            "text": news_item['text'],
            "topic": news_item['topic'],
            "date": news_item.get('date', datetime.now().strftime('%Y-%m-%d')),
            "sourceUrl": news_item.get('post_url', ''),
            "impact": news_item.get('impact', 'medium'),
            "bias": news_item.get('bias', 'right')
        }
        
        if not any(s['text'] == new_statement['text'] for s in existing):
            existing.insert(0, new_statement)
            redis.set(CACHE_KEY, json.dumps(existing[:20]))
            print(f"Declarația pentru {profile_id} a fost salvată în Redis.")
    else:
        CACHE_KEY = 'aggregated_news'
        existing_raw = redis.get(CACHE_KEY)
        existing = []
        if existing_raw:
            if isinstance(existing_raw, str): existing = json.loads(existing_raw)
            else: existing = existing_raw
        
        new_story = {
            "id": f"ig-{datetime.now().timestamp()}",
            "title": news_item['title'],
            "description": news_item['description'],
            "image": news_item.get('image_url', ''),
            "sources": [{
                "id": "instagram",
                "name": "Instagram Source",
                "title": news_item['title'],
                "url": news_item.get('post_url', ''),
                "bias": "neutral",
                "category": news_item['category']
            }],
            "sourcesCount": 1,
            "bias": {"left": 0, "center": 1, "right": 0},
            "mainCategory": news_item['category'],
            "publishedAt": datetime.now().isoformat(),
            "timeAgo": "Acum"
        }
        existing.insert(0, new_story)
        redis.set(CACHE_KEY, json.dumps(existing[:100]))
        print(f"Știrea '{news_item['title']}' a fost salvată în Redis.")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("username", help="Instagram username")
    parser.add_argument("--profile-id", help="Profile ID to augment (e.g. dana-budeanu)")
    parser.add_argument("--profile-name", help="Display name for AI prompt (e.g. 'Dana Budeanu')")
    args = parser.parse_args()
        
    user = args.username
    print(f"Încep scraping-ul pentru {user}...")
    posts = scrape_instagram(user)
    if posts is None:
        # Exit non-zero so the GitHub Actions step (and the workflow) is marked failed.
        sys.exit(1)
    
    for post in posts:
        img_path = get_image_path(user, post.shortcode)
        if img_path:
            print(f"Procesez imaginea {img_path}...")
            result = process_image_with_gemini(
                img_path,
                is_profile=bool(args.profile_id),
                profile_name=args.profile_name
            )
            if result:
                result['post_url'] = f"https://www.instagram.com/p/{post.shortcode}/"
                sync_to_redis(result, profile_id=args.profile_id)
