import { Helmet } from 'react-helmet-async';

export function VERBISInfo() {
  return (
    <div className="min-h-screen bg-[#F8F8FA] dark:bg-zinc-950 pt-32 pb-20 px-4">
      <Helmet>
        <title>VERBIS Bilgilendirme | Mercora</title>
      </Helmet>
      <div className="max-w-3xl mx-auto bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 md:p-12 border border-brand-primary/5">
        <h1 className="text-2xl font-display font-black uppercase italic mb-8 text-brand-primary dark:text-white">
          VERBIS Bilgilendirme
        </h1>
        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-brand-primary/70 dark:text-zinc-300">
          <section>
            <h2 className="text-lg font-black text-brand-primary dark:text-white mt-8 mb-3">
              VERBIS Nedir?
            </h2>
            <p>
              VERBIS (Veri Sorumlulari Sicil Bilgi Sistemi), KVKK kapsaminda veri sorumlularinin
              kayit yaptirmak zorunda oldugu Kisisel Verileri Koruma Kurumu tarafindan yonetilen bir
              sistemdir.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-black text-brand-primary dark:text-white mt-8 mb-3">
              Veri Sorumlusu Bilgileri
            </h2>
            <table className="w-full text-xs border-collapse">
              <tbody>
                <tr className="border-b border-brand-primary/10">
                  <td className="py-2 font-bold w-48">Sirket Unvani</td>
                  <td className="py-2">Benim Olan E-Ticaret Anonim Sirketi</td>
                </tr>
                <tr className="border-b border-brand-primary/10">
                  <td className="py-2 font-bold">VERBIS Kayit No</td>
                  <td className="py-2">[Kayit numarasi hukuk danismani tarafindan eklenecektir]</td>
                </tr>
                <tr className="border-b border-brand-primary/10">
                  <td className="py-2 font-bold">Adres</td>
                  <td className="py-2">Turkiye</td>
                </tr>
                <tr className="border-b border-brand-primary/10">
                  <td className="py-2 font-bold">E-posta</td>
                  <td className="py-2">support@mercora.com</td>
                </tr>
                <tr className="border-b border-brand-primary/10">
                  <td className="py-2 font-bold">Veri Sozlesmesi Kapsami</td>
                  <td className="py-2">Musteri (Alici), Tedarikci (Satici), Calisan Adayi</td>
                </tr>
                <tr>
                  <td className="py-2 font-bold">Veri Kategorileri</td>
                  <td className="py-2">Kimlik, Iletisim, Finans, Islem Guvenligi, Pazarlama</td>
                </tr>
              </tbody>
            </table>
          </section>
          <section className="text-[11px] text-brand-primary/40 mt-6">
            <p>
              Bu sayfadaki bilgiler 6698 sayili KVKK ve ilgili yonetmelikler uyarinca VERBIS'e
              kayitli bilgileri yansitmaktadir. VERBIS kayit numarasi hukuk danismani tarafindan
              kayit tamamlandiktan sonra guncellenecektir.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
