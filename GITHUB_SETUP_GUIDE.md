# 🚀 GitHub Governance Setup - راهنمای عملی

## 📋 مراحل پیاده‌سازی

### مرحله 1️⃣: ایجاد Pull Request برای dev

```bash
# از شاخه feat/github-governance-setup
git checkout feat/github-governance-setup

# بروزرسانی از آخرین تغییرات dev
git fetch origin dev
git rebase origin/dev

# ایجاد PR با GitHub CLI
gh pr create \
  --base dev \
  --head feat/github-governance-setup \
  --title "chore: implement GitHub governance and security best practices" \
  --body "
## 📝 خلاصه تغییرات

این PR شامل تمام فایل‌های مورد نیاز برای governance و security است:

### ✅ Workflows CI/CD
- \`ci.yml\`: تست و کیفیت خودکار
- \`security.yml\`: اسکن امنیتی
- \`release.yml\`: انتشار خودکار

### ✅ Templates و Governance
- \`CODEOWNERS\`: تعیین خودکار reviewers
- \`PULL_REQUEST_TEMPLATE.md\`: قالب PR
- Issue templates (Bug & Feature)

### ✅ مستندات
- \`README.md\`: راهنمای جامع (511 سطر)
- \`CONTRIBUTING.md\`: راهنمای مشارکت
- \`CODE_OF_CONDUCT.md\`: قوانین رفتاری

### 🎯 فوائد
- 🛡️ حفاظت خودکار شاخه‌های اصلی
- ✅ تست و بررسی خودکار
- 🔐 اسکن امنیتی منظم
- 📦 مدیریت وابستگی‌ها با Dependabot
- 🎨 استانداردهای کد یکنواخت
- 📚 مستندات جامع

### 🔗 Related
Closes #governance-setup
"
```

**یا از طریق وب‌سایت GitHub:**

1. برو به: `https://github.com/feerozmandi/zar/pull/new/feat/github-governance-setup`
2. Base branch: `dev`
3. Head branch: `feat/github-governance-setup`
4. عنوان: `chore: implement GitHub governance and security best practices`
5. دیسکریپشن: متن بالا را استفاده کن

---

### مرحله 2️⃣: Approve و Merge PR

```bash
# منتظر CI/CD تمام شود
# سپس approve:
gh pr review <PR_NUMBER> --approve

# Merge با squash:
gh pr merge <PR_NUMBER> --squash --auto

# یا از طریق وب‌سایت:
# 1. کلیک روی "Approve"
# 2. کلیک روی "Squash and merge"
```

---

### مرحله 3️⃣: بروزرسانی شاخه محلی

```bash
# بروزرسانی dev
git checkout dev
git pull origin dev

# حذف شاخه محلی
git branch -d feat/github-governance-setup

# حذف شاخه remote (خودکار با delete-branch-on-merge)
git push origin --delete feat/github-governance-setup
```

---

## 🔐 مرحله 4️⃣: فعال‌کردن حفاظت شاخه‌ها

### برای شاخه `dev`

```
URL: https://github.com/feerozmandi/zar/settings/branches

تنظیمات:
✅ Require a pull request before merging
  └─ Require 1 approval
✅ Require status checks to pass before merging
  └─ Require branches to be up to date before merging
✅ Require conversation resolution before merging
✅ Allow auto-merge
✅ Delete head branch
```

**دستور GitHub CLI:**

```bash
# اگر API پشتیبانی کند
gh api \
  -X PUT \
  repos/feerozmandi/zar/branches/dev/protection \
  -f required_pull_request_reviews.required_approving_review_count=1 \
  -f required_status_checks.strict=true \
  -f allow_auto_merge=true \
  -f delete_branch_on_merge=true
```

---

### برای شاخه `main`

```
URL: https://github.com/feerozmandi/zar/settings/branches

تنظیمات:
✅ Require a pull request before merging
  └─ Require 1 approval
  └─ Dismiss stale pull request approvals
  └─ Require review from Code Owners
✅ Require status checks to pass before merging
  └─ Require branches to be up to date before merging
✅ Require conversation resolution before merging
✅ Require signed commits
✅ Delete head branch
❌ Allow auto-merge (برای production)
```

---

## 📦 مرحله 5️⃣: فعال‌کردن Dependabot

### 5.1: Dependabot Alerts

```
URL: https://github.com/feerozmandi/zar/settings/security_analysis

✅ Dependabot alerts
✅ Dependabot security updates
✅ Dependabot version updates
```

### 5.2: تنظیم Dependabot PR

```bash
# مشاهده PR‌های Dependabot موجود
gh pr list --search "author:dependabot"

# Auto-merge برای Dependabot (اختیاری)
# پس از تمام test‌ها موفق شود
gh pr merge <DEPENDABOT_PR> --squash --auto
```

---

## 🔄 مرحله 6️⃣: تنظیم Workflows

### 6.1: فعال‌کردن Actions

```
URL: https://github.com/feerozmandi/zar/settings/actions

✅ Allow all actions and reusable workflows
(یا محدود کن بر اساس نیاز)
```

### 6.2: بررسی Workflows

```bash
# لیست workflows
gh workflow list

# اجرای workflow جدید
gh workflow run ci.yml -r dev

# بررسی آخرین runs
gh run list --limit 10
```

---

## 🛡️ مرحله 7️⃣: تنظیمات امنیتی

