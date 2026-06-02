import { Helmet } from 'react-helmet-async';

export function TermsOfService() {
  return (
    <div className="min-h-screen bg-[#F8F8FA] dark:bg-zinc-950 pt-32 pb-20 px-4">
      <Helmet>
        <title>Kullanici Sozlesmesi | Mercora</title>
      </Helmet>
      <div className="max-w-3xl mx-auto bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 md:p-12 border border-brand-primary/5">
        <h1 className="text-2xl font-display font-black uppercase italic mb-8 text-brand-primary dark:text-white">
          Kullanici Sozlesmesi
        </h1>
        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-brand-primary/70 dark:text-zinc-300">
          <section>
            <h2 className="text-lg font-black text-brand-primary dark:text-white mt-8 mb-3">
              1. Taraflar
            </h2>
            <p>
              Bu Kullanici Sozlesmesi, Benim Olan E-Ticaret A.S. ile platformu kullanan alici ve
              saticilar arasinda akdedilir. Platforma uye olarak bu sozlesmeyi kabul etmis
              sayilirsiniz.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-black text-brand-primary dark:text-white mt-8 mb-3">
              2. Platform Hizmeti
            </h2>
            <p>
              Mercora, satici ve alicilari bulusturan bir pazar yeri platformudur. Platform,
              urunleri dogrudan satmaz. Satici-alici arasindaki satis sozlesmesinin tarafi degildir.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-black text-brand-primary dark:text-white mt-8 mb-3">
              3. Satici Yukumlulukleri
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Urun bilgilerinin dogru ve eksiksiz girilmesi</li>
              <li>Siparisin belirtilen surede kargoya verilmesi</li>
              <li>Iade ve cayma hakkina uyum</li>
              <li>Komisyon oranlarinin odemesi (kategori bazli %5-15)</li>
            </ul>
          </section>
          <section>
            <h2 className="text-lg font-black text-brand-primary dark:text-white mt-8 mb-3">
              4. Alici Yukumlulukleri
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Dogrulugu tamamlanmis siparislerin odemesi</li>
              <li>Teslim alinan urunlerin 14 gun icinde iade bildirimi</li>
              <li>Platformun guvenligini tehdit edecek eylemlerden kacinma</li>
            </ul>
          </section>
          <section>
            <h2 className="text-lg font-black text-brand-primary dark:text-white mt-8 mb-3">
              5. Komisyon ve Ucretlendirme
            </h2>
            <p>
              Platform, saticilardan kategori bazli komisyon tahsil eder: Elektronik %5, Giyim %10,
              Ev & Yasam %12, Kozmetik %15, Mu cevher %8. Komisyon ve odeme kosullari ayrica
              Komisyon Politikasi'nda belirtilmistir.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-black text-brand-primary dark:text-white mt-8 mb-3">
              6. Iptal ve Iade Kosullari
            </h2>
            <p>
              Alicilar, Mesafeli Satis Sozlesmeleri Yonetmeligi kapsaminda 14 gun icinde cayma
              haklarini kullanabilir. Iade kargo ucreti saticiya aittir. Cayma hakki istisnalari:
              hijyen urunler, kisisellestirilmis urunler.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-black text-brand-primary dark:text-white mt-8 mb-3">
              7. Sorumluluk Sinirlamasi
            </h2>
            <p>
              Platform, satici-alici anlasmazliklarinda arabulucu rolunu ustlenir. Ucuncu taraf
              iceriklerden platform sorumlu degildir. Mu cbir sebeplerde edimler askiya alinir.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
