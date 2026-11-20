# صفحة مهرائيل

صفحة من ٣ شاشات وسيرفر صغير بيسجل اختيارها (موافقة / عايزة تفكر / مش حاسة بنفس الشعور) ويبعتلك تنبيه على موبايلك.

## الملفات

- `public/index.html`: الصفحة نفسها.
- `server.js`: السيرفر. من غير أي مكتبات، محتاج Node 18 أو أحدث.
- `data/answers.jsonl`: بيتعمل لوحده وبيتسجل فيه كل رد.

## تشغيل على جهازك

```bash
ADMIN_KEY=كلمة-سر-طويلة NTFY_TOPIC=اسم-عشوائي-طويل npm start
```

افتح `http://localhost:3000`. صفحة الردود: `http://localhost:3000/admin?key=كلمة-سر-طويلة`.

## متغيرات البيئة

| الاسم | معناه |
| --- | --- |
| `ADMIN_KEY` | كلمة سر صفحة `/admin`. لو فاضية الصفحة دي بتتقفل. |
| `NTFY_TOPIC` | اسم قناة التنبيهات على ntfy.sh. اختار اسم عشوائي طويل ومتقولوش لحد. |
| `PORT` | البورت. المنصات المجانية بتحدده لوحدها. |
| `DATA_DIR` | مكان حفظ الردود. الافتراضي `data/`. |

## التنبيه على الموبايل

1. نزّل تطبيق **ntfy** (أندرويد أو iPhone).
2. اشترك في نفس اسم القناة اللي حطيته في `NTFY_TOPIC`.
3. أول ما تختار، هيجيلك إشعار فيه اختيارها ورسالتها.

## الرفع على GitHub

```bash
cd mohra-site
git init
git add .
git commit -m "Mohra confession site"
git branch -M main
git remote add origin https://github.com/اسمك/mohra-site.git
git push -u origin main
```

خلي المستودع **Private**. ملف `data/` و`.env` متجاهلين في `.gitignore` فمش هيترفعوا.

## النشر على سيرفر

أي منصة بتشغل Node تنفع (Render وRailway وFly.io). على Render مثلاً:

1. New، ثم Web Service، واربطه بالمستودع.
2. Build command سيبه فاضي، وStart command: `npm start`.
3. أضف `ADMIN_KEY` و`NTFY_TOPIC` في Environment.
4. ابعت لها رابط الموقع اللي المنصة هتديهولك.

ملحوظة: القرص في الخطط المجانية بيتمسح لما السيرفر يعيد التشغيل، فملف الردود ممكن يضيع. التنبيه على ntfy هو المصدر الأساسي، وصفحة `/admin` للمراجعة السريعة.

## ملحوظة على الأغنية

زرار الأغنية في `public/index.html` بيفتح بحث على يوتيوب. غيّر `SONG.query` لاسم الأغنية، أو حط رابط مباشر في `SONG.url`.
