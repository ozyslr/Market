import { Helmet } from 'react-helmet-async';

export function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#F8F8FA] dark:bg-zinc-950 pt-32 pb-20 px-4">
      <Helmet>
        <title>Gizlilik Politikası | Benim Olan</title>
        <meta
          name="description"
          content="Benim Olan Gizlilik Politikası - KVKK ve GDPR kapsamında veri işleme esasları"
        />
      </Helmet>
      <div className="max-w-3xl mx-auto bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 md:p-12 border border-brand-primary/5">
        <h1 className="text-2xl font-display font-black uppercase italic mb-8 text-brand-primary dark:text-white">
          Gizlilik Politikası
        </h1>
        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-brand-primary/70 dark:text-zinc-300">
          <section>
            <h2 className="text-lg font-black text-brand-primary dark:text-white mt-8 mb-3">
              1. Veri Sorumlusu
            </h2>
            <p className="leading-relaxed">
              Bu Gizlilik Politikası, Benim Olan platformunun veri sorumlusu olarak Benim Olan
              E-Ticaret A.S. tarafından, 6698 sayılı Kişisel Verilerin Korunmasi Kanunu (KVKK) ve AB
              Genel Veri Koruma Tüzüğü (GDPR) kapsamında hazırlanmıştır.
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
                <strong>İletişim Bilgisi:</strong> Telefon, teslimat adresi
              </li>
              <li>
                <strong>Finansal Bilgi:</strong> Ödeme yöntemi tercihi (kredi kartı bilgisi
                saklanmaz, ödeme sağlayıcı üzerinden işlenir)
              </li>
              <li>
                <strong>İşlem Güvenliği:</strong> IP adresi, giriş kayıtları, cihaz bilgisi
              </li>
              <li>
                <strong>Pazarlama:</strong> Çerez tercihleri, tercih edilen kategoriler (sadece açık
                riza ile)
              </li>
            </ul>
          </section>
          <section>
            <h2 className="text-lg font-black text-brand-primary dark:text-white mt-8 mb-3">
              3. İşlenme Amaçları ve Hukuki Sebepler
            </h2>
            <p className="leading-relaxed">
              Verileriniz su amaçlarla ve hukuki sebeplerle işlenmektedir:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>
                <strong>Siparişin ifası (KVKK m.5/2-c, sözleşme):</strong> Sipariş alma, ödeme,
                teslimat
              </li>
              <li>
                <strong>Yasal yükümlülük (KVKK m.5/2-a):</strong> Fatura düzenleme, yasal saklama
              </li>
              <li>
                <strong>Açık riza (KVKK m.5/1):</strong> Pazarlama iletişimi, analitik çerezler
              </li>
              <li>
                <strong>Meşru menfaat (KVKK m.5/2-f):</strong> Güvenlik, dolandırıcılık önleme
              </li>
            </ul>
          </section>
          <section>
            <h2 className="text-lg font-black text-brand-primary dark:text-white mt-8 mb-3">
              4. Veri Saklama Süresi
            </h2>
            <p className="leading-relaxed">
              Hesap silinene kadar profil bilgileri, yasal zorunluluk uyarınca 10 yıl fatura/sipariş
              kayıtları, son etkileşimden itibaren 6 ay analitik veriler, açık riza geri çekilene
              kadar pazarlama verileri saklanır.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-black text-brand-primary dark:text-white mt-8 mb-3">
              5. Üçüncü Taraflara Aktarım
            </h2>
            <p className="leading-relaxed">
              Verileriniz su üçüncü taraflarla paylaşılabilir: ödeme sağlayıcıları (Stripe, Iyzico),
              kargo firmaları, analitik hizmetleri (GA4, yalnızca riza ile), hukuki zorunluluk
              halinde yetkili kurumlar.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-black text-brand-primary dark:text-white mt-8 mb-3">
              6. Haklarınız (KVKK m.11 & GDPR m.15-22)
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Verilerinizin işlenip işlenmediğini öğrenme</li>
              <li>İşlenmişse bilgi talep etme</li>
              <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme</li>
              <li>Düzeltme, silme, yok edilmesini isteme</li>
              <li>İtiraz etme ve zararın giderilmesini talep etme</li>
              <li>
                <strong>Başvuru:</strong> Profil sayfanızdan "Verilerimi Sil" butonu ile veya
                support@mercora.com adresine e-posta ile
              </li>
            </ul>
          </section>
          <section>
            <h2 className="text-lg font-black text-brand-primary dark:text-white mt-8 mb-3">
              7. Çerezler
            </h2>
            <p className="leading-relaxed">
              Detaylı çerez bilgisi için{' '}
              <a href="/cookies" className="text-accent underline">
                Çerez Politikamızı
              </a>{' '}
              inceleyin. Çerez tercihlerinizi site altındaki çerez banner'indan yönetebilirsiniz.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
