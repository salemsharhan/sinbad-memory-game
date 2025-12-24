# دليل إنشاء الملفات الصوتية - Sinbad Audio Guide

## نظرة عامة

يحتاج برنامج السندباد إلى ملفات صوتية بصوت أطفال عربي (6-12 سنة) لقراءة:
- أسماء العناصر (270 عنصر)
- التعليمات والإرشادات
- عبارات التشجيع
- الملاحظات والنتائج

---

## الخيارات المتاحة

### 1. استخدام خدمات Text-to-Speech (TTS)

#### أ. Google Cloud Text-to-Speech (موصى به)

**المميزات:**
- صوت عربي طبيعي جداً
- يدعم أصوات أطفال
- جودة عالية
- API سهل الاستخدام

**الخطوات:**

1. **إنشاء مشروع Google Cloud**
   - اذهب إلى [console.cloud.google.com](https://console.cloud.google.com)
   - أنشئ مشروعاً جديداً
   - فعّل Text-to-Speech API

2. **الحصول على API Key**
   - اذهب إلى APIs & Services → Credentials
   - أنشئ API Key
   - احفظ المفتاح

3. **تثبيت المكتبة**
   ```bash
   npm install @google-cloud/text-to-speech
   ```

4. **كود التوليد**
   ```javascript
   const textToSpeech = require('@google-cloud/text-to-speech');
   const fs = require('fs');
   const util = require('util');
   
   const client = new textToSpeech.TextToSpeechClient({
     apiKey: 'YOUR_API_KEY'
   });
   
   async function generateAudio(text, filename) {
     const request = {
       input: { text },
       voice: {
         languageCode: 'ar-XA',
         name: 'ar-XA-Wavenet-C', // صوت أنثى شبابي
         ssmlGender: 'FEMALE',
       },
       audioConfig: {
         audioEncoding: 'MP3',
         speakingRate: 0.9, // سرعة أبطأ قليلاً للأطفال
         pitch: 2.0, // نبرة أعلى (صوت طفولي)
       },
     };
     
     const [response] = await client.synthesizeSpeech(request);
     await fs.promises.writeFile(filename, response.audioContent, 'binary');
     console.log(`تم إنشاء: ${filename}`);
   }
   
   // مثال
   generateAudio('تفاحة', 'public/audio/تفاحة.mp3');
   ```

5. **توليد جميع الملفات**
   ```javascript
   const gameData = require('./src/assets/game-data.json');
   
   async function generateAllAudio() {
     // استخراج جميع العناصر
     const items = new Set();
     
     for (const level of Object.values(gameData.levels)) {
       for (const stage of Object.values(level.stages)) {
         for (const question of stage.questions) {
           question.requiredItems.forEach(item => items.add(item));
           question.distractorItems.forEach(item => items.add(item));
        }
       }
     }
     
     // توليد صوت لكل عنصر
     for (const item of items) {
       await generateAudio(item, `public/audio/${item}.mp3`);
       await new Promise(r => setTimeout(r, 1000)); // انتظار ثانية بين كل طلب
     }
   }
   
   generateAllAudio();
   ```

#### ب. Amazon Polly

**الخطوات:**

```javascript
const AWS = require('aws-sdk');
const fs = require('fs');

AWS.config.update({
  accessKeyId: 'YOUR_ACCESS_KEY',
  secretAccessKey: 'YOUR_SECRET_KEY',
  region: 'us-east-1'
});

const polly = new AWS.Polly();

async function generateAudio(text, filename) {
  const params = {
    Text: text,
    OutputFormat: 'mp3',
    VoiceId: 'Zeina', // صوت عربي أنثى
    Engine: 'neural',
    LanguageCode: 'arb'
  };
  
  const data = await polly.synthesizeSpeech(params).promise();
  await fs.promises.writeFile(filename, data.AudioStream);
  console.log(`تم إنشاء: ${filename}`);
}
```

#### ج. Microsoft Azure Speech

```javascript
const sdk = require('microsoft-cognitiveservices-speech-sdk');
const fs = require('fs');

const speechConfig = sdk.SpeechConfig.fromSubscription(
  'YOUR_KEY',
  'YOUR_REGION'
);

speechConfig.speechSynthesisVoiceName = 'ar-SA-ZariyahNeural'; // صوت أنثى سعودي

async function generateAudio(text, filename) {
  const audioConfig = sdk.AudioConfig.fromAudioFileOutput(filename);
  const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);
  
  return new Promise((resolve, reject) => {
    synthesizer.speakTextAsync(
      text,
      result => {
        synthesizer.close();
        resolve();
      },
      error => {
        synthesizer.close();
        reject(error);
      }
    );
  });
}
```

---

### 2. تسجيل صوتي احترافي

إذا كنت تريد جودة أعلى وصوت طفل حقيقي:

#### الخطوات

1. **التحضير**
   - قائمة بجميع العناصر (270 عنصر)
   - قائمة بالتعليمات والعبارات
   - استوديو تسجيل أو ميكروفون جيد
   - طفل/طفلة (6-12 سنة) بنطق واضح

2. **التسجيل**
   - سجل كل عنصر في ملف منفصل
   - استخدم برنامج Audacity (مجاني)
   - تأكد من:
     * صوت واضح بدون ضوضاء
     * مستوى صوت ثابت
     * سرعة نطق مناسبة للأطفال

3. **المعالجة**
   ```bash
   # تثبيت ffmpeg
   sudo apt install ffmpeg
   
   # تحويل إلى MP3
   ffmpeg -i input.wav -codec:a libmp3lame -b:a 128k output.mp3
   
   # تطبيع مستوى الصوت
   ffmpeg -i input.mp3 -af "loudnorm" output.mp3
   ```

4. **التسمية**
   - سمّ الملفات بنفس أسماء العناصر في game-data.json
   - مثال: `تفاحة.mp3`, `برتقالة.mp3`

---

## قائمة الملفات الصوتية المطلوبة

### 1. أسماء العناصر (270 ملف)

يمكنك استخراج القائمة الكاملة من game-data.json:

```javascript
const fs = require('fs');
const gameData = require('./src/assets/game-data.json');

const items = new Set();

for (const level of Object.values(gameData.levels)) {
  for (const stage of Object.values(level.stages)) {
    for (const question of stage.questions) {
      question.requiredItems.forEach(item => items.add(item));
      question.distractorItems.forEach(item => items.add(item));
    }
  }
}

fs.writeFileSync('audio-list.txt', Array.from(items).sort().join('\n'));
console.log(`عدد العناصر: ${items.size}`);
```

### 2. التعليمات والإرشادات

أنشئ ملفات صوتية لـ:

```
instructions/welcome.mp3 - "مرحباً بك في برنامج السندباد"
instructions/listen-carefully.mp3 - "استمع جيداً للعناصر التالية"
instructions/select-items.mp3 - "اختر العناصر التي سمعتها"
instructions/well-done.mp3 - "أحسنت!"
instructions/try-again.mp3 - "حاول مرة أخرى"
instructions/correct.mp3 - "إجابة صحيحة!"
instructions/incorrect.mp3 - "إجابة خاطئة"
instructions/level-complete.mp3 - "أكملت المستوى بنجاح!"
instructions/stage-complete.mp3 - "أكملت المرحلة!"
```

### 3. عبارات التشجيع

```
encouragement/great-job.mp3 - "عمل رائع!"
encouragement/excellent.mp3 - "ممتاز!"
encouragement/keep-going.mp3 - "استمر!"
encouragement/you-can-do-it.mp3 - "أنت قادر على ذلك!"
encouragement/almost-there.mp3 - "أوشكت على الانتهاء!"
```

---

## دمج الصوت في التطبيق

### 1. تنظيم الملفات

```
public/
  audio/
    items/
      تفاحة.mp3
      برتقالة.mp3
      ...
    instructions/
      welcome.mp3
      listen-carefully.mp3
      ...
    encouragement/
      great-job.mp3
      excellent.mp3
      ...
```

### 2. إنشاء Audio Manager

```javascript
// src/lib/audioManager.js

class AudioManager {
  constructor() {
    this.audioCache = new Map();
    this.currentAudio = null;
  }
  
  async preloadAudio(src) {
    if (this.audioCache.has(src)) {
      return this.audioCache.get(src);
    }
    
    const audio = new Audio(src);
    await new Promise((resolve, reject) => {
      audio.addEventListener('canplaythrough', resolve, { once: true });
      audio.addEventListener('error', reject, { once: true });
      audio.load();
    });
    
    this.audioCache.set(src, audio);
    return audio;
  }
  
  async play(src) {
    try {
      // إيقاف الصوت الحالي إن وجد
      if (this.currentAudio) {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      }
      
      const audio = await this.preloadAudio(src);
      this.currentAudio = audio;
      
      await audio.play();
      
      return new Promise((resolve) => {
        audio.addEventListener('ended', resolve, { once: true });
      });
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  }
  
  async playSequence(srcs, delayMs = 500) {
    for (const src of srcs) {
      await this.play(src);
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  
  stop() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
    }
  }
}

export const audioManager = new AudioManager();
```

### 3. استخدام في المكونات

```javascript
// في GamePlay.jsx

import { audioManager } from '../lib/audioManager';

function GamePlay() {
  const playInstructions = async () => {
    await audioManager.play('/audio/instructions/listen-carefully.mp3');
  };
  
  const playItems = async (items) => {
    const audioFiles = items.map(item => `/audio/items/${item}.mp3`);
    await audioManager.playSequence(audioFiles, 800);
  };
  
  const playFeedback = async (isCorrect) => {
    const file = isCorrect 
      ? '/audio/instructions/correct.mp3'
      : '/audio/instructions/incorrect.mp3';
    await audioManager.play(file);
  };
  
  // ...
}
```

---

## التكاليف المتوقعة

### Google Cloud TTS

- **السعر**: $4 لكل مليون حرف (WaveNet voices)
- **لبرنامج السندباد**:
  * 270 عنصر × متوسط 10 أحرف = 2,700 حرف
  * 20 تعليمة × متوسط 30 حرف = 600 حرف
  * **الإجمالي**: ~3,300 حرف = **$0.01** (سنت واحد!)

### Amazon Polly

- **السعر**: $4 لكل مليون حرف (Neural voices)
- **التكلفة المتوقعة**: ~$0.01

### Azure Speech

- **السعر**: $16 لكل مليون حرف (Neural voices)
- **التكلفة المتوقعة**: ~$0.05

### التسجيل الاحترافي

- **تكلفة الاستوديو**: $50-200 للساعة
- **الوقت المتوقع**: 2-3 ساعات
- **التكلفة الإجمالية**: $100-600

---

## نصائح للحصول على أفضل جودة

### 1. لـ TTS

✅ استخدم Neural/WaveNet voices (أفضل جودة)
✅ اضبط speaking rate على 0.85-0.95 (أبطأ قليلاً)
✅ اضبط pitch على 1.5-2.5 (صوت أطفال)
✅ استخدم SSML للتحكم الدقيق:

```xml
<speak>
  <prosody rate="90%" pitch="+2st">
    تفاحة
  </prosody>
</speak>
```

### 2. للتسجيل

✅ استخدم ميكروفون جيد (USB condenser mic)
✅ سجل في مكان هادئ
✅ اطلب من الطفل النطق بوضوح وببطء
✅ سجل كل عنصر 2-3 مرات واختر الأفضل
✅ طبّع مستوى الصوت (loudness normalization)

---

## سكريبت توليد تلقائي كامل

```javascript
// generate-audio.js

const textToSpeech = require('@google-cloud/text-to-speech');
const fs = require('fs').promises;
const path = require('path');

const client = new textToSpeech.TextToSpeechClient({
  apiKey: process.env.GOOGLE_TTS_API_KEY
});

const gameData = require('./src/assets/game-data.json');

async function generateAudio(text, outputPath) {
  const request = {
    input: { text },
    voice: {
      languageCode: 'ar-XA',
      name: 'ar-XA-Wavenet-C',
      ssmlGender: 'FEMALE',
    },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: 0.9,
      pitch: 2.0,
    },
  };
  
  const [response] = await client.synthesizeSpeech(request);
  await fs.writeFile(outputPath, response.audioContent, 'binary');
  console.log(`✓ ${text} → ${outputPath}`);
}

async function main() {
  // إنشاء المجلدات
  await fs.mkdir('public/audio/items', { recursive: true });
  await fs.mkdir('public/audio/instructions', { recursive: true });
  await fs.mkdir('public/audio/encouragement', { recursive: true });
  
  // جمع جميع العناصر
  const items = new Set();
  for (const level of Object.values(gameData.levels)) {
    for (const stage of Object.values(level.stages)) {
      for (const question of stage.questions) {
        question.requiredItems.forEach(item => items.add(item));
        question.distractorItems.forEach(item => items.add(item));
      }
    }
  }
  
  // توليد صوت العناصر
  console.log(`\nتوليد ${items.size} ملف صوتي للعناصر...`);
  let count = 0;
  for (const item of items) {
    await generateAudio(item, `public/audio/items/${item}.mp3`);
    count++;
    if (count % 10 === 0) {
      console.log(`تم إنشاء ${count}/${items.size}`);
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  
  // توليد التعليمات
  const instructions = {
    'welcome': 'مرحباً بك في برنامج السندباد',
    'listen-carefully': 'استمع جيداً للعناصر التالية',
    'select-items': 'اختر العناصر التي سمعتها',
    'well-done': 'أحسنت',
    'try-again': 'حاول مرة أخرى',
    'correct': 'إجابة صحيحة',
    'incorrect': 'إجابة خاطئة',
    'level-complete': 'أكملت المستوى بنجاح',
    'stage-complete': 'أكملت المرحلة',
  };
  
  console.log(`\nتوليد ${Object.keys(instructions).length} ملف تعليمات...`);
  for (const [key, text] of Object.entries(instructions)) {
    await generateAudio(text, `public/audio/instructions/${key}.mp3`);
    await new Promise(r => setTimeout(r, 500));
  }
  
  // توليد عبارات التشجيع
  const encouragement = {
    'great-job': 'عمل رائع',
    'excellent': 'ممتاز',
    'keep-going': 'استمر',
    'you-can-do-it': 'أنت قادر على ذلك',
    'almost-there': 'أوشكت على الانتهاء',
  };
  
  console.log(`\nتوليد ${Object.keys(encouragement).length} عبارة تشجيع...`);
  for (const [key, text] of Object.entries(encouragement)) {
    await generateAudio(text, `public/audio/encouragement/${key}.mp3`);
    await new Promise(r => setTimeout(r, 500));
  }
  
  console.log('\n✅ تم إنشاء جميع الملفات الصوتية بنجاح!');
}

main().catch(console.error);
```

**تشغيل السكريبت:**

```bash
# تثبيت المكتبة
npm install @google-cloud/text-to-speech

# تعيين API Key
export GOOGLE_TTS_API_KEY="your-api-key"

# تشغيل
node generate-audio.js
```

---

## الخلاصة

الآن لديك كل ما تحتاجه لإنشاء الملفات الصوتية! 🎵

**الخيار الموصى به:**
- استخدم Google Cloud TTS (أفضل جودة وأرخص سعر)
- شغّل السكريبت أعلاه لتوليد جميع الملفات تلقائياً
- التكلفة الإجمالية: أقل من $0.05

**للدعم:**
- support@sinbad-game.com
