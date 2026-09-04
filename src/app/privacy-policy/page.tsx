export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-primary">سياسة الخصوصية</h1>
      
      <div className="space-y-6 text-muted-foreground leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold mb-3 text-foreground">1. مقدمة</h2>
          <p>
            في منصة منهل (Dars Academy)، نولي أهمية قصوى لخصوصية مستخدمينا (الطلاب، أولياء الأمور، والمعلمين). تشرح هذه السياسة كيفية جمعنا للمعلومات، استخدامها، وحمايتها.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-foreground">2. المعلومات التي نجمعها</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>معلومات التسجيل: الاسم، رقم الهاتف، البريد الإلكتروني.</li>
            <li>بيانات الاستخدام: الصفحات التي تزورها، وتفاعلك مع المحتوى التعليمي.</li>
            <li>بيانات الحصص: التقارير الدراسية، تسجيلات الفصول الافتراضية (لأغراض المراجعة والتقييم فقط).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-foreground">3. كيف نستخدم معلوماتك؟</h2>
          <p>نستخدم البيانات لتقديم الخدمة التعليمية، تحسين المنصة، معالجة المدفوعات، والتواصل معك بخصوص التحديثات والتقارير الأسبوعية.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-foreground">4. حماية البيانات (GDPR & FERPA)</h2>
          <p>
            نلتزم بأعلى معايير الأمان المتبعة في حماية بيانات الأطفال. لا نقوم ببيع بياناتك لأي طرف ثالث. تتم معالجة المدفوعات عبر بوابات دفع معتمدة وآمنة ولا نحتفظ ببيانات بطاقتك الائتمانية.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-foreground">5. حقوقك كولي أمر / مستخدم</h2>
          <p>
            يحق لك في أي وقت مراجعة البيانات الخاصة بك أو بطفلك، ويمكنك طلب حذف الحساب نهائياً وجميع البيانات المرتبطة به عبر إعدادات حسابك أو بالتواصل مع الدعم الفني.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-foreground">6. ملفات تعريف الارتباط (Cookies)</h2>
          <p>
            نستخدم ملفات تعريف الارتباط الأساسية لضمان عمل المنصة (مثل الاحتفاظ بتسجيل الدخول)، وملفات تحليلية (مثل Google Analytics) لتحسين تجربة المستخدم.
          </p>
        </section>
      </div>
    </div>
  );
}
