import argparse
from config import *
from data.generator import generate_synthetic_data

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--mode', choices=['demo', 'benchmark', 'evaluate', 'analyze', 'visualize'], default='demo')
    args = parser.parse_args()

    if args.mode == 'demo':
        print("Running demo mode...")
        df = generate_synthetic_data(num_users=NUM_USERS, num_items=NUM_ITEMS, density=DENSITY)
        print(f"Generated {len(df)} interactions.")
        print("Demo completed.")
    else:
        print(f"Mode {args.mode} not fully implemented in this lightweight version.")

if __name__ == "__main__":
    main()
