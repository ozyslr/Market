import { Helmet } from 'react-helmet-async';

export function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#F8F8FA] dark:bg-zinc-950 pt-32 pb-20 px-4">
      <Helmet>
        <title>Gizlilik Politikasi | Mercora</title>
        <meta
          name="description"
          content="Mercora Gizlilik Politikasi - KVKK ve GDPR kapsaminda veri isleme esaslari"
        />
      </Helmet>
      <div className="max-w-3xl mx-auto bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 md:p-12 border border-brand-primary/5">
        <h1 className="text-2xl font-display font-black uppercase italic mb-8 text-brand-primary dark:text-white">
          Gizlilik Politikasi
        </h1>
        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-brand-primary/70 dark:text-zinc-300">
          <section>
            <h2 className="text-lg font-black text-brand-primary dark:text-white mt-8 mb-3">
              1. Veri Sorumlusu
            </h2>
            <p className="leading-relaxed">
              Bu Gizlilik Politikasi, Mercora platformunun veri sorumlusu olarak Benim Olan
              E-Ticaret A.S. tarafindan, 6698 sayili Kisisel Verilerin Korunmasi Kanunu (KVKK) ve AB
              Genel Veri Koruma Tuzugu (GDPR) kapsaminda hazirlanmistir.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-black text-brand-primary dark:text-white mt-8 mb-3">
              2. Toplanan Veri Kategorileri
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Kimlik Bilgisi:</strong> Ad, soyad, e-posta adresi
              </li>
              <li>
                <strong>Iletisim Bilgisi:</strong> Telefon, teslimat adresi
              </li>
              <li>
                <strong>Finansal Bilgi:</strong> Odeme yontemi tercihi (kredi karti bilgisi
                saklanmaz, odeme saglayici uzerinden islenir)
              </li>
              <li>
                <strong>Islem Guvenligi:</strong> IP adresi, giris kayitlari, cihaz bilgisi
              </li>
              <li>
                <strong>Pazarlama:</strong> Cerez tercihleri, tercih edilen kategoriler (sadece acik
                riza ile)
              </li>
            </ul>
          </section>
          <section>
            <h2 className="text-lg font-black text-brand-primary dark:text-white mt-8 mb-3">
              3. Islenme Amaclari ve Hukuki Sebepler
            </h2>
            <p className="leading-relaxed">
              Verileriniz su amaclarla ve hukuki sebeplerle islenmektedir:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>
                <strong>Siparisin ifasi (KVKK m.5/2-c, sozlesme):</strong> Siparis alma, odeme,
                teslimat
              </li>
              <li>
                <strong>Yasal yukumluluk (KVKK m.5/2-a):</strong> Fatura duzenleme, yasal saklama
              </li>
              <li>
                <strong>Acik riza (KVKK m.5/1):</strong> Pazarlama iletisimi, analitik cerezler
              </li>
              <li>
                <strong>Mesru menfaat (KVKK m.5/2-f):</strong> Guvenlik, dolandiricilik onleme
              </li>
            </ul>
          </section>
          <section>
            <h2 className="text-lg font-black text-brand-primary dark:text-white mt-8 mb-3">
              4. Veri Saklama Suresi
            </h2>
            <p className="leading-relaxed">
              Hesap silinene kadar profil bilgileri, yasal zorunluluk uyarinca 10 yil fatura/siparis
              kayitlari, son etkilesimden itibaren 6 ay analitik veriler, acik riza geri cekilene
              kadar pazarlama verileri saklanir.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-black text-brand-primary dark:text-white mt-8 mb-3">
              5. Ucuncu Taraflara Aktarim
            </h2>
            <p className="leading-relaxed">
              Verileriniz su ucuncu taraflarla paylasilabilir: odeme saglayicilari (Stripe, Iyzico),
              kargo firmalari, analitik hizmetleri (GA4, yalnizca riza ile), hukuki zorunluluk
              halinde yetkili kurumlar.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-black text-brand-primary dark:text-white mt-8 mb-3">
              6. Haklariniz (KVKK m.11 & GDPR m.15-22)
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Verilerinizin islenip islenmedigini ogrenme</li>
              <li>Islenmisse bilgi talep etme</li>
              <li>Islenme amacini ve amacina uygun kullanilip kullanilmadigini ogrenme</li>
              <li>Duzeltme, silme, yok edilmesini isteme</li>
              <li>Itiraz etme ve zararin giderilmesini talep etme</li>
              <li>
                <strong>Basvuru:</strong> Profil sayfanizdan "Verilerimi Sil" butonu ile veya
                support@mercora.com adresine e-posta ile
              </li>
            </ul>
          </section>
          <section>
            <h2 className="text-lg font-black text-brand-primary dark:text-white mt-8 mb-3">
              7. Cerezler
            </h2>
            <p className="leading-relaxed">
              Detayli cerez bilgisi icin{' '}
              <a href="/cookies" className="text-accent underline">
                Cerez Politikamizi
              </a>{' '}
              inceleyin. Cerez tercihlerinizi site altindaki cerez banner'indan yoneltebilirsiniz.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
