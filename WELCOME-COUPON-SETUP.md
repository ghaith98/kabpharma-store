# Welcome coupons — 11 October 2026

## التفعيل

1. احتفظ بنسخة احتياطية من قاعدة بيانات Supabase الحالية.
2. في مشروع Supabase الأساسي (وليس الأرشيف)، افتح SQL Editor وشغّل كامل الملف:
   `supabase/migrations/202610110001_coupon_eligibility.sql`.
   الملف يعمل ضمن transaction؛ أي خطأ يلغي التعديل كاملاً. إذا ظهرت رسالة عن
   `coupon_usages.idempotency_key` أو `orders.customer_profile_id` أو تكرار أرقام الهواتف أو توقيع دالة إنشاء الطلب،
   لا تتجاوزها: يلزم مراجعة مخطط قاعدة البيانات الفعلي أولاً.
3. انسخ المشروع المعدّل مع الاحتفاظ بملف `.env.local` الخاص بك.
4. شغّل `npm ci` ثم `npm run check` وانشر النسخة الجديدة بعد نجاحها.
5. من Admin > Coupons أنشئ WELCOME10 أو اضغط Edit على الموجود:
   - Percentage: 10 (أو النسبة الفعلية التي تريدها؛ النافذة تقرأها من قاعدة البيانات).
   - First order only: مفعّل.
   - One use per customer: مفعّل.
   - Available to: All customers.
   - Active: مفعّل، واضبط الحد الأدنى/الأقصى والمنتجات المخفضة والصلاحية كما تريد.
6. لتخصيص أي كوبون: ابحث عن المستخدم باسمه أو هاتفه أو إيميله ثم اختره في
   Available to. ترك الاختيار على All customers يجعله عاماً ضمن شروطه الأخرى.

لا ينشئ ملف SQL عرضاً تجارياً أو يغيّر قيمة الكوبونات الموجودة. يجب ضبط
WELCOME10 كما سبق حتى تظهر النافذة. لا يلزم نشر تغييرات SQL بمشروع الأرشيف.

## تصحيح توافق قاعدة البيانات

هذه النسخة تستبدل الملف السابق الذي توقف بسبب افتراض عمود order_id غير الموجود.
لا تضيف order_id ولا عمود هوية حساب ثانياً. حذف استخدام الكوبون عند الإلغاء
أو الرفض يطابق idempotency_key وهوية الحساب والكوبون معاً.

دالة الغلاف تفحص الأهلية تحت قفل الحساب قبل استدعاء الدالة الأصلية، وتسمح
للدالة الأصلية بإرجاع نفس الطلب عند إعادة إرسال نفس المفتاح لنفس الحساب.
أما مفتاح طلب تابع لحساب آخر فيُرفض. كما تسمح حماية الإدخال بحجز استخدام
الكوبون لنفس العملية إذا كانت الدالة الأصلية تحجزه قبل إدخال الطلب.

أي استخدام تاريخي لا يطابق طلباً موجوداً محفوظٌ احترازياً؛ لا يمكن التأكد من
أن طلبه ملغي أو مرفوض من دون سجله. بعد الأرشفة الجديدة لا تظهر هذه المشكلة
لأن استخدام الطلب الملغي/المرفوض يُحرر قبل نقله إلى الأرشيف.

## السلوك

- نافذة عربي/إنجليزي بعد 15 ثانية، مرة في جلسة تبويب المتصفح؛ التنقل وإعادة
  التحميل لا يعيدانها. فتح زيارة جديدة في تبويب جديد يبدأ انتظاراً جديداً
  حسب سلوك sessionStorage في المتصفح.
- لا تظهر في التسجيل/الدخول/السلة/الدفع/الحساب/الطلبات أو صفحات الموظفين.
  إذا انقضت المهلة في صفحة مستثناة تنتظر حتى يعود الزائر إلى صفحة تسوق.
- لا تظهر أمام نافذة حوار أخرى أو عندما يكون التبويب غير مرئي. بعد التأجيل
  يعاد الفحص كل 15 ثانية وعلى العودة إلى التبويب.
- يلزم تحقق من جلسة الضيف. الحساب المتذكر محلياً يستثنى أيضاً من ترويج التسجيل.
  لا يمكن معرفة أن الزائر يملك حساباً على جهاز آخر إذا لم يكن مسجلاً أو متذكراً هنا.
- نسبة العرض وحدوده وصلاحيته تأتي من الكوبون الفعلي؛ تعطيله أو تخصيصه لشخص أو
  إزالة شرط أول طلب/الاستخدام الواحد يخفي نافذة الترحيب للزوار الجدد.
- الصورة الجديدة `/images/kab-welcome-skincare.webp` لقطة عناية بالبشرة مولّدة للنافذة، وتظهر كاملة دون قص.
  الكمبيوتر: صورة يسار ومحتوى يمين. الموبايل: صورة أعلى ومحتوى أسفل.
- Escape وزر الإغلاق والنقر خارج النافذة يغلقونها. dialog الأصلي يحصر التركيز
  ويمنع التفاعل بالخلفية؛ قفل التمرير يعاد لحالته السابقة عند الإغلاق.
