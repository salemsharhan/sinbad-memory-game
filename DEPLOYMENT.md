# دليل النشر - Sinbad Memory Game

## نظرة عامة

هذا الدليل يشرح كيفية نشر تطبيق السندباد على منصات مختلفة.

---

## المتطلبات الأساسية

قبل البدء، تأكد من:

✅ إنشاء مشروع Supabase وتشغيل migration
✅ الحصول على SUPABASE_URL و SUPABASE_ANON_KEY
✅ اختبار التطبيق محلياً (`npm run dev`)
✅ بناء التطبيق بنجاح (`npm run build`)

---

## 1. النشر على Vercel (موصى به)

### لماذا Vercel؟
- نشر سريع وسهل
- SSL مجاني
- CDN عالمي
- دعم ممتاز لـ React/Vite

### الخطوات

#### أ. عبر واجهة Vercel

1. **ادفع الكود إلى GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/your-username/sinbad-game.git
   git push -u origin main
   ```

2. **اذهب إلى Vercel**
   - افتح [vercel.com](https://vercel.com)
   - سجل الدخول بحساب GitHub
   - اضغط "New Project"

3. **استورد المشروع**
   - اختر repository: `sinbad-game`
   - Framework Preset: Vite
   - Root Directory: `./`

4. **أضف Environment Variables**
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

5. **اضغط Deploy**
   - انتظر 1-2 دقيقة
   - احصل على رابط التطبيق: `https://sinbad-game.vercel.app`

#### ب. عبر CLI

```bash
# تثبيت Vercel CLI
npm install -g vercel

# تسجيل الدخول
vercel login

# النشر
vercel

# إضافة Environment Variables
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY

# النشر للإنتاج
vercel --prod
```

---

## 2. النشر على Netlify

### الخطوات

1. **ادفع الكود إلى GitHub** (نفس الخطوات أعلاه)

