# زیرساخت CI

`github-workflows-ci.yml` محتوای کامل Workflow یکپارچه‌سازی (quality · build · ocr · services) است.
چت با اتصال GitHub محدودیت نوشتن روی `.github/workflows/**` ندارد؟ فعلاً دارد — به همین دلیل این فایل
موقتاً همین‌جا نگه داشته شده و باید یک‌بار منتقل شود:

```bash
git mv -f infra/ci/github-workflows-ci.yml .github/workflows/ci.yml
git rm -f infra/ci/README.md            # این یادداشت هم دیگر لازم نیست
git commit -m "ci(repo): انتقال Workflow کیفیت و بیلد به مسیر گیت‌هاب"
git push origin dev                     # یا روی برنچ PR
```

پس از انتقال، `.github/**` در `.prettierignore` است (رجوع: `.prettierignore`) پس نیازی به فرمت‌کردن مجدد نیست.
