import os
import random

def escape_sql(val):
    if val is None or str(val).lower() == 'nan':
        return "NULL"
    if isinstance(val, (int, float)):
        return str(val)
    s = str(val).replace("'", "''")
    return f"'{s}'"

def generate_users_sql(users, output_dir):
    lines = ["-- USERS SQL\n"]
    for u in users:
        sql = f"INSERT INTO app_user (id, name, email, password, role) VALUES ({u['id']}, {escape_sql(u['name'])}, {escape_sql(u['email'])}, {escape_sql(u['password'])}, {escape_sql(u['role'])});\n"
        lines.append(sql)
    
    if users:
        max_id = max(u['id'] for u in users)
        lines.append(f"SELECT setval('app_user_id_seq', {max_id});\n")
        
    with open(os.path.join(output_dir, 'users.sql'), 'w', encoding='utf-8') as f:
        f.writelines(lines)

def generate_products_sql(products, output_dir):
    lines_prod = ["-- PRODUCTS SQL\n"]
    lines_img = ["-- PRODUCT IMAGES\n"]
    
    for p in products:
        view_cnt = p.get('viewCount', p.get('view_count', random.randint(15, 650)))
        sql = f"INSERT INTO product (id, name, description, category, brand, price, stock, main_image, rating, review_count, view_count, seller_id) VALUES ({p['id']}, {escape_sql(p['name'])}, {escape_sql(p['description'])}, {escape_sql(p['category'])}, {escape_sql(p['brand'])}, {p['price']}, {p['stock']}, {escape_sql(p['mainImage'])}, {p['rating']}, {p['reviewCount']}, {view_cnt}, {p['seller_id']});\n"
        lines_prod.append(sql)
        
        for img in p['images']:
            if img.strip():
                lines_img.append(f"INSERT INTO product_images (product_id, image_url) VALUES ({p['id']}, {escape_sql(img)});\n")
            
    if products:
        max_id = max(p['id'] for p in products)
        lines_prod.append(f"SELECT setval('product_id_seq', {max_id});\n")
        
    with open(os.path.join(output_dir, 'products.sql'), 'w', encoding='utf-8') as f:
        f.writelines(lines_prod)
        f.write("\n")
        f.writelines(lines_img)

def generate_reviews_sql(reviews, output_dir):
    lines = ["-- REVIEWS SQL\n"]
    for r in reviews:
        sql = f"INSERT INTO product_reviews (id, product_id, user_id, rating, comment, created_at) VALUES ({r['id']}, {r['product_id']}, {r['user_id']}, {r['rating']}, {escape_sql(r['comment'])}, {escape_sql(r['created_at'])});\n"
        lines.append(sql)
        
    if reviews:
        max_id = max(r['id'] for r in reviews)
        lines.append(f"SELECT setval('product_reviews_id_seq', {max_id});\n")
        
    with open(os.path.join(output_dir, 'reviews.sql'), 'w', encoding='utf-8') as f:
        f.writelines(lines)

def generate_favorites_sql(favorites, output_dir):
    lines = ["-- FAVORITES SQL\n"]
    for user_id, product_id in favorites:
        sql = f"INSERT INTO user_favorites (user_id, product_id) VALUES ({user_id}, {product_id});\n"
        lines.append(sql)
        
    with open(os.path.join(output_dir, 'favorites.sql'), 'w', encoding='utf-8') as f:
        f.writelines(lines)

def generate_orders_sql(orders, order_items, output_dir):
    lines = ["-- ORDERS SQL\n"]
    for o in orders:
        sql = f"INSERT INTO orders (id, user_id, shipping_full_name, shipping_phone_number, shipping_address_line1, shipping_address_line2, shipping_city, shipping_state, shipping_country, shipping_pincode, status, order_date) VALUES ({o['id']}, {o['user_id']}, {escape_sql(o['shipping_full_name'])}, {escape_sql(o['shipping_phone_number'])}, {escape_sql(o['shipping_address_line1'])}, {escape_sql(o['shipping_address_line2'])}, {escape_sql(o['shipping_city'])}, {escape_sql(o['shipping_state'])}, {escape_sql(o['shipping_country'])}, {escape_sql(o['shipping_pincode'])}, {escape_sql(o.get('status', 'DELIVERED'))}, {escape_sql(o['order_date'])});\n"
        lines.append(sql)
        
    if orders:
        max_id = max(o['id'] for o in orders)
        lines.append(f"SELECT setval('orders_id_seq', {max_id});\n")
        
    lines.append("\n-- ORDER ITEMS SQL\n")
    for oi in order_items:
        sql = f"INSERT INTO order_item (id, order_id, product_id, quantity, purchased_price, order_date) VALUES ({oi['id']}, {oi['order_id']}, {oi['product_id']}, {oi['quantity']}, {oi['purchased_price']}, {escape_sql(oi['order_date'])});\n"
        lines.append(sql)
        
    if order_items:
        max_id = max(oi['id'] for oi in order_items)
        lines.append(f"SELECT setval('order_item_id_seq', {max_id});\n")
        
    with open(os.path.join(output_dir, 'orders.sql'), 'w', encoding='utf-8') as f:
        f.writelines(lines)

def generate_addresses_sql(addresses, output_dir):
    lines = ["-- ADDRESSES SQL\n"]
    for a in addresses:
        sql = f"INSERT INTO addresses (id, user_id, full_name, phone_number, address_line1, address_line2, city, state, country, pincode, is_default, created_at, updated_at) VALUES ({a['id']}, {a['user_id']}, {escape_sql(a['full_name'])}, {escape_sql(a['phone_number'])}, {escape_sql(a['address_line1'])}, {escape_sql(a['address_line2'])}, {escape_sql(a['city'])}, {escape_sql(a['state'])}, {escape_sql(a['country'])}, {escape_sql(a['pincode'])}, {'true' if a['is_default'] else 'false'}, {escape_sql(a['created_at'])}, {escape_sql(a['created_at'])});\n"
        lines.append(sql)
        
    if addresses:
        max_id = max(a['id'] for a in addresses)
        lines.append(f"SELECT setval('addresses_id_seq', {max_id});\n")
        
    with open(os.path.join(output_dir, 'addresses.sql'), 'w', encoding='utf-8') as f:
        f.writelines(lines)