2. **اذهب إلى Netlify**
   - افتح [netlify.com](https://netlify.com)
   - سجل الدخول
   - اضغط "Add new site" → "Import an existing project"

3. **اختر GitHub**
   - اختر repository: `sinbad-game`

4. **إعدادات البناء**
   ```
   Build command: npm run build
   Publish directory: dist
   ```

5. **أضف Environment Variables**
   - اذهب إلى Site settings → Environment variables
   - أضف:
     ```
     VITE_SUPABASE_URL=https://your-project.supabase.co
     VITE_SUPABASE_ANON_KEY=your-anon-key
     ```

6. **اضغط Deploy**
   - احصل على رابط: `https://sinbad-game.netlify.app`

---

## 3. النشر على خادم خاص (VPS)

### المتطلبات
- خادم Linux (Ubuntu 22.04+)
- Nginx
- Node.js 18+
- Domain name (اختياري)

### الخطوات

#### 1. تحضير الخادم

```bash
# تحديث النظام
sudo apt update && sudo apt upgrade -y

# تثبيت Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# تثبيت Nginx
sudo apt install -y nginx

# تثبيت PM2 لإدارة التطبيقات
sudo npm install -g pm2
```

#### 2. رفع الملفات

```bash
# على جهازك المحلي
npm run build
scp -r dist/* user@your-server:/var/www/sinbad-game/
```

أو استخدم Git:

```bash
# على الخادم
cd /var/www
git clone https://github.com/your-username/sinbad-game.git
cd sinbad-game
npm install
npm run build
```

#### 3. إعداد Nginx

```bash
sudo nano /etc/nginx/sites-available/sinbad-game
```

أضف:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    root /var/www/sinbad-game/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

فعّل الموقع:

```bash
sudo ln -s /etc/nginx/sites-available/sinbad-game /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 4. إعداد SSL (HTTPS)

```bash
# تثبيت Certbot
sudo apt install -y certbot python3-certbot-nginx

# الحصول على شهادة SSL
sudo certbot --nginx -d your-domain.com

# تجديد تلقائي
sudo certbot renew --dry-run
```

---

## 4. النشر على Firebase Hosting

### الخطوات

```bash
# تثبيت Firebase CLI
npm install -g firebase-tools

# تسجيل الدخول
firebase login

# تهيئة المشروع
firebase init hosting

# اختر:
# - Public directory: dist
# - Single-page app: Yes
# - GitHub integration: Optional

# بناء التطبيق
npm run build

# النشر
firebase deploy
```

---

## 5. إعداد Domain مخصص

### على Vercel

1. اذهب إلى Project Settings → Domains
2. أضف domain الخاص بك
3. أضف DNS records في مزود الـ domain:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21
   
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

### على Netlify

1. اذهب إلى Site settings → Domain management
2. أضف custom domain
3. أضف DNS records:
   ```
   Type: A
   Name: @
   Value: 75.2.60.5
   
   Type: CNAME
   Name: www
   Value: your-site.netlify.app
   ```

---

## 6. مراقبة الأداء

### استخدام Vercel Analytics

```javascript
// في main.jsx
import { inject } from '@vercel/analytics';

inject();
```

### استخدام Google Analytics

```html
<!-- في index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

---

## 7. النسخ الاحتياطي

### نسخ احتياطي لقاعدة البيانات

```bash
# باستخدام Supabase CLI
supabase db dump -f backup.sql

# أو من Dashboard
# Database → Backups → Download
```

### نسخ احتياطي للكود

```bash
# Git
git push origin main

# أو ZIP
tar -czf sinbad-backup-$(date +%Y%m%d).tar.gz /path/to/sinbad-game
```

---

## 8. التحديثات

### تحديث التطبيق

```bash
# 1. سحب آخر التغييرات
git pull origin main

# 2. تثبيت المكتبات الجديدة
npm install

# 3. بناء التطبيق
npm run build

# 4. النشر
# Vercel: git push (تلقائي)
# Netlify: git push (تلقائي)
# VPS: sudo systemctl restart nginx
```

---

## 9. استكشاف الأخطاء

### التطبيق لا يعمل بعد النشر

1. **تحقق من Environment Variables**
   ```bash
   # تأكد من وجود المتغيرات
   echo $VITE_SUPABASE_URL
   ```

2. **تحقق من Build Logs**
   - Vercel: Deployments → View logs
   - Netlify: Deploys → View logs

3. **تحقق من Console Errors**
   - افتح Developer Tools (F12)
   - تحقق من Console و Network tabs

### مشاكل CORS

إذا ظهرت أخطاء CORS:

1. اذهب إلى Supabase Dashboard
2. Settings → API → CORS
3. أضف domain التطبيق:
   ```
   https://your-app.vercel.app
   https://your-domain.com
   ```

### مشاكل Authentication

1. تحقق من Redirect URLs في Supabase:
   - Authentication → URL Configuration
   - أضف:
     ```
     https://your-app.vercel.app
     https://your-app.vercel.app/**
     ```

---

## 10. الأمان

### Best Practices

✅ لا ترفع ملف `.env` إلى Git
✅ استخدم HTTPS دائماً
✅ فعّل Row Level Security في Supabase
✅ راجع Supabase logs بانتظام
✅ حدّث المكتبات بانتظام (`npm audit`)

### تحديث المكتبات

```bash
# تحقق من التحديثات
npm outdated

# تحديث المكتبات
npm update

# تحديث كل شيء (حذر!)
npm install -g npm-check-updates
ncu -u
npm install
```

---

## الخلاصة

الآن لديك تطبيق السندباد منشور ويعمل! 🎉

**روابط مفيدة:**
- [Vercel Docs](https://vercel.com/docs)
- [Netlify Docs](https://docs.netlify.com)
- [Supabase Docs](https://supabase.com/docs)

**للدعم:**
- support@sinbad-game.com
