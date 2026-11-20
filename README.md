# Mohra

موقع ثابت: شاشة فتح الرسالة (بتشغّل الأغنية) ثم ٣ صفحات. اختيارها بيتسجل في Supabase وتشوفه من الموبايل.

## الملفات

- `public/index.html`: الصفحة كلها.
- `supabase.sql`: جدول الردود وصلاحياته.
- `netlify.toml`: إعدادات النشر والأمان.

## الإعدادات

كلها في أول السكريبت داخل `public/index.html`:

- `FROM_NAME`: اسمك (Romany).
- `SONG.file`: رابط أو مسار ملف mp3. لو الرابط خارجي، احتفظ بنسخة، لأنه ممكن يتمسح في أي وقت.
- `SUPABASE_URL` و`SUPABASE_KEY`: رابط المشروع والمفتاح العام (publishable). المفتاح ده مصمم يبقى ظاهر، وبسبب صلاحيات الجدول أقصى حاجة يقدر يعملها إنه يضيف رد.

## Supabase

الجدول اتعمل بالفعل من `supabase.sql`. الردود في Table Editor، جدول `answers`.

## النشر

1. ارفع المجلد على مستودع GitHub **Private**.
2. على netlify.com اختار Add new site ثم Import from Git واختار المستودع. الإعدادات بتتاخد من `netlify.toml`.
3. ابعت لها الرابط اللي Netlify هيديهولك.

## تنبيه على الموبايل (اختياري)

نزّل تطبيق **ntfy** واشترك في اسم قناة عشوائي طويل. وفي Supabase اعمل من Database ثم Webhooks ويب هوك على INSERT في `answers`، بطريقة POST على `https://ntfy.sh/اسم-القناة`.
