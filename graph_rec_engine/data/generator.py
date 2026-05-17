import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import random

def generate_synthetic_data(num_users=1000, num_items=2000, density=0.05, seed=42):
    np.random.seed(seed)
    random.seed(seed)
    
    num_interactions = int(num_users * num_items * density)
    
    users = np.random.randint(0, num_users, num_interactions)
    items = np.random.randint(0, num_items, num_interactions)
    
    ratings = np.random.randint(1, 6, num_interactions)
    
    end_date = datetime.now()
    start_date = end_date - timedelta(days=365)
    
    timestamps = [start_date + timedelta(seconds=random.randint(0, int((end_date - start_date).total_seconds())))
                  for _ in range(num_interactions)]
                  
    df = pd.DataFrame({
        'user_id': users,
        'item_id': items,
        'rating': ratings,
        'timestamp': timestamps
    })
    
    df = df.drop_duplicates(subset=['user_id', 'item_id'], keep='last')
    
    return df
