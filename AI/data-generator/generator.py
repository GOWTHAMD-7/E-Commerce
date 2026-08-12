import os
import random

def generate_viewcount_update_sql():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    output_dir = os.path.join(base_dir, 'output')
    os.makedirs(output_dir, exist_ok=True)
    
    update_file = os.path.join(output_dir, 'update_viewcount.sql')
    
    lines = [
        "-- UPDATE PRODUCT VIEW COUNT SQL\n",
        "-- Sets a realistic random view_count (between 50 and 2500 views) for all existing products\n",
        "UPDATE product SET view_count = floor(random() * 2450 + 50)::bigint WHERE view_count IS NULL OR view_count = 0;\n"
    ]
    
    with open(update_file, 'w', encoding='utf-8') as f:
        f.writelines(lines)
        
    print(f"Successfully generated view count update SQL at: {update_file}")

if __name__ == '__main__':
    generate_viewcount_update_sql()
