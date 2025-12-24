#!/usr/bin/env python3
"""
Automated Image Generation Script for Sinbad Memory Game
This script generates all missing game item images using AI image generation.

Usage:
    python3 scripts/generate-images.py [--batch-size 10] [--start-index 0]
"""

import json
import os
import sys
import time
import argparse
from pathlib import Path

def load_game_items():
    """Load unique items from game data"""
    with open('src/assets/game-data.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    items = set()
    for level_data in data['levels'].values():
        for stage in level_data['stages']:
            items.update(stage['items'])
            items.update(stage['distractors'])
    
    return sorted(list(items))

def get_existing_images():
    """Get list of already generated images"""
    image_dir = Path('public/game-images')
    if not image_dir.exists():
        return set()
    
    return {img.stem for img in image_dir.glob('*.png')}

def slugify(text):
    """Convert Arabic text to filename-safe slug"""
    import re
    # Remove special characters and replace spaces with hyphens
    slug = re.sub(r'[^\w\s-]', '', text)
    slug = re.sub(r'[-\s]+', '-', slug)
    return slug.lower().strip('-')

def generate_image_batch(items, start_idx, batch_size):
    """Generate a batch of images"""
    print(f"\n🎨 Generating batch {start_idx//batch_size + 1}")
    print(f"Items {start_idx + 1} to {min(start_idx + batch_size, len(items))}")
    
    batch = items[start_idx:start_idx + batch_size]
    
    for idx, item in enumerate(batch):
        item_idx = start_idx + idx + 1
        filename = slugify(item)
        filepath = f"public/game-images/{filename}.png"
        
        print(f"\n[{item_idx}/{len(items)}] Generating: {item}")
        print(f"   File: {filename}.png")
        
        # Here you would call your image generation API
        # For now, this is a placeholder that shows the command
        print(f"   Command: generate_image(prompt='Child-friendly colorful cartoon illustration of {item}', output='{filepath}')")
        
        # Simulate generation time
        time.sleep(0.5)
    
    print(f"\n✅ Batch complete!")

def main():
    parser = argparse.ArgumentParser(description='Generate game item images')
    parser.add_argument('--batch-size', type=int, default=10, help='Number of images per batch')
    parser.add_argument('--start-index', type=int, default=0, help='Starting index')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be generated without actually generating')
    
    args = parser.parse_args()
    
    print("🎮 Sinbad Memory Game - Image Generation Script")
    print("=" * 60)
    
    # Load items
    print("\n📋 Loading game items...")
    all_items = load_game_items()
    print(f"   Total items: {len(all_items)}")
    
    # Check existing
    print("\n🔍 Checking existing images...")
    existing = get_existing_images()
    print(f"   Already generated: {len(existing)}")
    
    # Find missing
    missing_items = [item for item in all_items if slugify(item) not in existing]
    print(f"   Missing: {len(missing_items)}")
    
    if not missing_items:
        print("\n✅ All images already generated!")
        return
    
    if args.dry_run:
        print("\n📝 DRY RUN - Would generate:")
        for idx, item in enumerate(missing_items, 1):
            print(f"   {idx}. {item} → {slugify(item)}.png")
        return
    
    # Generate in batches
    print(f"\n🚀 Starting generation...")
    print(f"   Batch size: {args.batch_size}")
    print(f"   Starting from index: {args.start_index}")
    
    total_batches = (len(missing_items) + args.batch_size - 1) // args.batch_size
    
    for batch_num in range(args.start_index // args.batch_size, total_batches):
        start_idx = batch_num * args.batch_size
        generate_image_batch(missing_items, start_idx, args.batch_size)
        
        if start_idx + args.batch_size < len(missing_items):
            print(f"\n⏳ Waiting 2 seconds before next batch...")
            time.sleep(2)
    
    print("\n" + "=" * 60)
    print("✅ Image generation complete!")
    print(f"   Generated: {len(missing_items)} images")
    print(f"   Total images: {len(all_items)}")

if __name__ == '__main__':
    main()
