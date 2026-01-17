# خطوات تحديث Prisma Client

بعد إضافة الـ Q&A models، يجب تحديث Prisma Client:

## الخطوات:

1. **أوقف الـ server** إذا كان شغال (اضغط Ctrl+C في terminal الـ server)

2. **شغّل الأمر التالي:**
```bash
cd server
npx prisma generate
```

3. **أعد تشغيل الـ server:**
```bash
npm start
```

## ملاحظة:
إذا ظهرت رسالة خطأ `EPERM: operation not permitted`، هذا يعني أن الـ server لا يزال يعمل ويستخدم الملفات. تأكد من إيقاف الـ server تماماً قبل عمل generate.
