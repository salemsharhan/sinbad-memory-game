# Sinbad Memory Game - Final Documentation

## 📋 Project Overview

**Sinbad Memory Training Game** is a comprehensive web application designed to help children aged 6-12 years, particularly those with dyslexia (الدسلكسيا), improve their memory skills through structured, engaging gameplay.

### Key Features

The application provides a complete memory training system with three difficulty levels (A, B, C) and three stages per level, offering progressive challenges. Teachers can manage multiple students, track their progress through detailed analytics, and generate certificates for achievements. The interface features dyslexia-friendly design with cream/beige backgrounds, high-contrast text, and large readable fonts. Full Arabic RTL support ensures natural reading flow, while child-friendly animations and colorful visuals keep young learners engaged.

---

## 🏗️ Technical Architecture

### Technology Stack

The frontend is built with **React 19** and **Vite** for fast development and optimal performance. **Tailwind CSS 4** provides utility-first styling with custom dyslexia-friendly color palette. **Wouter** handles client-side routing with minimal overhead. **Recharts** powers data visualization for progress tracking.

The backend uses **Supabase** (PostgreSQL) for database, authentication, and real-time features. Row Level Security (RLS) ensures data privacy and multi-tenancy. **Supabase Auth** manages teacher authentication with email/password.

Additional libraries include **jsPDF** and **html2canvas** for certificate generation, **Google TTS (gTTS)** for Arabic audio narration, and **Cairo** font from Google Fonts for optimal Arabic text rendering.

### Database Schema

The system uses six main tables. The **teachers** table stores teacher accounts with email, password hash, and profile information. The **students** table contains student profiles with name, student number, current level/stage, and teacher association. The **game_sessions** table records each gameplay session with student ID, level, stage, timing configuration, and completion status. The **game_results** table stores detailed results including score, accuracy, correct/incorrect answers, and timestamps. The **level_configurations** table allows customization of display timings and wait periods per level. The **achievements** table tracks student milestones and certificate generation.

All tables implement RLS policies to ensure teachers can only access their own students' data.

---

## 🎮 Game Mechanics

### Game Flow

The game follows a seven-phase structure. **Phase 1 (Welcome)** introduces the student and explains the task. **Phase 2 (Get Ready)** provides a countdown to prepare. **Phase 3 (Show Items)** displays memory items sequentially with audio narration. **Phase 4 (Waiting)** allows time for memory consolidation. **Phase 5 (Question)** presents all items (correct + distractors) for selection. **Phase 6 (Feedback)** shows results with visual and audio feedback. **Phase 7 (Complete)** displays final score and offers certificate if passed.

### Difficulty Progression

**Level A** starts with 3-4 items to remember and 6-8 distractors. **Level B** increases to 5-6 items with 10-12 distractors. **Level C** challenges with 7-8 items and 14-16 distractors. Each level has three stages with increasing complexity.

### Timing Configurations

Three timing modes accommodate different learning speeds. **Short mode** displays items for 30, 23, 17, 14, 10, and 8 seconds across stages. **Medium mode** uses 32, 27, 20, 15, 12, and 9 seconds. **Long mode** provides 34, 29, 23, 17, 14, and 11 seconds. Teachers can customize these timings in settings.

### Scoring System

Points are awarded based on accuracy. Each correct selection earns 1 point. Incorrect selections deduct 0.5 points. The final score is calculated as (Correct × 1) - (Incorrect × 0.5). Accuracy percentage is (Correct / Total Questions) × 100. Students need ≥60% accuracy to pass and receive a certificate.

---

## 👨‍🏫 Teacher Dashboard

### Student Management

Teachers can add new students with name and student number, view all students in a grid or table layout, search and filter students by name or number, edit student information and current progress, and delete students with confirmation. The interface provides quick access to start new game sessions and view detailed student profiles.

### Analytics & Reporting

The dashboard displays total students count, active sessions this week, average student performance, and recent activity feed. Individual student pages show progress over time with line charts, level distribution with pie charts, stage-by-stage performance with bar charts, session history table with details, and achievement badges based on milestones.

### Certificate Generation

