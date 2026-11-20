# صفحة مهرائيل

موقع ثابت من ٣ شاشات. اختيارها بيتسجل في Supabase وتشوفه من الموبايل في لوحة التحكم.

## الملفات

- `public/index.html`: الصفحة كلها.
- `supabase.sql`: جدول الردود وصلاحياته.
- `netlify.toml`: إعدادات النشر والأمان.

## ١. Supabase

1. على supabase.com اعمل Project جديد.
2. من SQL Editor الصق محتوى `supabase.sql` واضغط Run.
3. من Project Settings ثم API، انسخ **Project URL** ومفتاح **anon** (أو publishable).
4. افتح `public/index.html` وحطهم في `SUPABASE_URL` و`SUPABASE_KEY`.

المفتاح ده مصمم يبقى ظاهر في الصفحة، وبسبب صلاحيات الجدول أقصى حاجة يقدر يعملها إنه يضيف رد. محدش يقدر يقرأ الردود غيرك.

## ٢. اسمك والأغنية

في أول السكريبت داخل `public/index.html`:

- `FROM_NAME`: اسمك الأول. ضروري، عشان هي متعرفش مين اللي كاتب.
- `SONG.file`: رابط أو مسار ملف mp3. شغال بزرار عايم في كل الصفحات.
- `SONG.youtubeId`: بديل، كود فيديو يوتيوب بيظهر في مشغل رسمي.

لو الأغنية على رابط خارجي، احتفظ بنسخة منها. الرابط ممكن يتمسح أو يتغير في أي وقت.

## ٣. النشر

1. ارفع المجلد على مستودع GitHub **Private**.
2. على netlify.com اختار Add new site ثم Import from Git واختار المستودع. الإعدادات بتتاخد من `netlify.toml`.
3. ابعت لها الرابط اللي Netlify هيديهولك.

## متابعة الردود

- من Supabase افتح Table Editor ثم `answers`.
- لتنبيه على الموبايل: نزّل تطبيق **ntfy** واشترك في اسم قناة عشوائي طويل. وفي Supabase اعمل من Database ثم Webhooks ويب هوك على INSERT في `answers`، بطريقة POST على `https://ntfy.sh/اسم-القناة`.
