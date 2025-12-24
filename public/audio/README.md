# Audio Files for Sinbad Memory Game

This directory contains Arabic audio narration files for the game.

## Audio Files Needed

### Instructions (6 files)
- `instruction-welcome.mp3` - "مرحباً بك في لعبة السندباد"
- `instruction-get-ready.mp3` - "استعد! سنبدأ الآن"
- `instruction-watch-carefully.mp3` - "شاهد بعناية وحاول أن تتذكر"
- `instruction-correct.mp3` - "أحسنت! إجابة صحيحة"
- `instruction-excellent.mp3` - "ممتاز! أنت رائع"
- `instruction-try-again.mp3` - "حاول مرة أخرى"

### Item Names (270 files)
- Format: `item-{slug}.mp3`
- Example: `item-apple.mp3` for "تفاحة"

## Generation

Use the provided script to generate all audio files:

\`\`\`bash
# Install dependencies
pip install gtts

# Generate all audio
python3 scripts/generate-audio.py --type all

# Or generate specific types
python3 scripts/generate-audio.py --type instructions
python3 scripts/generate-audio.py --type items
\`\`\`

## Alternative: OpenAI TTS (Better Quality)

For higher quality child-friendly voice:

\`\`\`bash
# Set your OpenAI API key
export OPENAI_API_KEY="your-key-here"

# Generate with OpenAI
python3 scripts/generate-audio.py --type all --openai
\`\`\`

Cost: ~$0.015 per 1000 characters
Total cost for all audio: < $5
