#!/usr/bin/env python3
"""
Automated Audio Generation Script for Sinbad Memory Game
Generates Arabic child voice audio files for game instructions and items.

Usage:
    python3 scripts/generate-audio.py [--type all|instructions|items]

Requirements:
    pip install gtts  # Google Text-to-Speech (free)
    # OR use OpenAI TTS API for better quality
"""

import json
import os
from pathlib import Path
import argparse

# Audio content definitions
AUDIO_CONTENT = {
    'instructions': {
        'welcome': 'مرحباً بك في لعبة السندباد لتدريب الذاكرة',
        'get_ready': 'استعد! سنبدأ الآن',
        'watch_carefully': 'شاهد بعناية وحاول أن تتذكر',
        'time_to_answer': 'حان وقت الإجابة',
        'select_items': 'اختر العناصر التي شاهدتها',
        'correct': 'أحسنت! إجابة صحيحة',
        'incorrect': 'حاول مرة أخرى',
        'excellent': 'ممتاز! أنت رائع',
        'good_job': 'عمل جيد',
        'keep_trying': 'استمر في المحاولة',
        'level_complete': 'أحسنت! لقد أتممت المستوى',
        'next_question': 'السؤال التالي',
        'game_over': 'انتهت اللعبة',
    },
    'encouragement': {
        'great': 'رائع',
        'amazing': 'مذهل',
        'fantastic': 'خيالي',
        'wonderful': 'رائع جداً',
        'you_can_do_it': 'أنت تستطيع',
        'keep_going': 'استمر',
        'almost_there': 'أنت قريب جداً',
        'one_more_try': 'محاولة أخرى',
    },
    'numbers': {
        str(i): f'{i}' for i in range(1, 21)
    }
}

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

def slugify(text):
    """Convert Arabic text to filename-safe slug"""
    import re
    slug = re.sub(r'[^\w\s-]', '', text)
    slug = re.sub(r'[-\s]+', '-', slug)
    return slug.lower().strip('-')

def generate_with_gtts(text, output_path):
    """Generate audio using Google Text-to-Speech (free)"""
    try:
        from gtts import gTTS
        tts = gTTS(text=text, lang='ar', slow=False)
        tts.save(output_path)
        return True
    except ImportError:
        print("   ⚠️  gtts not installed. Install with: pip install gtts")
        return False
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False

def generate_with_openai(text, output_path):
    """Generate audio using OpenAI TTS API (paid, better quality)"""
    try:
        from openai import OpenAI
        client = OpenAI()
        
        response = client.audio.speech.create(
            model="tts-1",
            voice="nova",  # Female voice
            input=text,
            speed=0.9  # Slightly slower for children
        )
        
        response.stream_to_file(output_path)
        return True
    except ImportError:
        print("   ⚠️  openai not installed. Install with: pip install openai")
        return False
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False

def generate_audio_files(audio_type='all', use_openai=False):
    """Generate audio files"""
    output_dir = Path('public/audio')
    output_dir.mkdir(parents=True, exist_ok=True)
    
    generator = generate_with_openai if use_openai else generate_with_gtts
    generator_name = "OpenAI TTS" if use_openai else "Google TTS"
    
    print(f"\n🎵 Using {generator_name}")
    print("=" * 60)
    
    total_generated = 0
    
    # Generate instructions
    if audio_type in ['all', 'instructions']:
        print("\n📢 Generating instruction audio...")
        for key, text in AUDIO_CONTENT['instructions'].items():
            output_path = output_dir / f'instruction-{key}.mp3'
            if output_path.exists():
                print(f"   ⏭️  Skipping (exists): {key}")
                continue
            
            print(f"   🎤 Generating: {key}")
            print(f"      Text: {text}")
            if generator(text, str(output_path)):
                print(f"      ✅ Saved: {output_path.name}")
                total_generated += 1
    
    # Generate encouragement
    if audio_type in ['all', 'encouragement']:
        print("\n💪 Generating encouragement audio...")
        for key, text in AUDIO_CONTENT['encouragement'].items():
            output_path = output_dir / f'encouragement-{key}.mp3'
            if output_path.exists():
                print(f"   ⏭️  Skipping (exists): {key}")
                continue
            
            print(f"   🎤 Generating: {key}")
            if generator(text, str(output_path)):
                print(f"      ✅ Saved: {output_path.name}")
                total_generated += 1
    
    # Generate numbers
    if audio_type in ['all', 'numbers']:
        print("\n🔢 Generating number audio...")
        for key, text in AUDIO_CONTENT['numbers'].items():
            output_path = output_dir / f'number-{key}.mp3'
            if output_path.exists():
                print(f"   ⏭️  Skipping (exists): {key}")
                continue
            
            print(f"   🎤 Generating: {key}")
            if generator(text, str(output_path)):
                print(f"      ✅ Saved: {output_path.name}")
                total_generated += 1
    
    # Generate item names
    if audio_type in ['all', 'items']:
        print("\n🎨 Generating item name audio...")
        items = load_game_items()
        print(f"   Total items: {len(items)}")
        
        for idx, item in enumerate(items, 1):
            slug = slugify(item)
            output_path = output_dir / f'item-{slug}.mp3'
            
            if output_path.exists():
                print(f"   [{idx}/{len(items)}] ⏭️  Skipping: {item}")
                continue
            
            print(f"   [{idx}/{len(items)}] 🎤 Generating: {item}")
            if generator(item, str(output_path)):
                print(f"      ✅ Saved: {output_path.name}")
                total_generated += 1
    
    print("\n" + "=" * 60)
    print(f"✅ Audio generation complete!")
    print(f"   Generated: {total_generated} files")
    print(f"   Location: {output_dir}")
    
    return total_generated

def main():
    parser = argparse.ArgumentParser(description='Generate game audio files')
    parser.add_argument('--type', choices=['all', 'instructions', 'items', 'encouragement', 'numbers'], 
                       default='all', help='Type of audio to generate')
    parser.add_argument('--openai', action='store_true', help='Use OpenAI TTS (requires API key)')
    parser.add_argument('--list', action='store_true', help='List what would be generated')
    
    args = parser.parse_args()
    
    print("🎮 Sinbad Memory Game - Audio Generation Script")
    print("=" * 60)
    
    if args.list:
        print("\n📋 Audio files to generate:")
        print(f"\nInstructions: {len(AUDIO_CONTENT['instructions'])} files")
        for key in AUDIO_CONTENT['instructions'].keys():
            print(f"   - instruction-{key}.mp3")
        
        print(f"\nEncouragement: {len(AUDIO_CONTENT['encouragement'])} files")
        for key in AUDIO_CONTENT['encouragement'].keys():
            print(f"   - encouragement-{key}.mp3")
        
        print(f"\nNumbers: {len(AUDIO_CONTENT['numbers'])} files")
        
        items = load_game_items()
        print(f"\nItems: {len(items)} files")
        print(f"   (First 10: {', '.join(items[:10])}...)")
        
        print(f"\nTotal: {len(AUDIO_CONTENT['instructions']) + len(AUDIO_CONTENT['encouragement']) + len(AUDIO_CONTENT['numbers']) + len(items)} files")
        return
    
    # Generate
    generate_audio_files(args.type, args.openai)

if __name__ == '__main__':
    main()
