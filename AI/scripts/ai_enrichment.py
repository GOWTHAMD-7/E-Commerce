import re
import google.generativeai as genai
from config import ALLOWED_CATEGORIES, CATEGORY_MAPPING, GEMINI_API_KEY

def clean_text(text):
    if not isinstance(text, str):
        return ""
    # Replace adult/inappropriate words with appropriate synonyms
    text = re.sub(r'\bsexy\b', 'stylish', text, flags=re.IGNORECASE)
    text = re.sub(r'\blingerie\b', 'sleepwear', text, flags=re.IGNORECASE)
    text = re.sub(r'\bbabydoll\b', 'nightdress', text, flags=re.IGNORECASE)
    text = re.sub(r'\bchemise\b', 'slip', text, flags=re.IGNORECASE)
    
    text = text.encode('ascii', 'ignore').decode('ascii')
    clean = re.sub(r'<[^>]+>', ' ', text)
    clean = re.sub(r'\s+', ' ', clean).strip()
    return clean

def clean_description(desc):
    return clean_text(desc)

def predict_brand(name, desc):
    # Fallback directly to Generic instead of calling the API
    return "Generic"

def normalize_category(raw_category, title=""):
    if not isinstance(raw_category, str):
        raw_category = ""
    raw_lower = raw_category.strip().lower()
    title_lower = str(title).strip().lower()
    
    # 1. Exact match checking in allowed categories
    for allowed in ALLOWED_CATEGORIES:
        allowed_lower = allowed.lower()
        if allowed_lower == raw_lower or allowed_lower == title_lower:
            return allowed
            
    # 2. Map from CATEGORY_MAPPING using whole-word matching
    words = set(re.findall(r'[a-z0-9]+', raw_lower))
    for key, val in CATEGORY_MAPPING.items():
        key_lower = key.lower()
        if ' ' in key_lower:
            key_words = re.findall(r'[a-z0-9]+', key_lower)
            if all(kw in words for kw in key_words):
                return val
        else:
            if key_lower in words:
                return val
                
    # 3. Fallback: whole-word matching on the title for electronics & gadgets
    title_words = set(re.findall(r'[a-z0-9]+', title_lower))
    title_mapping = {
        "phone": "Mobiles",
        "mobile": "Mobiles",
        "iphone": "Mobiles",
        "samsung": "Mobiles",
        "charger": "Mobiles",
        "cable": "Mobiles",
        "airpods": "Mobiles",
        "laptop": "Laptops & Computers",
        "computer": "Laptops & Computers",
        "keyboard": "Laptops & Computers",
        "mouse": "Laptops & Computers",
        "monitor": "Laptops & Computers",
        "pc": "Laptops & Computers",
        "headphone": "Audio & Headphones",
        "headphones": "Audio & Headphones",
        "earphone": "Audio & Headphones",
        "earphones": "Audio & Headphones",
        "earbud": "Audio & Headphones",
        "earbuds": "Audio & Headphones",
        "speaker": "Audio & Headphones",
        "speakers": "Audio & Headphones",
        "audio": "Audio & Headphones",
        "smartwatch": "Smart Watches",
        "camera": "Cameras",
        "cameras": "Cameras",
        "lens": "Cameras"
    }
    for key, val in title_mapping.items():
        if key in title_words:
            return val
            
    # 4. Direct Fallback without Gemini
    return "Home & Living"
