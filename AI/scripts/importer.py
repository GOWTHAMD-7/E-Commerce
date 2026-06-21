import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from user_generator import generate_users
from product_pipeline import process_datasets
from interaction_generator import generate_interactions
from sql_generator import generate_users_sql, generate_products_sql, generate_reviews_sql, generate_favorites_sql, generate_orders_sql, generate_addresses_sql
from analytics import print_report

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    dataset_dir = os.path.join(base_dir, 'datasets')
    output_dir = os.path.join(base_dir, 'output')
    
    os.makedirs(output_dir, exist_ok=True)
    
    print("1. Generating Users...")
    users = generate_users()
    
    print("2. Processing Products...")
    products = process_datasets(dataset_dir)
    
    if not products:
        print("No products generated. Aborting.")
        return
        
    print("3. Generating Interactions...")
    reviews, favorites, orders, order_items, addresses = generate_interactions(users, products)
    
    print("4. Exporting to SQL...")
    generate_users_sql(users, output_dir)
    generate_products_sql(products, output_dir)
    generate_reviews_sql(reviews, output_dir)
    generate_favorites_sql(favorites, output_dir)
    generate_orders_sql(orders, order_items, output_dir)
    generate_addresses_sql(addresses, output_dir)
    
    print("5. Generating Report...")
    print_report(users, products, reviews, favorites, orders, order_items)
    print(f"\nSUCCESS! SQL files are available in: {output_dir}")

if __name__ == "__main__":
    main()
