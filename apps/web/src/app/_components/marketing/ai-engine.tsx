const models = ["GPT-4o", "Claude 3.5 Sonnet", "Llama 3.3 70B"];

/** معرفی موتور هوش مصنوعی چندمدلی + برجسته‌سازی Pro BYOK (نوت ۴ §۲) */
export function AiEngine() {
  return (
    <section className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-16 lg:grid-cols-2 lg:px-8">
      <div>
        <h2 className="text-2xl font-black sm:text-3xl">تحلیل عمیق و هوشمند اسناد انرژی در چند ثانیه</h2>
        <p className="mt-4 leading-8 text-muted-foreground">
          دروازه‌ی چندمدلی Xennic به‌صورت پیش‌فرض از مدل‌های رایگان سطح سیستم استفاده می‌کند و در صورت نیاز،
          کلید اختصاصی سازمان را (رمزنگاری‌شده با AES-256-GCM) به کار می‌گیرد.
        </p>
        <ul className="mt-6 grid gap-2 text-sm sm:grid-cols-3">
          {models.map((model) => (
            <li key={model} className="rounded-lg border border-border bg-card/60 px-3 py-2 text-center">
              {model}
            </li>
          ))}
        </ul>
      </div>
      <div className="xennic-glass rounded-(--radius-card) p-6">
        <p className="text-sm font-bold text-primary">Pro BYOK</p>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">
          امکان اتصال کلید اختصاصی API Key توسط کارخانجات و شرکت‌ها برای امنیت و تحلیل بی‌محدودیت اسناد؛
          داده‌ها تنها به پروایدر انتخابی شما ارسال می‌شود.
        </p>
        <dl className="mt-5 grid grid-cols-3 gap-3 text-center">
          {[
            { k: "OCR", v: "صف مستقل" },
            { k: "حریم خصوصی", v: "AES-256-GCM" },
            { k: "خروجی", v: "PDF رسمی" },
          ].map((item) => (
            <div key={item.k} className="rounded-lg border border-border/70 px-2 py-3">
              <dt className="text-[11px] text-muted-foreground">{item.k}</dt>
              <dd className="mt-1 text-sm font-bold">{item.v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
