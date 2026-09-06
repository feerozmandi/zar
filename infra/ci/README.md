# زیرساخت CI

`github-workflows-ci.yml` منبع محتوای `.github/workflows/ci.yml` است. دلیل نگه‌داری در
این مسیر: ربات/اتصال GitHub بدون permission با نام `workflows` اجازه‌ی پوش روی
`.github/workflows/**` را نمی‌دهد، برای همین تغییرات Workflow ابتدا اینجا کامیت و سپس
با یک `git mv` منتقل می‌شوند:

```bash
git mv -f infra/ci/github-workflows-ci.yml .github/workflows/ci.yml
git commit -m "ci(repo): به‌روزرسانی Workflow کیفیت و بیلد"
git push origin dev      # یا روی برنچ PR
```

یادداشت: در step «Tests» بخش OCR، خروجی pytest در صورت شکست به‌صورت annotation هم
منتشر می‌شود تا با `gh api repos/<owner>/<repo>/check-runs/<id>/annotations` قابل‌خواندن باشد.