When students pass a stage (≥60% accuracy), teachers can generate beautiful certificates. These include student name and achievement details, level and stage completed, performance statistics (score, accuracy, correct answers), motivational messages, decorative borders and corner elements, and teacher/admin signature lines. Certificates can be downloaded as PDF or printed directly.

---

## 🎨 Design System

### Dyslexia-Friendly Colors

The primary cream background (#FAF8F3) reduces eye strain. Beige accent (#F5E6D3) provides subtle contrast. Primary blue (#4A90E2) draws attention without overwhelming. Success green (#10B981) indicates positive feedback. Warning orange (#F59E0B) highlights important information. Error red (#EF4444) signals mistakes. Dark text (#2D3748) ensures readability on light backgrounds.

### Typography

The **Cairo** font family from Google Fonts is optimized for Arabic text with excellent readability. Font sizes follow a clear hierarchy: headings use 2.5rem-4rem (40-64px), body text uses 1.25rem-1.5rem (20-24px), and small text uses 1rem (16px). Line height of 1.6 improves readability, while letter spacing of 0.02em prevents crowding.

### Components

Buttons feature large touch targets (min 48px height), rounded corners (12px radius), and clear hover states. Cards use soft shadows (0 4px 6px rgba(0,0,0,0.1)), rounded corners (16px radius), and ample padding (24px). Forms have large input fields (min 48px height), clear labels above inputs, and inline validation messages. All components support RTL layout automatically.

---

## 📁 Project Structure

```
sinbad-memory-game/
├── public/
│   ├── game-images/          # 270 game item images
│   ├── audio/                 # Arabic audio narration files
│   └── favicon.ico
├── src/
│   ├── assets/
│   │   └── game-data.json     # Game levels, stages, items
│   ├── components/
│   │   └── Certificate.jsx    # Certificate generation
│   ├── contexts/
│   │   └── AuthContext.jsx    # Authentication state
│   ├── lib/
│   │   ├── supabaseClient.js  # Supabase configuration
│   │   ├── audioManager.js    # Audio playback management
│   │   └── api/               # API helper functions
│   │       ├── students.js
│   │       └── game.js
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Students.jsx
│   │   ├── StudentDetail.jsx
│   │   ├── GameEntry.jsx
│   │   ├── GamePlay.jsx
│   │   ├── GameResults.jsx
│   │   └── Settings.jsx
│   ├── App.jsx                # Main app and routing
│   ├── main.jsx               # Entry point
│   └── index.css              # Global styles
├── supabase/
│   └── migrations/
│       └── 20241224_create_sinbad_tables.sql
├── scripts/
│   ├── generate-images.py     # Automated image generation
│   └── generate-audio.py      # Automated audio generation
├── package.json
├── vite.config.js
├── tailwind.config.js
├── README.md
├── DEPLOYMENT.md
├── AUDIO_GUIDE.md
├── TESTING.md
└── TODO.md
```

---

## 🚀 Deployment Guide

### Prerequisites

You need a Supabase account (free tier available), Node.js 18+ and npm/pnpm, and a hosting platform (Vercel, Netlify, or custom VPS).

### Step-by-Step Deployment

**1. Set up Supabase**

Create a new project at supabase.com. Go to SQL Editor and execute the migration file from `supabase/migrations/20241224_create_sinbad_tables.sql`. Copy your Project URL and anon key from Settings → API.

**2. Configure Environment**

Create a `.env` file with:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**3. Install Dependencies**

Run `npm install` to install all required packages.

**4. Build Application**

Run `npm run build` to create production build in `dist/` directory.

**5. Deploy to Vercel**

Install Vercel CLI with `npm i -g vercel`. Run `vercel` and follow prompts. Add environment variables in Vercel dashboard. Your app will be live at `https://your-app.vercel.app`.

**6. Deploy to Netlify**

Install Netlify CLI with `npm i -g netlify-cli`. Run `netlify deploy --prod`. Add environment variables in Netlify dashboard. Your app will be live at `https://your-app.netlify.app`.

---

## 🎵 Audio Generation

### Using Google TTS (Free)

Install gTTS with `pip install gtts`. Run the generation script with `python3 scripts/generate-audio.py --type all`. Audio files will be created in `public/audio/`. Total time is approximately 5-10 minutes for all files.

### Using OpenAI TTS (Better Quality)

Set your API key with `export OPENAI_API_KEY="your-key"`. Install OpenAI SDK with `pip install openai`. Run with OpenAI flag: `python3 scripts/generate-audio.py --type all --openai`. Cost is approximately $3-5 for all audio files. Voice quality is significantly better for children.

### Audio Files Needed

The system requires 6 instruction files (welcome, get-ready, watch-carefully, correct, excellent, try-again), 8 encouragement files (great, amazing, fantastic, wonderful, you-can-do-it, keep-going, almost-there, one-more-try), 20 number files (1-20 in Arabic), and 270 item name files (one for each game item).

---

## 🖼️ Image Generation

### Automated Generation

Run the image generation script with `python3 scripts/generate-images.py --batch-size 10`. Images will be created in `public/game-images/`. The script automatically skips existing images and generates only missing ones.

### Manual Generation

For custom or specific images, use the format: child-friendly colorful cartoon illustration of [item name], educational style, simple background, bright colors, suitable for children aged 6-12. Save as PNG format in `public/game-images/` with filename `{item-slug}.png`.

### Image Requirements

All images should be 512x512 pixels minimum, PNG format with transparency, consistent cartoon style across all items, bright and engaging colors, simple and clear subjects, and culturally appropriate for Arabic-speaking children.

---

## 🔧 Maintenance & Updates

### Adding New Levels

Edit `src/assets/game-data.json` to add new level data. Update database with new level configurations. Generate images for new items. Generate audio for new item names. Test thoroughly before deployment.

### Updating Timing Configurations

Teachers can update timings through Settings page. Changes are stored in `level_configurations` table. New sessions use updated timings immediately. Historical data remains unchanged.

### Backing Up Data

Supabase provides automatic daily backups. Export data manually from Supabase dashboard if needed. Store backups securely offsite. Test restore procedures regularly.

---

## 📊 Analytics & Monitoring

### Built-in Analytics

The system tracks total sessions per student, average scores and accuracy rates, time spent per level/stage, completion rates, and achievement milestones. All data is visualized in student detail pages with interactive charts.

### Performance Monitoring

Monitor page load times (target < 3 seconds), API response times (target < 500ms), error rates (target < 1%), and user engagement metrics. Use Vercel Analytics or Google Analytics for additional insights.

---

## 🐛 Troubleshooting

### Common Issues

**Images not loading**: Check file paths and names match game data. Verify images exist in `public/game-images/`. Check browser console for 404 errors.

**Audio not playing**: Verify audio files exist in `public/audio/`. Check browser audio permissions. Test with different browsers.

**Database connection errors**: Verify Supabase URL and key are correct. Check RLS policies allow access. Verify network connectivity.

**Authentication issues**: Clear browser cookies and cache. Check Supabase Auth settings. Verify email/password are correct.

---

## 📞 Support & Contact

### Documentation

Refer to README.md for setup instructions, DEPLOYMENT.md for deployment details, AUDIO_GUIDE.md for audio generation, and TESTING.md for testing procedures.

### Community

GitHub repository: https://github.com/salemsharhan/sinbad-memory-game
Issues and bug reports: Use GitHub Issues
Feature requests: Submit via GitHub Discussions

---

## 📄 License & Credits

### License

This project is licensed under MIT License. Free to use, modify, and distribute. Attribution appreciated but not required.

### Credits

Developed with ❤️ for helping children improve their memory skills. Based on Memory Booster program methodology. Designed specifically for Arabic-speaking children with dyslexia. Special thanks to all educators and therapists who provided feedback.

---

## 🎯 Future Enhancements

### Planned Features

Multiplayer mode for competitive gameplay, additional game types (matching, sequencing, etc.), parent portal for home practice, mobile app (React Native), offline mode with service workers, advanced analytics with AI insights, integration with learning management systems, and multi-language support (English, French, etc.).

### Contribution

Contributions are welcome! Fork the repository, create a feature branch, make your changes with tests, submit a pull request with clear description. Please follow the existing code style and add tests for new features.

---

**Thank you for using Sinbad Memory Game! Together, we're helping children build stronger memory skills. 🌟**
