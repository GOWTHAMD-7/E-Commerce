import random
from faker import Faker
from config import MIN_REVIEWS, MAX_REVIEWS, MIN_FAVORITES, MAX_FAVORITES, MIN_ORDERS, MAX_ORDERS, MIN_ORDER_ITEMS, MAX_ORDER_ITEMS

fake = Faker()

def generate_interactions(users, products):
    customer_ids = [u['id'] for u in users if u['role'] == 'CUSTOMER']
    product_ids = [p['id'] for p in products]
    
    if not customer_ids or not product_ids:
        return [], [], [], [], []
        
    num_reviews = random.randint(MIN_REVIEWS, min(MAX_REVIEWS, len(customer_ids) * len(product_ids)))
    reviews = []
    review_pairs = set()
    current_review_id = 1
    product_ratings = {pid: [] for pid in product_ids}
    
    print("Generating Reviews...")
    for _ in range(num_reviews):
        uid = random.choice(customer_ids)
        pid = random.choice(product_ids)
        pair = (uid, pid)
        if pair in review_pairs: continue
        review_pairs.add(pair)
        
        rating = random.randint(1, 5)
        if random.random() > 0.3: rating = random.randint(3, 5)
        product_ratings[pid].append(rating)
        
        reviews.append({
            "id": current_review_id,
            "user_id": uid,
            "product_id": pid,
            "rating": rating,
            "comment": fake.sentence() if random.random() > 0.5 else "",
            "created_at": fake.date_time_between(start_date="-1y", end_date="now").strftime("%Y-%m-%d %H:%M:%S")
        })
        current_review_id += 1
        
    for p in products:
        ratings = product_ratings[p['id']]
        if ratings:
            p['rating'] = round(sum(ratings) / len(ratings), 2)
            p['reviewCount'] = len(ratings)
            
    num_favs = random.randint(MIN_FAVORITES, min(MAX_FAVORITES, len(customer_ids) * len(product_ids)))
    favorites = []
    fav_pairs = set()
    
    print("Generating Favorites...")
    for _ in range(num_favs):
        uid = random.choice(customer_ids)
        pid = random.choice(product_ids)
        pair = (uid, pid)
        if pair not in fav_pairs:
            fav_pairs.add(pair)
            favorites.append(pair)
            
    num_orders = random.randint(MIN_ORDERS, MAX_ORDERS)
    orders = []
    order_items = []
    addresses = []
    current_order_id = 1
    current_order_item_id = 1
    current_addr_id = 1
    
    print("Generating Addresses...")
    for uid in customer_ids:
        addresses.append({
            "id": current_addr_id,
            "user_id": uid,
            "full_name": fake.name(),
            "phone_number": fake.phone_number()[:20],
            "address_line1": fake.street_address(),
            "address_line2": fake.secondary_address() if random.random() > 0.5 else "",
            "city": fake.city(),
            "state": fake.state(),
            "country": fake.country(),
            "pincode": fake.postcode(),
            "is_default": True,
            "created_at": fake.date_time_between(start_date="-1y", end_date="now").strftime("%Y-%m-%d %H:%M:%S")
        })
        current_addr_id += 1
    
    print("Generating Orders...")
    product_dict = {p['id']: p for p in products}
    
    for _ in range(num_orders):
        uid = random.choice(customer_ids)
        order_date = fake.date_time_between(start_date="-1y", end_date="now").strftime("%Y-%m-%d %H:%M:%S")
        
        orders.append({
            "id": current_order_id,
            "user_id": uid,
            "shipping_full_name": fake.name(),
            "shipping_phone_number": fake.phone_number()[:20],
            "shipping_address_line1": fake.street_address(),
            "shipping_address_line2": fake.secondary_address() if random.random() > 0.5 else "",
            "shipping_city": fake.city(),
            "shipping_state": fake.state(),
            "shipping_country": fake.country(),
            "shipping_pincode": fake.postcode(),
            "order_date": order_date,
            "status": "DELIVERED"
        })
        
        num_items = random.randint(1, 5)
        chosen_products = random.sample(product_ids, min(num_items, len(product_ids)))
        
        for pid in chosen_products:
            prod = product_dict[pid]
            order_items.append({
                "id": current_order_item_id,
                "order_id": current_order_id,
                "product_id": pid,
                "quantity": random.randint(1, 3),
                "purchased_price": prod['price'],
                "order_date": order_date
            })
            current_order_item_id += 1
            
        current_order_id += 1
        
    return reviews, favorites, orders, order_items, addresses
