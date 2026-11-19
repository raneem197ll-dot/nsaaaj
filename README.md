# NASJ · نَسْج

Skills, woven from evidence. A multi-role demo platform connecting students, professors, graduates and professionals, university clubs and companies.

- Landing page: English, with a 3D "skills meet evidence" hero and a scroll-driven weave story.
- Product demo: Arabic (RTL), five roles with a role switcher, Kufi typography.

## Run on Replit | التشغيل على ريبلت
1. Create a new Repl → **Import** → upload this folder (or the zip).
2. Press **Run**. It installs two dev tools, builds the CSS and serves the site on port 3000.
3. Open the webview. Use the role switcher (top left in the Arabic app) to move between the five experiences.

ارفعي المجلد أو ملف zip في Repl جديد واضغطي Run. الموقع يعمل على المنفذ 3000.

## Run locally
```bash
npm install
npm run dev      # http://localhost:3000
```
The compiled `css/styles.css` is included, so any static server also works.

## Demo tour
1. Hover and click the 3D field on the landing page, then scroll through the weave.
2. **طالب** → جواز المهارات → open التصميم الجرافيكي to see why it is not verified yet.
3. **طالب** → مسارات التعلم → محاكاة الاختبار النهائي → the passport updates.
4. **طالب** → الهاكاثونات → ميزان: individual contributions and the skill credit matrix.
5. **أستاذ** → قائمة التقييم → score the rubric, add feedback, submit.
6. **شركة** → منشئ التحديات → publish → check the student's التحديات العملية.
7. **شركة** → اكتشاف المواهب → موثّقة فقط → مقارنة → تواصل.
8. **نادي** → توثيق المساهمات → skills are suggested from the Arabic task text.

All people and organisations are fictional. See `replit.md` for architecture and conventions.
