export default function TermsPage() {
  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-primary">شروط الاستخدام</h1>
      
      <div className="space-y-6 text-muted-foreground leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold mb-3 text-foreground">1. القبول بالشروط</h2>
          <p>
            باستخدامك لمنصة درس (Dars Academy)، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على أي جزء منها، يرجى عدم استخدام المنصة.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-foreground">2. الحسابات والتسجيل</h2>
          <p>
            أنت مسؤول عن الحفاظ على سرية معلومات الدخول الخاصة بك (OTP / كلمة المرور). يُمنع مشاركة حسابك مع أشخاص آخرين.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-foreground">3. سياسة الاسترداد (Refund Policy)</h2>
          <p>
            تضمن المنصة حق ولي الأمر في استرداد الأموال للدروس التي لم يتم إجراؤها وفقاً لسياسة الاسترداد المفصلة في لوحة تحكم ولي الأمر. نستخدم نظام حفظ الأموال (Escrow) لضمان حقوق الطرفين.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-foreground">4. حقوق الملكية الفكرية</h2>
          <p>
            جميع المحتويات، الفيديوهات، والمناهج المقدمة على المنصة هي ملكية فكرية لمنصة درس. يُمنع منعاً باتاً نسخها أو تسجيلها أو إعادة نشرها بأي شكل من الأشكال.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-foreground">5. السلوك والفصل الافتراضي</h2>
          <p>
            يُتوقع من جميع الطلاب والمعلمين الالتزام بالسلوك المهني والمحترم داخل الفصول الافتراضية. يحق للإدارة إيقاف أي حساب ينتهك قواعد السلوك العام.
          </p>
        </section>
      </div>
    </div>
  );
}
