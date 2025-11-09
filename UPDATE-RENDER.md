# 🔄 تحديث مشروع Render الموجود

## الخطوات:

### 1. تحديث Environment Variables في Render
اذهب إلى Render Dashboard → Settings → Environment Variables وأضف:

```
USE_SUPABASE=true
SUPABASE_URL=https://gtbtlslrhifwjpzukfmt.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0YnRsc2xyaGlmd2pwenVrZm10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2NzYzMDksImV4cCI6MjA3ODI1MjMwOX0.VjYOwxkzoLtb_ywBV40S8cA0XUqxtGcDtNGcVz-UgvM
```

### 2. Push التحديثات للـ Git Repository
```bash
git add .
git commit -m "Update to use Supabase database"
git push origin main
```

### 3. Render سيعمل Auto-Deploy
- Render سيكتشف التحديثات تلقائياً
- سيعيد بناء وتشغيل التطبيق
- التطبيق سيستخدم Supabase بدلاً من SQLite

## ✅ النتيجة:
- البيانات محفوظة دائماً (لا تضيع عند إعادة التشغيل)
- 51 عميل + 4 عمال جاهزين
- التطبيق يعمل بكفاءة أعلى