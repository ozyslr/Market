import { Helmet } from 'react-helmet-async';

export function KVKKDisclosure() {
  return (
    <div className="min-h-screen bg-[#F8F8FA] dark:bg-zinc-950 pt-32 pb-20 px-4">
      <Helmet>
        <title>KVKK Aydinlatma Metni | Mercora</title>
      </Helmet>
      <div className="max-w-3xl mx-auto bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 md:p-12 border border-brand-primary/5">
        <h1 className="text-2xl font-display font-black uppercase italic mb-8 text-brand-primary dark:text-white">
          KVKK Aydinlatma Metni
        </h1>
        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-brand-primary/70 dark:text-zinc-300">
          <section>
            <h2 className="text-lg font-black text-brand-primary dark:text-white mt-8 mb-3">
              Veri Sorumlusu
            </h2>
            <p>
              6698 sayili Kisisel Verilerin Korunmasi Kanunu uyarinca, veri sorumlusu:{' '}
              <strong>Benim Olan E-Ticaret A.S.</strong> VERBIS kayit bilgisi{' '}
              <a href="/verbis" className="text-accent underline">
                VERBIS Bilgilendirme
              </a>{' '}
              sayfamizda mevcuttur.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-black text-brand-primary dark:text-white mt-8 mb-3">
              KVKK Madde 10 Kapsaminda Aydinlatma
            </h2>
            <p className="leading-relaxed">
              KVKK m.10 uyarinca asagidaki konularda sizleri bilgilendiriyoruz:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>
                <strong>Veri isleme amaci:</strong> Uyelik yonetimi, siparis ifasi, odeme, kargo
                takibi, yasal yukumluluklerin yerine getirilmesi, musteri hizmetleri
              </li>
              <li>
                <strong>Aktarilan kisiler:</strong> Odeme saglayicilari, kargo firmalari, muhasebe,
                yetkili kamu kurumlari
              </li>
              <li>
                <strong>Toplama yontemi:</strong> Web sitesi, mobil uygulama, e-posta, telefon
              </li>
              <li>
                <strong>Hukuki sebep:</strong> Sozlesme ifasi, yasal yukumluluk, acik riza, mesru
                menfaat
              </li>
            </ul>
          </section>
          <section>
            <h2 className="text-lg font-black text-brand-primary dark:text-white mt-8 mb-3">
              KVKK Madde 11 Haklari
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Kisisel verilerinizin islenip islenmedigini ogrenme</li>
              <li>Islenmisse bilgi talep etme</li>
              <li>Yurt icinde / yurt disinda aktarilan kisileri ogrenme</li>
              <li>Eksik veya yanlis verilerin duzeltilmesini isteme</li>
              <li>KVKK m.7 kapsaminda silinmesini veya yok edilmesini isteme</li>
              <li>Islemenin munhasiran otomatik sistemlerle analizine itiraz</li>
              <li>Kanuna aykiri isleme nedeniyle zararin giderilmesini talep</li>
            </ul>
          </section>
          <section>
            <h2 className="text-lg font-black text-brand-primary dark:text-white mt-8 mb-3">
              Yurt Disina Veri Aktarimi
            </h2>
            <p>
              Firebase (ABD sunuculari) uzerinde barindirilan verileriniz, Google'in AB-ABD Veri
              Gizlilik Cercevesi (DPF) sertifikasi kapsaminda yeterli koruma ile aktarilmaktadir.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
