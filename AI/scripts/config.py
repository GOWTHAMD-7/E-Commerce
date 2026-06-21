import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

# Gemini Config
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
else:
    print("WARNING: GEMINI_API_KEY not found in environment. AI fallbacks will fail.")

# User Generation Constants
TOTAL_ADMINS = 1
TOTAL_SELLERS = 50
TOTAL_CUSTOMERS = 100
TARGET_PRODUCTS = 2500

# Interactions Constants
MIN_REVIEWS = 500
MAX_REVIEWS = 1000

MIN_FAVORITES = 300
MAX_FAVORITES = 500

MIN_ORDERS = 200
MAX_ORDERS = 400

MIN_ORDER_ITEMS = 500
MAX_ORDER_ITEMS = 1200

# Strict Allowed Categories
ALLOWED_CATEGORIES = [
    "Mobiles", "Laptops & Computers", "Audio & Headphones", "Smart Watches", "Cameras",
    "Fashion", "Footwear", "Bags & Luggage", "Jewelry & Watches",
    "Beauty & Personal Care", "Health & Wellness",
    "Home & Living", "Furniture", "Kitchen & Appliances",
    "Sports & Fitness", "Books & Stationery", "Toys & Games",
    "Baby Products", "Pet Supplies", "Automotive", "Food & Grocery"
]

# Rule-based fast mapping
CATEGORY_MAPPING = {
    # Mobiles
    "cell phones & accessories": "Mobiles",
    "mobile phones": "Mobiles",
    "smartphones": "Mobiles",
    "phone": "Mobiles",
    "mobile": "Mobiles",
    "iphone": "Mobiles",
    "samsung": "Mobiles",
    "charger": "Mobiles",
    "cable": "Mobiles",
    "airpods": "Mobiles",
    
    # Laptops & Computers
    "computers": "Laptops & Computers",
    "laptops": "Laptops & Computers",
    "laptop": "Laptops & Computers",
    "computer": "Laptops & Computers",
    "keyboard": "Laptops & Computers",
    "mouse": "Laptops & Computers",
    "monitor": "Laptops & Computers",
    "pc": "Laptops & Computers",
    "printer": "Laptops & Computers",
    "dioda": "Laptops & Computers",
    
    # Audio & Headphones
    "audio": "Audio & Headphones",
    "headphones": "Audio & Headphones",
    "headphone": "Audio & Headphones",
    "earphone": "Audio & Headphones",
    "earbud": "Audio & Headphones",
    "speaker": "Audio & Headphones",
    
    # Smart Watches
    "smart watches": "Smart Watches",
    "smartwatch": "Smart Watches",
    "smart watch": "Smart Watches",
    
    # Cameras
    "cameras": "Cameras",
    "camera": "Cameras",
    "lens": "Cameras",
    "projector": "Cameras",
    
    # Toys & Games
    "toy": "Toys & Games",
    "game": "Toys & Games",
    "puzzle": "Toys & Games",
    "doll": "Toys & Games",
    "juguete": "Toys & Games",
    "mueca": "Toys & Games",
    
    # Books & Stationery
    "office & school supplies": "Books & Stationery",
    "book": "Books & Stationery",
    "stationery": "Books & Stationery",
    "pen": "Books & Stationery",
    "pencil": "Books & Stationery",
    "notebook": "Books & Stationery",
    
    # Beauty & Personal Care
    "beauty & health": "Beauty & Personal Care",
    "beauty": "Beauty & Personal Care",
    "makeup": "Beauty & Personal Care",
    "skin": "Beauty & Personal Care",
    "cosmetics": "Beauty & Personal Care",
    "perfume": "Beauty & Personal Care",
    
    # Health & Wellness
    "health": "Health & Wellness",
    "wellness": "Health & Wellness",
    "vitamin": "Health & Wellness",
    
    # Sports & Fitness
    "sports & outdoor": "Sports & Fitness",
    "fitness": "Sports & Fitness",
    "sport": "Sports & Fitness",
    "gym": "Sports & Fitness",
    "bicycle": "Sports & Fitness",
    "ciclismo": "Sports & Fitness",
    "running": "Sports & Fitness",
    
    # Pet Supplies
    "pet": "Pet Supplies",
    "dog": "Pet Supplies",
    "cat": "Pet Supplies",
    
    # Automotive
    "automotive": "Automotive",
    "car": "Automotive",
    "motorcycle": "Automotive",
    
    # Baby Products
    "baby": "Baby Products",
    "diaper": "Baby Products",
    "infant": "Baby Products",
    
    # Food & Grocery
    "food": "Food & Grocery",
    "groceries": "Food & Grocery",
    "grocery": "Food & Grocery",
    "snack": "Food & Grocery",
    "beverage": "Food & Grocery",
    
    # Furniture
    "furniture": "Furniture",
    "chair": "Furniture",
    "table": "Furniture",
    "sofa": "Furniture",
    "bed": "Furniture",
    
    # Kitchen & Appliances
    "kitchen": "Kitchen & Appliances",
    "cookware": "Kitchen & Appliances",
    "appliance": "Kitchen & Appliances",
    "tv": "Kitchen & Appliances",
    
    # Bags & Luggage
    "women apparel": "Fashion", # mapped down below
    "bag": "Bags & Luggage",
    "luggage": "Bags & Luggage",
    "backpack": "Bags & Luggage",
    "purse": "Bags & Luggage",
    
    # Footwear
    "shoes": "Footwear",
    "footwear": "Footwear",
    "sneaker": "Footwear",
    "sandal": "Footwear",
    "boot": "Footwear",
    
    # Jewelry & Watches
    "jewelry & watches": "Jewelry & Watches",
    "jewelry": "Jewelry & Watches",
    "ring": "Jewelry & Watches",
    "necklace": "Jewelry & Watches",
    "bracelet": "Jewelry & Watches",
    
    # Fashion
    "men": "Fashion",
    "clothing": "Fashion",
    "shirt": "Fashion",
    "dress": "Fashion",
    "pants": "Fashion"
}
