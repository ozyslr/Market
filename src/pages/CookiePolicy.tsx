import { Helmet } from 'react-helmet-async';

export function CookiePolicy() {
  return (
    <div className="min-h-screen bg-[#F8F8FA] dark:bg-zinc-950 pt-32 pb-20 px-4">
      <Helmet>
        <title>Cerez Politikasi | Mercora</title>
      </Helmet>
      <div className="max-w-3xl mx-auto bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 md:p-12 border border-brand-primary/5">
        <h1 className="text-2xl font-display font-black uppercase italic mb-8 text-brand-primary dark:text-white">
          Cerez Politikasi
        </h1>
        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-brand-primary/70 dark:text-zinc-300">
          <section>
            <h2 className="text-lg font-black text-brand-primary dark:text-white mt-8 mb-3">
              Cerez Nedir?
            </h2>
            <p>
              Cerezler, bir web sitesini ziyaret ettiginizde tarayiciniza gonderilen ve cihazinizda
              saklanan kucuk metin dosyalaridir. Site islevselligi, performans ve kullanici deneyimi
              icin kullanilir.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-black text-brand-primary dark:text-white mt-8 mb-3">
              Kullandigimiz Cerezler
            </h2>
            <div className="space-y-4">
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                <h3 className="text-sm font-black text-brand-primary dark:text-white mb-1">
                  Zorunlu Cerezler (Her Zaman Aktif)
                </h3>
                <ul className="list-disc pl-5 text-xs space-y-1">
                  <li>Oturum cerezi (session) — Giris durumunuzu hatirlar, 24 saat</li>
                  <li>CSRF koruma cerezi — Guvenlik, oturum suresince</li>
                  <li>Sepet cerezi — Sepetinizdeki urunleri hatirlar, 7 gun</li>
                </ul>
              </div>
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                <h3 className="text-sm font-black text-brand-primary dark:text-white mb-1">
                  Analitik Cerezler (Opsiyonel)
                </h3>
                <ul className="list-disc pl-5 text-xs space-y-1">
                  <li>
                    Google Analytics 4 (_ga, _ga_*) — Sayfa goruntuleme, trafik analizi, 2 yil
                  </li>
                  <li>Urun etkilesim takibi — Sepete ekleme, goruntuleme, anonim</li>
                </ul>
              </div>
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                <h3 className="text-sm font-black text-brand-primary dark:text-white mb-1">
                  Pazarlama Cerezleri (Opsiyonel)
                </h3>
                <ul className="list-disc pl-5 text-xs space-y-1">
                  <li>Meta Pixel (_fbp) — Reklam kisisellestirme, donusum takibi, 90 gun</li>
                  <li>TikTok Pixel — Reklam performansi, donusum olcumu, 90 gun</li>
                </ul>
              </div>
            </div>
          </section>
          <section>
            <h2 className="text-lg font-black text-brand-primary dark:text-white mt-8 mb-3">
              Cerez Tercihlerinizi Yonetme
            </h2>
            <p>
              Cerez tercihlerinizi siteyi ilk ziyaretinizde cikan cerez banner'inda "Secimleri
              Kaydet" butonundan yonetebilirsiniz. Tarayici ayarlarinizdan cerezleri temizleyerek
              tercihlerinizi sifirlayabilir ve yeniden secim yapabilirsiniz. Tercihleriniz 6 ay
              sureyle saklanir.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
