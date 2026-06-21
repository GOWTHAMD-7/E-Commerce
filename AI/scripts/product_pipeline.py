import os
import pandas as pd
import numpy as np
import random
import ast
import re
from urllib.parse import urlparse
from ai_enrichment import clean_description, clean_text, predict_brand, normalize_category
from config import TARGET_PRODUCTS, TOTAL_SELLERS

def filter_english_only(df):
    cols = [c.lower() for c in df.columns]
    
    # 1. Find URL column
    url_col = None
    for uc in ['url', 'product_url', 'product url', 'link']:
        if uc in cols:
            url_col = df.columns[cols.index(uc)]
            break
            
    # 2. Find Title/Name column
    title_col = None
    for tc in ['product_name', 'title', 'name']:
        if tc in cols:
            title_col = df.columns[cols.index(tc)]
            break
            
    if not url_col or not title_col:
        return df # Can't filter if columns are missing
        
    allowed_domains = {
        'us.shein.com',
        'walmart.com',
        'lazada.sg',
        'lazada.com.ph',
        'lazada.com.my',
        'shopee.sg',
        'shopee.ph',
        'shopee.com.my'
    }
    
    # Spanish stopwords
    spanish_words = {
        'de', 'el', 'la', 'en', 'y', 'con', 'para', 'del', 'al', 'los', 'un', 'una', 'las', 'por'
    }
    
    def is_non_english_char(c):
        o = ord(c)
        if 0x4e00 <= o <= 0x9fff: # CJK Unified Ideographs
            return True
        if 0x3000 <= o <= 0x30ff: # CJK symbols, Hiragana, Katakana
            return True
        if 0xff00 <= o <= 0xffef: # Fullwidth forms
            return True
        return False

    def contains_non_english_text(text):
        if not isinstance(text, str):
            return False
        if any(is_non_english_char(c) for c in text):
            return True
        words = re.findall(r'[a-zA-Z]+', text.lower())
        spanish_count = sum(1 for w in words if w in spanish_words)
        if spanish_count >= 3:
            return True
        return False
        
    def is_appropriate_product(title):
        title_lower = title.lower()
        inappropriate = {
            'crotch', 'porn', 'vagina', 'bodystocking', 'thong', 'erotic', 'leotard',
            'swimsuit', 'swimwear', 'bikini', 'underwear', 'briefs', 'bra', 'panties',
            'sleepwear', 'nightdress', 'bodysuit', 'nipple', 'nipples', 'pasties'
        }
        words = set(re.findall(r'[a-z]+', title_lower))
        if any(w in inappropriate for w in words):
            return False
        if 'slip' in words and 'non' not in words:
            return False
        return True

    def row_is_english(row):
        url = str(row[url_col]) if not pd.isna(row[url_col]) else ""
        title = str(row[title_col]) if not pd.isna(row[title_col]) else ""
        if not url or not title:
            return False
            
        netloc = urlparse(url).netloc.lower()
        parts = netloc.split('.')
        if len(parts) >= 2:
            domain = '.'.join(parts[-2:])
            if 'shein.com' in netloc:
                domain = 'us.shein.com'
        else:
            domain = netloc
            
        if domain not in allowed_domains:
            return False
            
        if contains_non_english_text(title):
            return False
            
        if not is_appropriate_product(title):
            return False
            
        return True
        
    mask = df.apply(row_is_english, axis=1)
    return df[mask]

