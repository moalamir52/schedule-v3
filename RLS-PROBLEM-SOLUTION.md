# 🔒 مشكلة Row Level Security (RLS) في Supabase

## 🚨 المشكلة:
```
cannot delete from table "ScheduledTasks" because it does not have a replica identity and publishes deletes
```

**السبب:** Row Level Security (RLS) مفعل على جدول `ScheduledTasks` مما يمنع:
- ❌ الحذف (DELETE)
- ❌ التحديث (UPDATE) 
- ❌ الإدراج (INSERT) للمستخدمين المجهولين

## ✅ الحلول:

### الحل الأول: إلغاء RLS (الأسرع)
```sql
-- في Supabase SQL Editor
ALTER TABLE "ScheduledTasks" DISABLE ROW LEVEL SECURITY;
```

### الحل الثاني: إنشاء Policy للسماح بالعمليات
```sql
-- السماح بجميع العمليات للمستخدمين المجهولين
CREATE POLICY "Allow all operations" ON "ScheduledTasks"
FOR ALL USING (true) WITH CHECK (true);
```

### الحل الثالث: استخدام Service Role Key
```javascript
// استخدام service_role key بدلاً من anon key
const SUPABASE_KEY = 'your_service_role_key_here';
```

## 🔧 التطبيق السريع:

### 1. الدخول إلى Supabase Dashboard
- اذهب إلى: https://supabase.com/dashboard
- اختر مشروعك
- اذهب إلى SQL Editor

### 2. تشغيل الأمر:
```sql
ALTER TABLE "ScheduledTasks" DISABLE ROW LEVEL SECURITY;
```

### 3. اختبار النتيجة:
```bash
node delete-specific-task.js
```

## 📊 التأثير:
- ✅ سيعمل الحذف فوراً
- ✅ سيعمل التحديث فوراً
- ✅ ستعمل جميع العمليات المحسنة
- ⚠️ الجدول سيكون مفتوح للجميع (مؤقتاً)

## 🔐 الأمان:
إذا كنت تريد الحفاظ على الأمان، استخدم الحل الثاني لإنشاء Policy محددة.

---
**الحل الموصى به:** إلغاء RLS مؤقتاً لحل المشكلة، ثم إعادة تفعيله مع Policy مناسبة لاحقاً.