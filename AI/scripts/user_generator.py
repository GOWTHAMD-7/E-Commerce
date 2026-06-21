import bcrypt
from faker import Faker
from config import TOTAL_ADMINS, TOTAL_SELLERS, TOTAL_CUSTOMERS

fake = Faker()

def generate_users():
    users = []
    
    # Generate BCrypt hash for "password123"
    # Spring Security BCryptPasswordEncoder compatibility
    salt = bcrypt.gensalt(rounds=10)
    hashed_pw = bcrypt.hashpw(b"password123", salt).decode('utf-8')
    
    current_id = 1
    
    # 1. Admin
    users.append({
        "id": current_id,
        "name": "Super Admin",
        "email": "admin@gmail.com",
        "password": hashed_pw,
        "role": "ADMIN"
    })
    current_id += 1
    
    # 2. Sellers
    for i in range(1, TOTAL_SELLERS + 1):
        users.append({
            "id": current_id,
            "name": fake.company(),
            "email": f"seller{i}@gmail.com",
            "password": hashed_pw,
            "role": "SELLER"
        })
        current_id += 1
        
    # 3. Customers
    for i in range(1, TOTAL_CUSTOMERS + 1):
        users.append({
            "id": current_id,
            "name": fake.name(),
            "email": f"customer{i}@gmail.com",
            "password": hashed_pw,
            "role": "CUSTOMER"
        })
        current_id += 1
        
    return users