- WELCOME10 ظاهر في النافذة للاستخدام عند الدفع بعد إنشاء الحساب؛ لا توجد
  رسائل بريد أو توليد أكواد فردية أو إضافة تلقائية للخصم بدون إدخال الكود.

## شروط الكوبونات

- First order only خيار مستقل عن One use per customer وعن المستخدم المحدد.
- أي طلب قائم أو مكتمل يمنع خصم أول طلب. `rejected` و`cancelled_by_customer`
  لا يحتسبان، ويحذف استخدام الكوبون عند انتقال الطلب لأي منهما.
- الإلغاء لا يمدد صلاحية الكوبون؛ يلزم أن يظل العرض صالحاً عند إعادة الطلب.
- إعادة تفعيل طلب ملغي تعيد فحص الشروط؛ ترفض إذا استخدم الحساب الأهلية بطلب آخر.
- التحقق داخل قاعدة البيانات أيضاً. كل طلب جديد يأخذ قفل الحساب ضمن transaction،
  بما فيه الطلب بلا كوبون، لمنع سباق طلبين على أهلية أول طلب.
- تستعمل واجهتا COD وSham Cash دالة غلاف تحفظ توقيع ونتيجة الدالة الذرية
  الموجودة، وتربط الطلب بهوية الحساب الموثّقة صراحة. دالتا إنشاء الطلب
  متاحتان للسيرفر فقط؛ لا يستدعيهما المتصفح مباشرة.
- يستخدم ربط الطلبات customer_profile_id الموجود فعلاً عندك. الطلبات غير
  المرتبطة تُطابق مع coupon_usages بواسطة idempotency_key، ثم الهاتف. التاريخ الذي لا يحمل ارتباط حساب ولا هاتفه الحالي
  لا يمكن نسبته بدقة آلياً؛ راجع هذه الحالات قبل تفعيل العرض.
- حذف حساب مستهدف لا يحوّل كوبونه إلى عرض عام ولا يمنع حذف الحساب.
- كود الكوبون غير قابل للتغيير أثناء Edit حفاظاً على ارتباط الاستخدامات السابقة؛
  يمكن تعديل القيمة والشروط والهدف وتفعيل الكوبون أو تعطيله.

## Verification

`npm run test:coupons` runs the migration in PGlite (PostgreSQL) against a
fixture using the relevant column names supplied in your screenshots
(coupon_usages.idempotency_key and orders.customer_profile_id/idempotency_key).
The existing RPC body remains a test implementation; its full production body
was truncated in the supplied screenshot. It checks public and
assigned coupons, server-only RPC permissions, first orders, pending/delivered exclusions, cancellation and
rejection release, reactivation, invalid targets, deleted targets, explicit
profile association, idempotent retries and ownership, SETOF/JSON RPC results, migration reruns, visit timing and excluded routes.

TypeScript, ESLint and production build are also checked. Runtime dependency audit: zero known vulnerabilities at the time of checking.
Six existing lint
warnings remain in unrelated files. Build uses placeholder Supabase settings;
database-dependent prerender fetch failures under those settings are expected.

The installed production RPC/table definitions and real customer data were not
available for verification. The migration contains preflight checks and derives
the wrapper signature from the installed RPC. Run the migration in a Supabase
test project with your actual schema and exercise COD/transfer checkout before
production rollout. Parallel connection race tests were not run; the migration
uses transaction-scoped advisory locks for customer serialization.

Browser visual validation could not be completed: the preview browser could not
reach the local development server. Mobile/desktop layout and actual Samsung
Internet/Safari behavior still need a visual smoke test on a preview deployment.

## تحديثات السلة والكوبونات
- التوفر يعتمد فقط على `products.is_out_of_stock`. الأحجام ترث حالة المنتج ولا نعتمد أعمدة كميات قديمة.
- المنتج المحذوف والحجم المحذوف لهما رسالتان واضحتان بدلاً من رسالة نفاد المخزون.
- زر Delete يحذف الكوبونات غير المرتبطة بطلبات أو استخدامات بعد التأكيد. الكوبون المستخدم يُعطّل للحفاظ على سجل الطلبات.
- لا يوجد SQL إضافي مطلوب لهذه التحديثات، بعد تثبيت تعديل الكوبونات السابق.

الصورة: توليد مدمج؛ الوصف المستخدم: لقطة علوية واضحة لكريم وزيت عناية بالبشرة وأوراق خضراء على خلفية عاجية، بلا ملصقات أو شعارات أو نصوص. الصورة معبأة ضمن المشروع بصيغة WebP (حوالي 93 KB).

## التحقق من تحديث 15 ثانية
نجحت فحوص TypeScript وESLint (مع 6 تحذيرات سابقة)، واختبارات الكوبونات والزيارة والسلة. اختبار السلة يستخدم بيانات تجريبية ويفحص آلة التسعير الفعلية. لا يؤكد القيم الحالية لمنتجات Lacte Kab وGlucoflex في قاعدة الإنتاج. لم يُختبر العرض على أجهزة Samsung أو iPhone فعلية. احتفظ بملف `.env.local` الحالي عند استبدال ملفات المشروع.
