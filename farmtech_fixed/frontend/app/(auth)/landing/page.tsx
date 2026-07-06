'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

export default function LandingPage() {
  const testimonials = [
    {
      id: 1,
      name: 'فاطمة حسن',
      title: 'دعم مالي',
      location: 'القاهرة',
      quote: '"في وقت الأزمة وجدنا الدعم القوري من خلال منصة عون، ثم وصلنا على الدعم العادلي الشهري للأسر المستحقة بكل سيولة وسرعة"',
      icon: '👨‍🌾',
      color: 'from-emerald-500 to-emerald-600'
    },
    {
      id: 2,
      name: 'محمد سعيد',
      title: 'دعم تعليمي',
      location: 'أسيوط',
      quote: '"كنت أواجه صعوبة في إيجاد المصادر الدراسية للبي، شاملي المنصة في التواصل مع مؤسسة تعليمية تخفيف بكفالة المتطلبات التعليمي"',
      icon: '📚',
      color: 'from-teal-500 to-teal-600'
    },
    {
      id: 3,
      name: 'أم أحمد',
      title: 'رعاية صحية',
      location: 'الإسكندرية',
      quote: '"يفضل الله تمكينك من الوصول إلى خدمات المزرعة بدون تعقيدات، شكراً لكم على بيارة السيطرة والقوة"',
      icon: '💚',
      color: 'from-green-500 to-green-600'
    }
  ]

  const features = [
    {
      id: 1,
      title: 'جهات ومؤسسات معتمدة',
      description: 'تعاون حقيقي مع جهعيات وجهات حكومية مرخصة بسيولة من وزارة الشؤون الاجتماعية',
      icon: '🏢',
      color: 'from-emerald-50 to-emerald-100/50'
    },
    {
      id: 2,
      title: 'استجابة سريعة خلال 24 ساعة',
      description: 'لا داعي للانتظار الطويل، تحصل لطلباتك للفضل الحاجة الملحة في غضون 24 ساعة',
      icon: '⚡',
      color: 'from-cyan-50 to-cyan-100/50'
    },
    {
      id: 3,
      title: 'توجيه دقيق حسب نوع الدعم',
      description: 'سواء كان احتياجك طبياً، تعليمياً، أو مادياً، تقوم بتوجيهك بالدقة المتخصصة للبية',
      icon: '🎯',
      color: 'from-violet-50 to-violet-100/50'
    },
    {
      id: 4,
      title: 'بحث ذكي حسب النطاق الجغرافي',
      description: 'ربطك بأقرب الجعمعيات الخيرية في منطقتك ومحافظتك بسهولة لضمان سرعة الوصول',
      icon: '📍',
      color: 'from-emerald-50 to-emerald-100/50'
    }
  ]

  const stats = [
    { value: '98%', label: 'نسبة نجاح', icon: '✓' },
    { value: '27', label: 'محافظة مصرية', icon: '📍' },
    { value: '1000+', label: 'جهة شريكة', icon: '🏢' },
    { value: '++11', label: 'أسرة مستفيدة', icon: '👥' }
  ]

  const steps = [
    { number: 1, title: 'أنشئ حسابك', description: 'سجل بالبيانات الأساسية بسهولة' },
    { number: 2, title: 'حدد احتياجاتك', description: 'اخترع نوع الدعم المطلوب' },
    { number: 3, title: 'التحليل الذكي', description: 'نظامنا يرشح أسس الجهات المناسبة' },
    { number: 4, title: 'توثيق الطلب', description: 'نقوم بتوثيق الطلب ومتابعته' },
    { number: 5, title: 'استجابة سريعة', description: 'تابع حالة طلبك مباشرة' }
  ]

  const faqs = [
    {
      id: 1,
      question: 'هل خدمات المنصة مجانية؟',
      answer: 'نعم خدماتنا كاملة مجانية 100% للمستحقين، حيث نقدم الدعم اللامحدود للجميع'
    },
    {
      id: 2,
      question: 'هل يتطلب توثيق الراتب على طلبي؟',
      answer: 'لا يتطلب توثيق الراتب، يكفيك تحديد احتياجاتك والتواصل مع الجهات المتخصصة'
    },
    {
      id: 3,
      question: 'ما هي المناطق والمحافظات المتاحة؟',
      answer: 'نحن نغطي جميع المحافظات المصرية بشكل كامل'
    },
    {
      id: 4,
      question: 'كيف يمكنني للحصول للجهعيات الخيرية المتخصصة؟',
      answer: 'نقدم لك بيانات البيئة الحكومية بكفالة المتطلبات التعليمية'
    },
    {
      id: 5,
      question: 'ما هي أنواع المساعدات التي تقدمونها؟',
      answer: 'نقدم مساعدات طبية وتعليمية وغذائية وسكنية وتمويلية'
    },
    {
      id: 6,
      question: 'كيف أتابع طلبي؟',
      answer: 'يمكنك متابعة طلبك من خلال لوحة التحكم الشخصية بسهولة'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-green-50 dark:from-emerald-950 dark:via-slate-900 dark:to-green-950">
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-emerald-200 dark:border-emerald-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg font-bold">🌾</span>
            </div>
            <span className="text-xl font-bold text-emerald-700 dark:text-emerald-400">FarmTec</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 transition-colors">الميزات</a>
            <a href="#testimonials" className="text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 transition-colors">الشهادات</a>
            <a href="#how-it-works" className="text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 transition-colors">كيف يعمل</a>
            <a href="#faq" className="text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 transition-colors">الأسئلة</a>
          </nav>

          <Link href="/login">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl transition-all">
              دخول الحساب
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full border border-emerald-200 dark:border-emerald-700">
                <span className="w-2 h-2 bg-emerald-600 rounded-full"></span>
                <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">منصة زراعية ذكية</span>
              </div>

              <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                <span className="text-emerald-700 dark:text-emerald-400">المنصة الزراعية</span>
                <br />
                <span className="text-slate-900 dark:text-white">الذكية الأولى</span>
              </h1>

              <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed">
                نظام متكامل يجمع بين الذكاء الاصطناعي والشافافية لضمان وصول الدعم للمزارعين المستحقين بكل سهولة وسرعة.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/login" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all">
                    ابدأ الآن مجاناً
                  </Button>
                </Link>
                <button className="px-8 py-3 border-2 border-emerald-600 dark:border-emerald-500 text-emerald-600 dark:text-emerald-400 rounded-lg font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
                  اعرف المزيد
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center gap-6 pt-4 border-t border-emerald-200 dark:border-emerald-800">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full border-2 border-white dark:border-slate-900"></div>
                  ))}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  <p className="font-semibold text-slate-900 dark:text-white">+1200 أسرة</p>
                  <p>استفادوا من الخدمة</p>
                </div>
              </div>
            </div>

            {/* Right Image */}
            <div className="relative h-96 lg:h-full rounded-2xl overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-green-500/20"></div>
              <Image
                src="/farm-hero.jpg"
                alt="منصة زراعية ذكية"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white/50 dark:bg-slate-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30 rounded-lg mb-4">
                  <span className="text-2xl">{stat.icon}</span>
                </div>
                <p className="text-4xl font-bold text-emerald-700 dark:text-emerald-400">{stat.value}</p>
                <p className="text-slate-600 dark:text-slate-400 mt-2">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full border border-emerald-200 dark:border-emerald-700 mb-4">
              <span className="w-2 h-2 bg-emerald-600 rounded-full"></span>
              <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">لماذا اختر فارم تك</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              ميزات المنصة <span className="text-emerald-600 dark:text-emerald-400">الذكية</span>
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              نظام متكامل يجمع بين الذكاء الاصطناعي والشافافية لضمان وصول الدعم بكفاءة عالية
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature) => (
              <div key={feature.id} className={`bg-gradient-to-br ${feature.color} border border-emerald-200/50 dark:border-emerald-800 rounded-2xl p-8 hover:shadow-lg transition-all duration-300`}>
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{feature.title}</h3>
                <p className="text-slate-600 dark:text-slate-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50 dark:bg-slate-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full border border-emerald-200 dark:border-emerald-700 mb-4">
              <span className="w-2 h-2 bg-emerald-600 rounded-full"></span>
              <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">رحلة المستخدم</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              كيف تحصل <span className="text-emerald-600 dark:text-emerald-400">على المساعدة؟</span>
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400">خطوات بسيطة وواضحة لضمان وصول صوتك إلى المساعدة</p>
          </div>

          <div className="relative">
            {/* Steps */}
            <div className="grid md:grid-cols-5 gap-4">
              {steps.map((step, idx) => (
                <div key={step.number} className="relative">
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                      <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-green-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                        {step.number}
                      </div>
                      {idx < steps.length - 1 && (
                        <div className="hidden md:block absolute top-8 left-16 w-[calc(100%+10px)] h-1 bg-gradient-to-r from-emerald-600 to-green-600"></div>
                      )}
                    </div>
                    <div className="text-center">
                      <h3 className="font-bold text-slate-900 dark:text-white">{step.title}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{step.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full border border-emerald-200 dark:border-emerald-700 mb-4">
              <span className="w-2 h-2 bg-emerald-600 rounded-full"></span>
              <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">قصص واقعية</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              شهادات المستفيدين <span className="text-emerald-600 dark:text-emerald-400">الحقيقية</span>
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400">آراء حقيقية من مزارعين استفادوا من الخدمة</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className={`bg-gradient-to-br ${testimonial.color} border border-emerald-200/50 dark:border-emerald-800 rounded-2xl p-8 text-white shadow-lg hover:shadow-xl transition-all`}>
                <p className="text-sm mb-6 leading-relaxed opacity-95">{testimonial.quote}</p>
                <div className="flex items-center gap-3 border-t border-white/20 pt-6">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl">{testimonial.icon}</div>
                  <div>
                    <p className="font-bold text-sm">{testimonial.name}</p>
                    <p className="text-xs opacity-90">{testimonial.title} • {testimonial.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50 dark:bg-slate-800/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full border border-emerald-200 dark:border-emerald-700 mb-4">
              <span className="w-2 h-2 bg-emerald-600 rounded-full"></span>
              <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">الأسئلة الشائعة</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white">
              أسئلة <span className="text-emerald-600 dark:text-emerald-400">متكررة</span>
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mt-4">إجابات وافية على الاستفسارات الأكثر شيوعاً</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <details key={faq.id} className="group bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 rounded-xl overflow-hidden hover:border-emerald-400 dark:hover:border-emerald-600 transition-colors">
                <summary className="cursor-pointer px-6 py-4 font-bold text-slate-900 dark:text-white flex items-center justify-between hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-colors">
                  <span>{faq.question}</span>
                  <svg className="w-5 h-5 text-emerald-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </summary>
                <div className="px-6 py-4 border-t border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/5">
                  <p className="text-slate-600 dark:text-slate-400">{faq.answer}</p>
                </div>
              </details>
            ))}
          </div>

          <div className="mt-8 bg-gradient-to-r from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-6 text-center">
            <p className="text-slate-700 dark:text-slate-300">هل لم تجد إجابة لسؤالك؟ <a href="#" className="font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700">اتصل معنا</a></p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-emerald-600 to-green-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">جاهز للبدء؟</h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">انضم إلى آلاف المزارعين الذين حسّنوا إنتاجيتهم مع FarmTec</p>
          <Link href="/login">
            <Button size="lg" className="bg-white text-emerald-700 hover:bg-emerald-50 shadow-lg hover:shadow-xl">
              ابدأ الآن مجاناً
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 dark:bg-black text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-lg mb-4 text-emerald-400">عن FarmTec</h3>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-emerald-400">الرئيسية</a></li>
                <li><a href="#" className="hover:text-emerald-400">لماذا عون؟</a></li>
                <li><a href="#" className="hover:text-emerald-400">الميزات</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4 text-emerald-400">للمستخدمين</h3>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-emerald-400">تسجيل الدخول</a></li>
                <li><a href="#" className="hover:text-emerald-400">إنشاء حساب جديد</a></li>
                <li><a href="#" className="hover:text-emerald-400">الأسئلة الشائعة</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4 text-emerald-400">روابط مهمة</h3>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-emerald-400">سياسة الخصوصية</a></li>
                <li><a href="#" className="hover:text-emerald-400">شروط الخدمة</a></li>
                <li><a href="#" className="hover:text-emerald-400">تواصل معنا</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4 text-emerald-400">تواصل معنا</h3>
              <ul className="space-y-2 text-slate-400">
                <li>البريد: info@aoun.org</li>
                <li>الهاتف: 0789 345 12 20</li>
                <li>العنوان: القاهرة - جمهورية مصر العربية</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-700 pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="flex items-center gap-2 mb-4 md:mb-0">
                <span className="text-xl font-bold text-emerald-400">FarmTec</span>
              </div>
              <p className="text-slate-400 text-sm">© 2024 جميع الحقوق محفوظة | تم التطوير بواسطة FarmTec Team</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
