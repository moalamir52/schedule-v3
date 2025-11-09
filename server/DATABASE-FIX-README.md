# إصلاح قاعدة البيانات المباشرة

## المشكلة
السيرفر المحلي يعمل بشكل مثالي مع SQLite، لكن السيرفر المباشر يواجه مشاكل مع PostgreSQL بسبب:
1. اختلاف أسماء الأعمدة
2. مشاكل في الاتصال بقاعدة البيانات
3. عدم توافق الـ schema

## الحل

### 1. إصلاح PostgreSQL Service
```bash
node fix-postgres-service.js
```
هذا السكريپت يعيد كتابة `postgresService.js` ليطابق SQLite تماماً.

### 2. توحيد Schema قاعدة البيانات
```bash
node sync-production-schema.js
```
هذا السكريپت يعيد إنشاء جداول PostgreSQL لتطابق SQLite.

### 3. اختبار الاتصال
```bash
node fix-database-connection.js
```
هذا السكريپت يختبر الاتصال ويشخص المشاكل.

### 4. تشغيل جميع الإصلاحات
```bash
deploy-fix.bat
```
أو في Linux/Mac:
```bash
chmod +x deploy-fix.sh && ./deploy-fix.sh
```

## متطلبات السيرفر المباشر

### متغيرات البيئة في Render
تأكد من وجود `DATABASE_URL` في Environment Variables:
```
DATABASE_URL=postgresql://username:password@host:port/database
```

### الجداول المطلوبة
- `customers` - بيانات العملاء
- `workers` - بيانات العمال  
- `wash_history` - تاريخ الغسيل
- `ScheduledTasks` - المهام المجدولة
- `invoices` - الفواتير
- `Users` - المستخدمين
- `Services` - الخدمات

## التحقق من الإصلاح

### 1. اختبار الـ endpoints
```
GET /api/schedule/assign/current
GET /api/schedule/assign/available-workers?day=Saturday&time=9:00 AM
```

### 2. فحص الـ logs
ابحث عن:
- `✅ Connected to PostgreSQL`
- `✅ Database connection successful`
- `[POSTGRES] Retrieved X tasks`

### 3. اختبار الوظائف
- تحميل الجدولة
- إضافة مواعيد يدوية
- تحديث المهام
- عرض العمال المتاحين

## استكشاف الأخطاء

### خطأ 500 في available-workers
```javascript
// السبب: مشكلة في قاعدة البيانات
// الحل: تشغيل sync-production-schema.js
```

### خطأ اتصال قاعدة البيانات
```javascript
// السبب: DATABASE_URL غير صحيح
// الحل: تحديث متغيرات البيئة في Render
```

### أعمدة غير موجودة
```javascript
// السبب: schema غير متطابق
// الحل: تشغيل fix-postgres-service.js
```

## ملاحظات مهمة

1. **النسخ الاحتياطي**: تأكد من عمل backup قبل تشغيل الإصلاحات
2. **إعادة التشغيل**: أعد تشغيل Render service بعد الإصلاحات
3. **المراقبة**: راقب الـ logs بعد التطبيق
4. **الاختبار**: اختبر جميع الوظائف بعد الإصلاح

## الدعم
إذا استمرت المشاكل، تحقق من:
- Render logs
- Database connection
- Environment variables
- Network connectivity