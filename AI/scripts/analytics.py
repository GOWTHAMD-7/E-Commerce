def print_report(users, products, reviews, favorites, orders, order_items):
    print("=" * 40)
    print("       AI DATA GENERATOR REPORT")
    print("=" * 40)
    
    sellers = [u for u in users if u['role'] == 'SELLER']
    customers = [u for u in users if u['role'] == 'CUSTOMER']
    
    print(f"Total Users: {len(users)}")
    print(f"  - Admins: {len(users) - len(sellers) - len(customers)}")
    print(f"  - Sellers: {len(sellers)}")
    print(f"  - Customers: {len(customers)}")
    
    print("\nProducts:")
    print(f"  - Total Generated: {len(products)}")
    
    categories = {}
    for p in products:
        categories[p['category']] = categories.get(p['category'], 0) + 1
        
    print("  - By Category:")
    for cat, count in sorted(categories.items(), key=lambda x: x[1], reverse=True):
        print(f"      {cat}: {count}")
        
    print("\nInteractions:")
    print(f"  - Reviews: {len(reviews)}")
    print(f"  - Favorites: {len(favorites)}")
    print(f"  - Orders: {len(orders)}")
    print(f"  - Order Items: {len(order_items)}")
    
    print("=" * 40)