### 7.1: Secret Scanning

```
URL: https://github.com/feerozmandi/zar/settings/security_analysis

✅ Secret scanning
✅ Secret scanning push protection
```

### 7.2: Code Security

```
URL: https://github.com/feerozmandi/zar/settings/code_security_and_analysis

✅ Enable dependency graph
✅ Enable Dependabot alerts
✅ Enable Dependabot security updates
✅ Enable Dependabot version updates
```

### 7.3: تنظیم CODEOWNERS

```bash
# تست CODEOWNERS
gh api \
  repos/feerozmandi/zar/codeowners/errors

# یا ببینید:
# https://github.com/feerozmandi/zar/settings/repositories/code_owners
```

---

## 📊 مرحله 8️⃣: تنظیمات Repository

### 8.1: تنظیمات General

```
URL: https://github.com/feerozmandi/zar/settings

✅ Allow auto-merge
✅ Automatically delete head branches
✅ Delete branch on merge
❌ Require commit signatures
(برای محیط توسعه اختیاری است)
```

### 8.2: Merge Strategies

```
URL: https://github.com/feerozmandi/zar/settings

✅ Allow squash merging
✅ Allow rebase merging  
✅ Allow auto-merge
❌ Auto-merge (برای dev فقط)
```

```bash
# تنظیم از طریق GitHub CLI
gh api \
  -X PATCH \
  repos/feerozmandi/zar \
  -f allow_auto_merge=true \
  -f delete_branch_on_merge=true \
  -f allow_squash_merge=true \
  -f allow_rebase_merge=true
```

---

## 🚀 مرحله 9️⃣: نحوه استفاده برای توسعه‌دهندگان

### شروع توسعه جدید

```bash
# 1. بروزرسانی از dev
git checkout dev
git pull origin dev
git fetch origin

# 2. ایجاد شاخه جدید
git checkout -b feat/my-feature

# 3. انجام تغییرات
# ... ویرایش فایل‌ها ...

# 4. Commit با Conventional Commits
git add .
git commit -m "feat(scope): description"

# 5. Push
git push origin feat/my-feature

# 6. ایجاد PR
gh pr create \
  --base dev \
  --head feat/my-feature \
  --title "feat: description" \
  --body "توضیح تفصیلی..."
```

### مثال‌های Commit

```bash
# ویژگی جدید
git commit -m "feat(auth): add two-factor authentication"

# تعمیر باگ
git commit -m "fix(login): resolve session timeout issue"

# بروزرسانی مستندات
git commit -m "docs: update API endpoints"

# اضافه تست
git commit -m "test(auth): add 2FA validation tests"

# تغییرات نگهداری
git commit -m "chore(deps): update dependencies"

# بازسازی کد
git commit -m "refactor(api): simplify request handling"
```

---

## ✅ مرحله 🔟: بررسی نهایی

```bash
# 1. بررسی workflows
gh workflow list

# 2. بررسی branch protection
gh api repos/feerozmandi/zar/branches/dev/protection

# 3. بررسی recent commits
git log -10 --oneline

# 4. بررسی PR‌های باز
gh pr list --state open

# 5. بررسی Issues
gh issue list --state open

# 6. بررسی security alerts
gh api repos/feerozmandi/zar/security-advisories
```

---

## 📈 کنترل‌لیست نهایی

```
✅ PR ایجاد و Merge شد
✅ Branch protection فعال (dev و main)
✅ Dependabot فعال شد
✅ Workflows اجرا می‌شوند
✅ Secret scanning فعال
✅ Code owners تنظیم شد
✅ Issue templates کار می‌کنند
✅ CONTRIBUTING راهنما نوشته شد
✅ README به‌روز شد
✅ توسعه‌دهندگان آموزش دیدند
```

---

## 🔧 دستورات سریع

```bash
# بررسی تمام تنظیمات
gh repo view feerozmandi/zar --json name,description,isPrivate,protectedBranches

# لیست branches
gh api repos/feerozmandi/zar/branches

# لیست workflows
gh workflow list

# آخرین 5 commits
git log -5 --oneline

# بررسی تفاوت dev و main
git diff main..dev --stat

# بررسی PR‌های merged
gh pr list --state merged --limit 10
```

---

## 🎯 نکات مهم

⚠️ **یادآوری‌ها:**

1. **Squash Merge برای dev**: نگاه کن تا commit history تمیز بماند
2. **Auto-delete branches**: بعد از merge، شاخه خودکار حذف شود
3. **Rebase for main**: برای main، از rebase استفاده کن (اختیاری)
4. **Test قبل از merge**: همیشه local test اجرا کن
5. **Sign commits**: برای main، commits signed باشند (توصیه‌شده)
6. **Cover review**: حداقل 1 reviewer موظف است
7. **Up-to-date check**: branch باید با base مطابقت داشته باشد

---

## 📞 منابع کمکی

- 📖 [GitHub CLI Docs](https://cli.github.com/manual/)
- 🔐 [Protecting Branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches)
- 🤖 [Dependabot Docs](https://docs.github.com/en/code-security/dependabot)
- 🔄 [Workflows Guide](https://docs.github.com/en/actions/using-workflows)
- 📋 [Conventional Commits](https://www.conventionalcommits.org/)

---

**نسخه:** 1.0.0  
**تاریخ:** 2026-09-04  
**نویسنده:** @feerozmandi