def balanced_sample(df, target_count):
    # Group by normalized_category
    categories = df['normalized_category'].unique()
    cat_dfs = {cat: cat_df for cat, cat_df in df.groupby('normalized_category')}
    
    remaining_target = target_count
    cats_left = list(categories)
    allocated = {cat: 0 for cat in categories}
    
    # Iterative allocation to be as balanced as possible across categories
    while remaining_target > 0 and cats_left:
        slice_size = max(1, remaining_target // len(cats_left))
        new_cats_left = []
        for cat in cats_left:
            cat_df = cat_dfs[cat]
            current_alloc = allocated[cat]
            available = len(cat_df) - current_alloc
            
            if available <= 0:
                continue
                
            take = min(slice_size, available, remaining_target)
            allocated[cat] += take
            remaining_target -= take
            
            if current_alloc + take < len(cat_df):
                new_cats_left.append(cat)
                
        cats_left = new_cats_left
        
        if sum(allocated.values()) == target_count:
            break
        if not cats_left:
            break
            
    sampled_dfs = []
    for cat, count in allocated.items():
        if count > 0:
            sampled_dfs.append(cat_dfs[cat].sample(n=count, random_state=42))
            
    if sampled_dfs:
        return pd.concat(sampled_dfs).sample(frac=1, random_state=42)
    return df.head(target_count)


def parse_list_string(val):
    if pd.isna(val):
        return []
    if isinstance(val, list):
        return val
    try:
        parsed = ast.literal_eval(str(val))
        if isinstance(parsed, list):
            return parsed
    except:
        pass
    s = str(val).strip()
    if not s:
        return []
    if '|' in s:
        return [x.strip() for x in s.split('|') if x.strip()]
    if ',' in s:
        return [x.strip() for x in s.split(',') if x.strip()]
    return [s]

def clean_list_elements(lst):
    cleaned = []
    for item in lst:
        if not isinstance(item, str):
            cleaned.append(item)
            continue
        # Replace common fullwidth characters
        item = item.replace('（', '(').replace('）', ')')
        item = item.replace('【', '[').replace('】', ']')
        # Remove any actual CJK characters (like 均码) from the item
        # CJK unified range is 0x4e00 to 0x9fff
        # CJK symbols & punctuation, Hiragana, Katakana: 0x3000 to 0x30ff
        # Fullwidth forms: 0xff00 to 0xffef
        item = ''.join(c for c in item if not (
            (0x4e00 <= ord(c) <= 0x9fff) or
            (0x3000 <= ord(c) <= 0x30ff) or
            (0xff00 <= ord(c) <= 0xffef)
        ))
        item = re.sub(r'\bsexy\b', 'stylish', item, flags=re.IGNORECASE)
        item = re.sub(r'\blingerie\b', 'sleepwear', item, flags=re.IGNORECASE)
        item = re.sub(r'\bbabydoll\b', 'nightdress', item, flags=re.IGNORECASE)
        item = re.sub(r'\bchemise\b', 'slip', item, flags=re.IGNORECASE)
        item = item.strip()
        if item:
            cleaned.append(item)
    return cleaned


def clean_and_normalize(df, source):
    standard = pd.DataFrame()
    cols = [c.lower() for c in df.columns]
    
    # Name
    if 'product_name' in cols: standard['name'] = df.iloc[:, cols.index('product_name')]
    elif 'title' in cols: standard['name'] = df.iloc[:, cols.index('title')]
    else: standard['name'] = ""
        
    # Description
    if 'description' in cols: standard['description'] = df.iloc[:, cols.index('description')]
    elif 'product_description' in cols: standard['description'] = df.iloc[:, cols.index('product_description')]
    elif 'product description' in cols: standard['description'] = df.iloc[:, cols.index('product description')]
    else: standard['description'] = ""
        
    # Category
    if 'category_name' in cols: standard['category'] = df.iloc[:, cols.index('category_name')]
    elif 'category' in cols: standard['category'] = df.iloc[:, cols.index('category')]
    elif 'breadcrumb' in cols: standard['category'] = df.iloc[:, cols.index('breadcrumb')]
    elif 'category_tree' in cols: standard['category'] = df.iloc[:, cols.index('category_tree')]
    else: standard['category'] = ""
        
    # Brand
    if 'brand' in cols: standard['brand'] = df.iloc[:, cols.index('brand')]
    else: standard['brand'] = ""
        
    # Price
    if 'final_price' in cols: standard['price'] = df.iloc[:, cols.index('final_price')]
    elif 'price' in cols: standard['price'] = df.iloc[:, cols.index('price')]
    else: standard['price'] = 0.0
        
    # Stock
    if 'in_stock' in cols: standard['stock'] = df.iloc[:, cols.index('in_stock')]
    elif 'stock' in cols: standard['stock'] = df.iloc[:, cols.index('stock')]
    else: standard['stock'] = np.nan
        
    # Images
    if 'main_image' in cols: standard['mainImage'] = df.iloc[:, cols.index('main_image')]
    elif 'image' in cols: standard['mainImage'] = df.iloc[:, cols.index('image')]
    else: standard['mainImage'] = ""
        
    if 'image_urls' in cols: standard['images'] = df.iloc[:, cols.index('image_urls')]
    elif 'images' in cols: standard['images'] = df.iloc[:, cols.index('images')]
    else: standard['images'] = ""
        
    # Sizes & Colors
    if 'sizes' in cols: standard['sizes'] = df.iloc[:, cols.index('sizes')]
    elif 'all_available_sizes' in cols: standard['sizes'] = df.iloc[:, cols.index('all_available_sizes')]
    else: standard['sizes'] = ""
        
    if 'colors' in cols: standard['colors'] = df.iloc[:, cols.index('colors')]
    elif 'color' in cols: standard['colors'] = df.iloc[:, cols.index('color')]
    else: standard['colors'] = ""
        
    return standard

def process_datasets(dataset_dir):
    all_products = []
    files = [f for f in os.listdir(dataset_dir) if f.endswith('.csv')]
    for file in files:
        print(f"Loading {file}...")
        try:
            df = pd.read_csv(os.path.join(dataset_dir, file))
            df = filter_english_only(df)
            std_df = clean_and_normalize(df, file)
            all_products.append(std_df)
        except Exception as e:
            print(f"Failed to read {file}: {e}")
            
    if not all_products:
        print("No valid CSV files found or parsed.")
        return []
        
    combined = pd.concat(all_products, ignore_index=True)
    
    # Filter
    combined['name'] = combined['name'].fillna("").astype(str)
    combined['mainImage'] = combined['mainImage'].fillna("").astype(str)
    combined = combined[combined['name'].str.strip() != ""]
    combined = combined[combined['mainImage'].str.strip() != ""]
    combined = combined.drop_duplicates(subset=['name'])
    
    # Pre-calculate normalized categories for balanced sampling
    combined['normalized_category'] = combined.apply(lambda r: normalize_category(str(r['category']).strip(), str(r['name'])), axis=1)
    
    if len(combined) > TARGET_PRODUCTS:
        combined = balanced_sample(combined, TARGET_PRODUCTS)
        
    products_list = []
    current_id = 1
    weights = np.random.dirichlet(np.ones(TOTAL_SELLERS)*0.5)
    seller_ids = range(2, TOTAL_SELLERS + 2)
    
    print("Enriching data (Applying rules and AI fallbacks where needed)...")
    for idx, row in combined.iterrows():
        desc = clean_description(row['description'])
        brand = str(row['brand']).strip()
        if not brand or brand.lower() in ['nan', 'null', 'none']:
            brand = predict_brand(row['name'], desc)
            
        final_cat = row['normalized_category']
        
        main_img = str(row['mainImage']).strip()
        additional_images = parse_list_string(row['images'])
        if not main_img and additional_images:
            main_img = additional_images.pop(0)
        if main_img in additional_images:
            additional_images.remove(main_img)
            
        sizes = clean_list_elements(parse_list_string(row['sizes']))
        colors = clean_list_elements(parse_list_string(row['colors']))
        
        try:
            price = float(row['price'])
        except:
            price = round(random.uniform(5.0, 500.0), 2)
        if price <= 0:
            price = round(random.uniform(5.0, 500.0), 2)
            
        try:
            stock = int(row['stock'])
        except:
            stock = random.randint(10, 100)
        if stock <= 0:
            stock = random.randint(10, 100)
            
        seller_id = int(np.random.choice(seller_ids, p=weights))
        
        product = {
            "id": current_id,
            "name": clean_text(str(row['name']))[:250],
            "description": desc,
            "category": final_cat,
            "brand": clean_text(str(brand))[:250],
            "price": price,
            "stock": stock,
            "mainImage": main_img,
            "images": additional_images,
            "sizes": sizes,
            "colors": colors,
            "seller_id": seller_id,
            "rating": 0.0,
            "reviewCount": 0
        }
        products_list.append(product)
        current_id += 1
        
    return products_list
