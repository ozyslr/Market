import { Helmet } from 'react-helmet-async';

export function CookiePolicy() {
  return (
    <div className="min-h-screen bg-[#F8F8FA] dark:bg-zinc-950 pt-32 pb-20 px-4">
      <Helmet>
        <title>Çerez Politikası | Benim Olan</title>
      </Helmet>
      <div className="max-w-3xl mx-auto bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 md:p-12 border border-brand-primary/5">
        <h1 className="text-2xl font-display font-black uppercase italic mb-8 text-brand-primary dark:text-white">
          Çerez Politikası
        </h1>
        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-brand-primary/70 dark:text-zinc-300">
          <section>
            <h2 className="text-lg font-black text-brand-primary dark:text-white mt-8 mb-3">
              Çerez Nedir?
            </h2>
            <p>
              Çerezler, bir web sitesini ziyaret ettiğinizde tarayıcınıza gönderilen ve cihazınızda
              saklanan küçük metin dosyalarıdır. Site işlevselliği, performans ve kullanıcı deneyimi
              için kullanılır.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-black text-brand-primary dark:text-white mt-8 mb-3">
              Kullandığımız Çerezler
            </h2>
            <div className="space-y-4">
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                <h3 className="text-sm font-black text-brand-primary dark:text-white mb-1">
                  Zorunlu Çerezler (Her Zaman Aktif)
                </h3>
                <ul className="list-disc pl-5 text-xs space-y-1">
                  <li>Oturum çerezi (session) — Giriş durumunuzu hatırlar, 24 saat</li>
                  <li>CSRF koruma çerezi — Güvenlik, oturum süresince</li>
                  <li>Sepet çerezi — Sepetinizdeki ürünleri hatırlar, 7 gün</li>
                </ul>
              </div>
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                <h3 className="text-sm font-black text-brand-primary dark:text-white mb-1">
                  Analitik Çerezler (Opsiyonel)
                </h3>
                <ul className="list-disc pl-5 text-xs space-y-1">
                  <li>
                    Google Analytics 4 (_ga, _ga_*) — Sayfa görüntüleme, trafik analizi, 2 yıl
                  </li>
                  <li>Ürün etkileşim takibi — Sepete ekleme, görüntüleme, anonim</li>
                </ul>
              </div>
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                <h3 className="text-sm font-black text-brand-primary dark:text-white mb-1">
                  Pazarlama Çerezleri (Opsiyonel)
                </h3>
                <ul className="list-disc pl-5 text-xs space-y-1">
                  <li>Meta Pixel (_fbp) — Reklam kişiselleştirme, dönüşüm takibi, 90 gün</li>
                  <li>TikTok Pixel — Reklam performansı, dönüşüm ölçümü, 90 gün</li>
                </ul>
              </div>
            </div>
          </section>
          <section>
            <h2 className="text-lg font-black text-brand-primary dark:text-white mt-8 mb-3">
              Çerez Tercihlerinizi Yönetme
            </h2>
            <p>
              Çerez tercihlerinizi siteyi ilk ziyaretinizde çıkan çerez banner'inda "Seçimleri
              Kaydet" butonundan yönetebilirsiniz. Tarayıcı ayarlarınızdan çerezleri temizleyerek
              tercihlerinizi sıfırlayabilir ve yeniden seçim yapabilirsiniz. Tercihleriniz 6 ay
              süreyle saklanır.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
