import { Category } from '../types';

export const CATEGORIES: Category[] = [
  // 1. ELEKTRONİK
  {
    id: 'electronics',
    name: 'Elektronik',
    slug: 'elektronik',
    icon: 'Smartphone',
    image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&q=80&w=800',
    filterAttributes: [
      { key: 'brand', label: 'Marka', type: 'checkbox', productField: 'top-level',
        options: [{value:'Apple',label:'Apple'},{value:'Samsung',label:'Samsung'},{value:'Sony',label:'Sony'},{value:'LG',label:'LG'},{value:'Xiaomi',label:'Xiaomi'}] },
      { key: 'color', label: 'Renk', type: 'checkbox', productField: 'attributes',
        options: [{value:'Siyah',label:'Siyah'},{value:'Beyaz',label:'Beyaz'},{value:'Gri',label:'Gri'},{value:'Mavi',label:'Mavi'},{value:'Gümüş',label:'Gümüş'}] },
      { key: 'storage', label: 'Depolama', type: 'checkbox', productField: 'attributes',
        options: [{value:'64GB',label:'64 GB'},{value:'128GB',label:'128 GB'},{value:'256GB',label:'256 GB'},{value:'512GB',label:'512 GB'},{value:'1TB',label:'1 TB'}] },
      { key: 'ram', label: 'RAM', type: 'checkbox', productField: 'attributes',
        options: [{value:'4GB',label:'4 GB'},{value:'8GB',label:'8 GB'},{value:'16GB',label:'16 GB'},{value:'32GB',label:'32 GB'}] },
      { key: 'price', label: 'Fiyat', type: 'range', unit: '₺' },
      { key: 'rating', label: 'Minimum Puan', type: 'rating' },
    ],
    subGroups: [
      { name: 'Telefon & Aksesuar', items: [
        {name:'Akıllı Telefon',query:'smartphone'},{name:'iPhone',query:'iphone'},
        {name:'Android Telefon',query:'android'},{name:'Yenilenmiş Telefon',query:'refurbished'},
        {name:'Telefon Kılıfı',query:'phone-case'},{name:'Şarj Aleti',query:'charger'},
        {name:'Kulaklık',query:'headphone'},{name:'Ekran Koruyucu',query:'screen-protector'}
      ]},
      { name: 'Bilgisayar', items: [
        {name:'Laptop',query:'laptop'},{name:'Gaming Laptop',query:'gaming-laptop'},
        {name:'Masaüstü PC',query:'desktop'},{name:'All-in-One PC',query:'aio'},
        {name:'PC Bileşenleri',query:'components'},{name:'SSD & Depolama',query:'storage'}
      ]},
      { name: 'Monitör & Çevre Birimleri', items: [
        {name:'Monitör',query:'monitor'},{name:'Klavye',query:'keyboard'},
        {name:'Mouse',query:'mouse'},{name:'Webcam',query:'webcam'},{name:'Hoparlör',query:'speaker'}
      ]},
      { name: 'TV & Ses Sistemleri', items: [
        {name:'4K TV',query:'4k-tv'},{name:'QLED TV',query:'qled'},
        {name:'Soundbar',query:'soundbar'},{name:'Ev Sinema Sistemi',query:'home-cinema'}
      ]},
      { name: 'Fotoğraf & Kamera', items: [
        {name:'DSLR Fotoğraf Makinesi',query:'dslr'},{name:'Aynasız Kamera',query:'mirrorless'},
        {name:'Aksiyon Kamera',query:'action-cam'},{name:'Drone',query:'drone'},{name:'Tripod',query:'tripod'}
      ]},
      { name: 'Oyun & Konsol', items: [
        {name:'PlayStation',query:'playstation'},{name:'Xbox',query:'xbox'},
        {name:'Nintendo Switch',query:'nintendo'},{name:'PC Oyun',query:'pc-game'},{name:'Joystick',query:'controller'}
      ]},
      { name: 'Giyilebilir Teknoloji', items: [
        {name:'Akıllı Saat',query:'smartwatch'},{name:'Fitness Bilekliği',query:'fitness-band'},
        {name:'TWS Kulaklık',query:'tws'},{name:'Akıllı Gözlük',query:'smart-glasses'}
      ]},
      { name: 'Küçük Ev Aletleri', items: [
        {name:'Robot Süpürge',query:'robot-vacuum'},{name:'Hava Fritözü',query:'air-fryer'},
        {name:'Kahve Makinesi',query:'coffee-machine'},{name:'Su Isıtıcısı',query:'kettle'}
      ]},
    ],
    brands: [{name:'Apple',logo:'A'},{name:'Samsung',logo:'S'},{name:'Sony',logo:'So'},{name:'LG',logo:'LG'}]
  },

  // 2. KADIN GİYİM
  {
    id: 'kadin',
    name: 'Kadın',
    slug: 'kadin',
    icon: 'Shirt',
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=800',
    filterAttributes: [
      { key: 'brand', label: 'Marka', type: 'checkbox', productField: 'top-level',
        options: [{value:'Zara',label:'Zara'},{value:'H&M',label:'H&M'},{value:'Nike',label:'Nike'},{value:'Mango',label:'Mango'}] },
      { key: 'color', label: 'Renk', type: 'checkbox', productField: 'attributes',
        options: [{value:'Siyah',label:'Siyah'},{value:'Beyaz',label:'Beyaz'},{value:'Kırmızı',label:'Kırmızı'},{value:'Mavi',label:'Mavi'}] },
      { key: 'size', label: 'Beden', type: 'checkbox', productField: 'attributes',
        options: [{value:'XS',label:'XS'},{value:'S',label:'S'},{value:'M',label:'M'},{value:'L',label:'L'},{value:'XL',label:'XL'}] },
      { key: 'material', label: 'Kumaş', type: 'checkbox', productField: 'attributes',
        options: [{value:'Pamuk',label:'Pamuk'},{value:'Polyester',label:'Polyester'},{value:'Yün',label:'Yün'},{value:'Denim',label:'Denim'},{value:'Deri',label:'Deri'}] },
      { key: 'pattern', label: 'Desen', type: 'checkbox', productField: 'attributes',
        options: [{value:'Düz',label:'Düz'},{value:'Çizgili',label:'Çizgili'},{value:'Ekose',label:'Ekose'},{value:'Baskılı',label:'Baskılı'}] },
      { key: 'price', label: 'Fiyat', type: 'range', unit: '₺' },
    ],
    subGroups: [
      { name: 'Giyim', items: [
        {name:'Elbise',query:'dress'},{name:'Bluz & Gömlek',query:'blouse'},
        {name:'Pantolon & Tayt',query:'women-pants'},{name:'Etek',query:'skirt'},
        {name:'Kazak & Sweatshirt',query:'women-sweater'},{name:'Mont & Kaban',query:'women-coat'},
        {name:'Tişört',query:'women-tshirt'},{name:'Takım Elbise',query:'women-suit'}
      ]},
      { name: 'Ayakkabı', items: [
        {name:'Topuklu Ayakkabı',query:'heels'},{name:'Spor Ayakkabı',query:'women-sneaker'},
        {name:'Bot & Çizme',query:'women-boots'},{name:'Sandalet',query:'sandals'},{name:'Babet',query:'flats'}
      ]},
      { name: 'Çanta', items: [
        {name:'El Çantası',query:'handbag'},{name:'Sırt Çantası',query:'backpack'},
        {name:'Omuz Çantası',query:'shoulder-bag'},{name:'Clutch',query:'clutch'},{name:'Cüzdan',query:'wallet'}
      ]},
      { name: 'İç Giyim & Pijama', items: [
        {name:'Sutyen',query:'bra'},{name:'Külot',query:'underwear'},
        {name:'Pijama Takımı',query:'pajamas'},{name:'Gecelik',query:'nightgown'}
      ]},
      { name: 'Aksesuar', items: [
        {name:'Kolye & Bileklik',query:'jewelry'},{name:'Şal & Eşarp',query:'scarf'},
        {name:'Güneş Gözlüğü',query:'sunglasses'},{name:'Kemer',query:'belt'},{name:'Şapka',query:'hat'}
      ]},
      { name: 'Spor Giyim', items: [
        {name:'Spor Tayt',query:'sports-leggings'},{name:'Spor Sütyeni',query:'sports-bra'},
        {name:'Koşu Kıyafeti',query:'running-wear'},{name:'Yoga Kıyafeti',query:'yoga-wear'}
      ]},
    ],
    brands: [{name:'Zara',logo:'Z'},{name:'H&M',logo:'H'},{name:'Mango',logo:'M'},{name:'Koton',logo:'K'}]
  },

  // 3. ERKEK GİYİM
  {
    id: 'erkek',
    name: 'Erkek',
    slug: 'erkek',
    icon: 'User',
    image: 'https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?auto=format&fit=crop&q=80&w=800',
    filterAttributes: [
      { key: 'brand', label: 'Marka', type: 'checkbox', productField: 'top-level',
        options: [{value:'Nike',label:'Nike'},{value:'Adidas',label:'Adidas'},{value:"Levi's",label:"Levi's"},{value:'Tommy',label:'Tommy'}] },
      { key: 'size', label: 'Beden', type: 'checkbox', productField: 'attributes',
        options: [{value:'S',label:'S'},{value:'M',label:'M'},{value:'L',label:'L'},{value:'XL',label:'XL'},{value:'XXL',label:'XXL'}] },
      { key: 'color', label: 'Renk', type: 'checkbox', productField: 'attributes',
        options: [{value:'Siyah',label:'Siyah'},{value:'Beyaz',label:'Beyaz'},{value:'Lacivert',label:'Lacivert'},{value:'Gri',label:'Gri'},{value:'Kahverengi',label:'Kahverengi'}] },
      { key: 'material', label: 'Kumaş', type: 'checkbox', productField: 'attributes',
        options: [{value:'Pamuk',label:'Pamuk'},{value:'Polyester',label:'Polyester'},{value:'Yün',label:'Yün'},{value:'Denim',label:'Denim'}] },
      { key: 'price', label: 'Fiyat', type: 'range', unit: '₺' },
    ],
    subGroups: [
      { name: 'Giyim', items: [
        {name:'Gömlek',query:'men-shirt'},{name:'Tişört',query:'men-tshirt'},
        {name:'Pantolon',query:'men-pants'},{name:'Sweatshirt & Hoodie',query:'hoodie'},
        {name:'Mont & Kaban',query:'men-coat'},{name:'Kazak',query:'men-sweater'},
        {name:'Takım Elbise',query:'suit'},{name:'Şort',query:'shorts'}
      ]},
      { name: 'Ayakkabı', items: [
        {name:'Spor Ayakkabı',query:'men-sneaker'},{name:'Klasik Ayakkabı',query:'oxford'},
        {name:'Bot',query:'men-boots'},{name:'Terlik & Sandalet',query:'men-sandals'}
      ]},
      { name: 'Çanta & Cüzdan', items: [
        {name:'Sırt Çantası',query:'men-backpack'},{name:'Laptop Çantası',query:'laptop-bag'},
        {name:'Cüzdan',query:'men-wallet'},{name:'Postacı Çantası',query:'messenger-bag'}
      ]},
      { name: 'Aksesuar', items: [
        {name:'Kemer',query:'men-belt'},{name:'Kravat',query:'tie'},
        {name:'Saat',query:'watch'},{name:'Güneş Gözlüğü',query:'men-sunglasses'},{name:'Şapka',query:'men-hat'}
      ]},
      { name: 'Spor Giyim', items: [
        {name:'Koşu Kıyafeti',query:'men-running'},{name:'Eşofman',query:'tracksuit'},
        {name:'Futbol Forması',query:'football-kit'},{name:'Bisiklet Kıyafeti',query:'cycling-wear'}
      ]},
    ],
    brands: [{name:'Nike',logo:'N'},{name:'Adidas',logo:'A'},{name:"Levi's",logo:'L'},{name:'LC Waikiki',logo:'LC'}]
  },

  // 4. ÇOCUK & BEBEK
  {
    id: 'cocuk',
    name: 'Çocuk & Bebek',
    slug: 'cocuk-bebek',
    icon: 'Baby',
    image: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?auto=format&fit=crop&q=80&w=800',
    filterAttributes: [
      { key: 'age', label: 'Yaş Grubu', type: 'checkbox', productField: 'attributes',
        options: [{value:'0-6 Ay',label:'0-6 Ay'},{value:'6-12 Ay',label:'6-12 Ay'},{value:'1-3 Yaş',label:'1-3 Yaş'},{value:'4-8 Yaş',label:'4-8 Yaş'},{value:'9-14 Yaş',label:'9-14 Yaş'}] },
      { key: 'gender', label: 'Cinsiyet', type: 'checkbox', productField: 'attributes',
        options: [{value:'Kız',label:'Kız'},{value:'Erkek',label:'Erkek'},{value:'Unisex',label:'Unisex'}] },
      { key: 'season', label: 'Sezon', type: 'checkbox', productField: 'attributes',
        options: [{value:'Kış',label:'Kış'},{value:'Yaz',label:'Yaz'},{value:'4 Mevsim',label:'4 Mevsim'}] },
      { key: 'price', label: 'Fiyat', type: 'range', unit: '₺' },
    ],
    subGroups: [
      { name: 'Bebek (0-24 Ay)', items: [
        {name:'Bebek Arabası',query:'stroller'},{name:'Ana Kucağı',query:'carrier'},
        {name:'Bebek Kıyafeti',query:'baby-clothes'},{name:'Oto Koltuğu',query:'car-seat'},
        {name:'Bebek Bezi',query:'diaper'},{name:'Mama Sandalyesi',query:'highchair'}
      ]},
      { name: 'Oyuncak', items: [
        {name:'Lego & Yapı Oyuncakları',query:'lego'},{name:'Bebek Oyuncakları',query:'dolls'},
        {name:'RC Araçlar',query:'rc-cars'},{name:'Puzzle',query:'puzzle'},{name:'Oyun Seti',query:'playset'}
      ]},
      { name: 'Çocuk Giyim', items: [
        {name:'Kız Çocuk Elbise',query:'girls-dress'},{name:'Erkek Çocuk Takım',query:'boys-set'},
        {name:'Çocuk Spor Giyim',query:'kids-sports'},{name:'Pijama',query:'kids-pajamas'}
      ]},
      { name: 'Çocuk Ayakkabı', items: [
        {name:'Spor Ayakkabı',query:'kids-sneakers'},{name:'Okul Ayakkabısı',query:'school-shoes'},
        {name:'Bot',query:'kids-boots'}
      ]},
      { name: 'Beslenme & Bakım', items: [
        {name:'Mama & Süt',query:'baby-food'},{name:'Emzirme Ürünleri',query:'breastfeeding'},
        {name:'Bebek Bakım',query:'baby-care'},{name:'Güvenlik Ürünleri',query:'baby-safety'}
      ]},
    ],
  },

  // 3. EV & YAŞAM
  {
    id: 'home',
    name: 'Ev & Yaşam',
    slug: 'ev-yasam',
    icon: 'Home',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=800',
    filterAttributes: [
      { key: 'brand', label: 'Marka', type: 'checkbox', productField: 'top-level',
        options: [{value:'IKEA',label:'IKEA'},{value:'Karaca',label:'Karaca'},{value:'English Home',label:'English Home'},{value:'Madame Coco',label:'Madame Coco'}] },
      { key: 'material', label: 'Malzeme', type: 'checkbox', productField: 'attributes',
        options: [{value:'Ahşap',label:'Ahşap'},{value:'Metal',label:'Metal'},{value:'Cam',label:'Cam'},{value:'Plastik',label:'Plastik'},{value:'Kumaş',label:'Kumaş'}] },
      { key: 'color', label: 'Renk', type: 'checkbox', productField: 'attributes',
        options: [{value:'Beyaz',label:'Beyaz'},{value:'Siyah',label:'Siyah'},{value:'Naturel',label:'Naturel'},{value:'Gri',label:'Gri'},{value:'Bej',label:'Bej'}] },
      { key: 'price', label: 'Fiyat', type: 'range', unit: '₺' },
      { key: 'rating', label: 'Minimum Puan', type: 'rating' },
    ],
    subGroups: [
      { name: 'Mobilya', items: [
        {name:'Koltuk & Kanepe',query:'sofa'},{name:'Yemek Masası',query:'dining-table'},
        {name:'Yatak Odası',query:'bedroom-set'},{name:'Kitaplık & Raf',query:'bookshelf'},
        {name:'TV Ünitesi',query:'tv-unit'},{name:'Çalışma Masası',query:'desk'}
      ]},
      { name: 'Mutfak & Yemek', items: [
        {name:'Tencere & Tava',query:'cookware'},{name:'Bıçak Seti',query:'knife-set'},
        {name:'Kahve & Çay Ekipmanı',query:'coffee-equipment'},{name:'Depolama & Organizasyon',query:'storage'},
        {name:'Yemek Takımı',query:'dinnerware'},{name:'Air Fryer',query:'airfryer'}
      ]},
      { name: 'Banyo & Havlu', items: [
        {name:'Havlu & Bornoz',query:'towels'},{name:'Banyo Aksesuar',query:'bath-accessories'},
        {name:'Duş Perdesi',query:'shower-curtain'},{name:'Paspas',query:'bath-mat'}
      ]},
      { name: 'Yatak & Yorgan', items: [
        {name:'Yorgan',query:'duvet'},{name:'Yastık',query:'pillow'},
        {name:'Nevresim Takımı',query:'bedding-set'},{name:'Battaniye',query:'blanket'}
      ]},
      { name: 'Dekorasyon', items: [
        {name:'Tablo & Poster',query:'wall-art'},{name:'Heykel & Biblo',query:'figurine'},
        {name:'Mum & Aromalı',query:'candles'},{name:'Yapay Çiçek & Saksı',query:'plants'}
      ]},
      { name: 'Aydınlatma', items: [
        {name:'Avize',query:'chandelier'},{name:'Masa Lambası',query:'desk-lamp'},
        {name:'LED Strip',query:'led-strip'},{name:'Gece Lambası',query:'night-light'}
      ]},
      { name: 'Temizlik & Bakım', items: [
        {name:'Robot Süpürge',query:'robot-vacuum'},{name:'Süpürge',query:'vacuum'},
        {name:'Bez & Paspas',query:'cleaning-cloth'},{name:'Deterjan',query:'detergent'}
      ]},
    ],
  },

  // 4. SÜPERMARKET
  {
    id: 'supermarket',
    name: 'Süpermarket',
    slug: 'supermarket',
    icon: 'ShoppingBasket',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800',
    filterAttributes: [
      { key: 'price', label: 'Fiyat', type: 'range', unit: '₺' },
      { key: 'rating', label: 'Minimum Puan', type: 'rating' },
    ],
    subGroups: [
      { name: 'Temel Gıda', items: [
        {name:'Ekmek & Unlu Mamül',query:'bread'},{name:'Süt & Kahvaltılık',query:'dairy'},
        {name:'Et & Tavuk',query:'meat'},{name:'Meyve & Sebze',query:'produce'},
        {name:'Bakliyat & Tahıl',query:'grains'}
      ]},
      { name: 'İçecek', items: [
        {name:'Su & Maden Suyu',query:'water'},{name:'Meyve Suyu',query:'juice'},
        {name:'Çay & Kahve',query:'tea-coffee'},{name:'Enerji İçeceği',query:'energy-drink'}
      ]},
      { name: 'Atıştırmalık', items: [
        {name:'Cips & Kuruyemiş',query:'chips'},{name:'Çikolata & Şeker',query:'chocolate'},
        {name:'Bisküvi & Gofret',query:'biscuits'},{name:'Dondurma',query:'ice-cream'}
      ]},
      { name: 'Temizlik Ürünleri', items: [
        {name:'Çamaşır Deterjanı',query:'laundry'},{name:'Bulaşık Deterjanı',query:'dishwasher'},
        {name:'Ev Temizleyici',query:'home-cleaner'},{name:'Kağıt Ürünleri',query:'paper-products'}
      ]},
      { name: 'Kişisel Bakım (Market)', items: [
        {name:'Şampuan',query:'shampoo'},{name:'Diş Macunu',query:'toothpaste'},
        {name:'Sabun & Jel',query:'soap'},{name:'Deodorant',query:'deodorant'}
      ]},
    ],
  },

  // 5. KOZMETİK & KİŞİSEL BAKIM
  {
    id: 'beauty',
    name: 'Kozmetik & Bakım',
    slug: 'kozmetik',
    icon: 'Sparkles',
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=800',
    filterAttributes: [
      { key: 'brand', label: 'Marka', type: 'checkbox', productField: 'top-level',
        options: [{value:'LOreal',label:"L'Oréal"},{value:'MAC',label:'MAC'},{value:'NYX',label:'NYX'},{value:'Maybelline',label:'Maybelline'},{value:'Clinique',label:'Clinique'}] },
      { key: 'skinType', label: 'Cilt Tipi', type: 'checkbox', productField: 'attributes',
        options: [{value:'Normal',label:'Normal'},{value:'Kuru',label:'Kuru'},{value:'Yağlı',label:'Yağlı'},{value:'Karma',label:'Karma'},{value:'Hassas',label:'Hassas'}] },
      { key: 'gender', label: 'Cinsiyet', type: 'checkbox', productField: 'attributes',
        options: [{value:'Kadın',label:'Kadın'},{value:'Erkek',label:'Erkek'},{value:'Unisex',label:'Unisex'}] },
      { key: 'price', label: 'Fiyat', type: 'range', unit: '₺' },
    ],
    subGroups: [
      { name: 'Makyaj', items: [
        {name:'Fondöten & Kapatıcı',query:'foundation'},{name:'Ruj & Dudak',query:'lipstick'},
        {name:'Maskara & Eyeliner',query:'mascara'},{name:'Far Paleti',query:'eyeshadow'},
        {name:'Allık & Aydınlatıcı',query:'blush'},{name:'Makyaj Fırçası',query:'makeup-brush'}
      ]},
      { name: 'Cilt Bakımı', items: [
        {name:'Nemlendirici',query:'moisturizer'},{name:'Güneş Kremi',query:'sunscreen'},
        {name:'Serum & Ampul',query:'serum'},{name:'Temizleyici',query:'cleanser'},
        {name:'Göz Kremi',query:'eye-cream'},{name:'Yüz Maskesi',query:'face-mask'}
      ]},
      { name: 'Saç Bakımı', items: [
        {name:'Şampuan',query:'hair-shampoo'},{name:'Saç Kremi',query:'conditioner'},
        {name:'Saç Maskesi',query:'hair-mask'},{name:'Saç Boyası',query:'hair-dye'},
        {name:'Düzleştirici & Maşa',query:'hair-tools'}
      ]},
      { name: 'Parfüm', items: [
        {name:'Kadın Parfümü',query:'women-perfume'},{name:'Erkek Parfümü',query:'men-perfume'},
        {name:'Unisex Parfüm',query:'unisex-perfume'},{name:'Deodorant & Koku',query:'fragrance-deo'}
      ]},
      { name: 'Vücut Bakımı', items: [
        {name:'Vücut Losyonu',query:'body-lotion'},{name:'Scrub & Peeling',query:'scrub'},
        {name:'El & Ayak Bakımı',query:'hand-care'},{name:'Tırnak Ürünleri',query:'nail-care'}
      ]},
    ],
    brands: [{name:"L'Oréal",logo:'L'},{name:'MAC',logo:'M'},{name:'NYX',logo:'N'},{name:'Clinique',logo:'C'}]
  },

  // 6. ANNE & BEBEK
  {
    id: 'baby',
    name: 'Anne & Bebek',
    slug: 'anne-bebek',
    icon: 'Baby',
    image: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&q=80&w=800',
    filterAttributes: [
      { key: 'age', label: 'Yaş Grubu', type: 'checkbox', productField: 'attributes',
        options: [{value:'0-6 Ay',label:'0-6 Ay'},{value:'6-12 Ay',label:'6-12 Ay'},{value:'1-3 Yaş',label:'1-3 Yaş'},{value:'4-8 Yaş',label:'4-8 Yaş'},{value:'9-14 Yaş',label:'9-14 Yaş'}] },
      { key: 'gender', label: 'Cinsiyet', type: 'checkbox', productField: 'attributes',
        options: [{value:'Kız',label:'Kız'},{value:'Erkek',label:'Erkek'},{value:'Unisex',label:'Unisex'}] },
      { key: 'season', label: 'Sezon', type: 'checkbox', productField: 'attributes',
        options: [{value:'Kış',label:'Kış'},{value:'Yaz',label:'Yaz'},{value:'4 Mevsim',label:'4 Mevsim'}] },
      { key: 'price', label: 'Fiyat', type: 'range', unit: '₺' },
    ],
    subGroups: [
      { name: 'Bebek (0-24 Ay)', items: [
        {name:'Bebek Arabası',query:'stroller'},{name:'Ana Kucağı',query:'carrier'},
        {name:'Bebek Kıyafeti',query:'baby-clothes'},{name:'Oto Koltuğu',query:'car-seat'},
        {name:'Bebek Bezi',query:'diaper'},{name:'Mama Sandalyesi',query:'highchair'}
      ]},
      { name: 'Oyuncak', items: [
        {name:'Lego & Yapı Oyuncakları',query:'lego'},{name:'Bebek Oyuncakları',query:'dolls'},
        {name:'RC Araçlar',query:'rc-cars'},{name:'Puzzle',query:'puzzle'},{name:'Oyun Seti',query:'playset'}
      ]},
      { name: 'Çocuk Giyim', items: [
        {name:'Kız Çocuk Elbise',query:'girls-dress'},{name:'Erkek Çocuk Takım',query:'boys-set'},
        {name:'Çocuk Spor Giyim',query:'kids-sports'},{name:'Pijama',query:'kids-pajamas'}
      ]},
      { name: 'Çocuk Ayakkabı', items: [
        {name:'Spor Ayakkabı',query:'kids-sneakers'},{name:'Okul Ayakkabısı',query:'school-shoes'},
        {name:'Bot',query:'kids-boots'}
      ]},
      { name: 'Beslenme & Bakım', items: [
        {name:'Mama & Süt',query:'baby-food'},{name:'Emzirme Ürünleri',query:'breastfeeding'},
        {name:'Bebek Bakım',query:'baby-care'},{name:'Güvenlik Ürünleri',query:'baby-safety'}
      ]},
    ],
  },

  // 7. PET SHOP
  {
    id: 'pet',
    name: 'Pet Shop',
    slug: 'pet-shop',
    icon: 'Dog',
    image: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&q=80&w=800',
    filterAttributes: [
      { key: 'petType', label: 'Evcil Hayvan', type: 'checkbox', productField: 'attributes',
        options: [{value:'Kedi',label:'Kedi'},{value:'Köpek',label:'Köpek'},{value:'Kuş',label:'Kuş'},{value:'Balık',label:'Balık'}] },
      { key: 'price', label: 'Fiyat', type: 'range', unit: '₺' },
    ],
    subGroups: [
      { name: 'Kedi', items: [
        {name:'Kedi Maması',query:'cat-food'},{name:'Kedi Kumu',query:'cat-litter'},
        {name:'Kedi Oyuncakları',query:'cat-toys'},{name:'Kedi Yatağı',query:'cat-bed'},
        {name:'Kedi Taşıma Çantası',query:'cat-carrier'}
      ]},
      { name: 'Köpek', items: [
        {name:'Köpek Maması',query:'dog-food'},{name:'Köpek Tasması',query:'dog-leash'},
        {name:'Köpek Oyuncakları',query:'dog-toys'},{name:'Köpek Yatağı',query:'dog-bed'},
        {name:'Köpek Kıyafeti',query:'dog-clothes'}
      ]},
      { name: 'Kuş & Balık', items: [
        {name:'Kafes & Akvaryum',query:'cage-aquarium'},{name:'Kuş Maması',query:'bird-food'},
        {name:'Balık Maması & Aksesuar',query:'fish-care'}
      ]},
    ],
  },

  // 8. SPOR & OUTDOOR
  {
    id: 'sport',
    name: 'Spor & Outdoor',
    slug: 'spor-outdoor',
    icon: 'Mountain',
    image: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=800',
    filterAttributes: [
      { key: 'brand', label: 'Marka', type: 'checkbox', productField: 'top-level',
        options: [{value:'Nike',label:'Nike'},{value:'Adidas',label:'Adidas'},{value:'Under Armour',label:'Under Armour'},{value:'Columbia',label:'Columbia'},{value:'The North Face',label:'The North Face'}] },
      { key: 'sportType', label: 'Spor Dalı', type: 'checkbox', productField: 'attributes',
        options: [{value:'Koşu',label:'Koşu'},{value:'Fitness',label:'Fitness'},{value:'Yüzme',label:'Yüzme'},{value:'Bisiklet',label:'Bisiklet'},{value:'Outdoor',label:'Outdoor'},{value:'Takım Sporu',label:'Takım Sporu'}] },
      { key: 'gender', label: 'Cinsiyet', type: 'checkbox', productField: 'attributes',
        options: [{value:'Erkek',label:'Erkek'},{value:'Kadın',label:'Kadın'},{value:'Unisex',label:'Unisex'}] },
      { key: 'price', label: 'Fiyat', type: 'range', unit: '₺' },
      { key: 'rating', label: 'Minimum Puan', type: 'rating' },
    ],
    subGroups: [
      { name: 'Fitness & Gym', items: [
        {name:'Dumbbell & Halter',query:'dumbbell'},{name:'Koşu Bandı',query:'treadmill'},
        {name:'Yoga Matı & Aksesuar',query:'yoga'},{name:'Protein & Takviye',query:'supplements'},
        {name:'Fitness Eldiveni',query:'gym-gloves'}
      ]},
      { name: 'Outdoor & Kamp', items: [
        {name:'Kamp Çadırı',query:'tent'},{name:'Uyku Tulumu',query:'sleeping-bag'},
        {name:'Trekking Ayakkabısı',query:'hiking-shoes'},{name:'Tırmanma Ekipmanı',query:'climbing'},
        {name:'Kamp Ocağı',query:'camp-stove'}
      ]},
      { name: 'Bisiklet', items: [
        {name:'Dağ Bisikleti',query:'mtb'},{name:'Yol Bisikleti',query:'road-bike'},
        {name:'Elektrikli Bisiklet',query:'e-bike'},{name:'Bisiklet Aksesuar',query:'bike-accessories'}
      ]},
      { name: 'Su Sporları', items: [
        {name:'Yüzme Gözlüğü',query:'swim-goggles'},{name:'Sörf Tahtası',query:'surfboard'},
        {name:'Dalış Ekipmanı',query:'scuba'},{name:'Kano & Kayak',query:'kayak'}
      ]},
      { name: 'Takım Sporları', items: [
        {name:'Futbol',query:'football'},{name:'Basketbol',query:'basketball'},
        {name:'Voleybol',query:'volleyball'},{name:'Tenis',query:'tennis'},{name:'Padel',query:'padel'}
      ]},
      { name: 'Kış Sporları', items: [
        {name:'Kayak Ekipmanı',query:'ski'},{name:'Snowboard',query:'snowboard'},
        {name:'Termal Giyim',query:'thermal-wear'},{name:'Bere & Eldiven',query:'winter-accessories'}
      ]},
    ],
    brands: [{name:'Nike',logo:'N'},{name:'Adidas',logo:'A'},{name:'Columbia',logo:'Co'},{name:'The North Face',logo:'TNF'}]
  },

  // 9. KİTAP, MÜZİK & FİLM
  {
    id: 'kitap',
    name: 'Kitap, Müzik & Film',
    slug: 'kitap-muzik',
    icon: 'BookOpen',
    image: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&q=80&w=800',
    filterAttributes: [
      { key: 'genre', label: 'Tür', type: 'checkbox', productField: 'attributes',
        options: [{value:'Roman',label:'Roman'},{value:'Kişisel Gelişim',label:'Kişisel Gelişim'},{value:'Çocuk',label:'Çocuk'},{value:'Bilim',label:'Bilim'},{value:'Tarih',label:'Tarih'},{value:'Yabancı Dil',label:'Yabancı Dil'}] },
      { key: 'price', label: 'Fiyat', type: 'range', unit: '₺' },
      { key: 'rating', label: 'Minimum Puan', type: 'rating' },
    ],
    subGroups: [
      { name: 'Kitap', items: [
        {name:'Roman & Hikaye',query:'fiction'},{name:'Kişisel Gelişim',query:'self-help'},
        {name:'Çocuk Kitapları',query:'childrens-books'},{name:'Bilim & Akademik',query:'science-books'},
        {name:'Tarih & Biyografi',query:'history-books'},{name:'Yabancı Dil',query:'foreign-books'}
      ]},
      { name: 'Müzik Enstrümanları', items: [
        {name:'Gitar',query:'guitar'},{name:'Piyano & Klavye',query:'piano'},
        {name:'Davul & Perküsyon',query:'drums'},{name:'Üflemeli Çalgılar',query:'wind-instruments'},
        {name:'Müzik Aksesuarları',query:'music-accessories'}
      ]},
      { name: 'Film & Dizi', items: [
        {name:'Blu-ray & DVD',query:'bluray'},{name:'Koleksiyon Kutuları',query:'box-sets'}
      ]},
      { name: 'Ofis & Kırtasiye', items: [
        {name:'Defter & Ajanda',query:'notebooks'},{name:'Kalem & Dolma Kalem',query:'pens'},
        {name:'Sanat Malzemeleri',query:'art-supplies'},{name:'Masaüstü Düzenleyici',query:'desk-organizer'}
      ]},
    ],
  },

  // 10. OYUN & HOBİ
  {
    id: 'oyun',
    name: 'Oyun & Hobi',
    slug: 'oyun-hobi',
    icon: 'Gamepad2',
    image: 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?auto=format&fit=crop&q=80&w=800',
    filterAttributes: [
      { key: 'platform', label: 'Platform', type: 'checkbox', productField: 'attributes',
        options: [{value:'PlayStation',label:'PlayStation'},{value:'Xbox',label:'Xbox'},{value:'Nintendo',label:'Nintendo'},{value:'PC',label:'PC'},{value:'Mobile',label:'Mobile'}] },
      { key: 'price', label: 'Fiyat', type: 'range', unit: '₺' },
      { key: 'rating', label: 'Minimum Puan', type: 'rating' },
    ],
    subGroups: [
      { name: 'Video Oyunları', items: [
        {name:'PlayStation Oyunları',query:'ps-games'},{name:'Xbox Oyunları',query:'xbox-games'},
        {name:'Nintendo Oyunları',query:'nintendo-games'},{name:'PC Oyunları',query:'pc-games'}
      ]},
      { name: 'Kutu & Kart Oyunları', items: [
        {name:'Strateji Oyunları',query:'strategy-games'},{name:'Aile Oyunları',query:'family-games'},
        {name:'Kart Oyunları',query:'card-games'},{name:'Puzzle & Yapboz',query:'jigsaw'}
      ]},
      { name: 'Koleksiyon & Figür', items: [
        {name:'Anime Figürleri',query:'anime-figures'},{name:'Diecast Araçlar',query:'diecast'},
        {name:'Funko Pop',query:'funko-pop'},{name:'Model Kitleri',query:'model-kits'}
      ]},
      { name: 'Hobi & El İşi', items: [
        {name:'Boyama & Çizim',query:'painting'},{name:'Nakış & Örgü',query:'knitting'},
        {name:'Ahşap El Sanatları',query:'woodworking'},{name:'Fotoğrafçılık Hobi',query:'photography-hobby'}
      ]},
    ],
  },

  // 11. OTOMOTİV
  {
    id: 'oto',
    name: 'Otomotiv',
    slug: 'otomotiv',
    icon: 'Car',
    image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=800',
    filterAttributes: [
      { key: 'brand', label: 'Marka', type: 'checkbox', productField: 'top-level',
        options: [{value:'Bosch',label:'Bosch'},{value:'Pirelli',label:'Pirelli'},{value:'3M',label:'3M'},{value:'Castrol',label:'Castrol'}] },
      { key: 'carType', label: 'Araç Tipi', type: 'checkbox', productField: 'attributes',
        options: [{value:'Binek',label:'Binek'},{value:'SUV',label:'SUV'},{value:'Ticari',label:'Ticari'},{value:'Motorsiklet',label:'Motorsiklet'}] },
      { key: 'price', label: 'Fiyat', type: 'range', unit: '₺' },
    ],
    subGroups: [
      { name: 'Araç Aksesuarları', items: [
        {name:'Navigasyon & GPS',query:'gps'},{name:'Araç Kamerası',query:'dashcam'},
        {name:'Araç Şarj Cihazı',query:'car-charger'},{name:'Oto Kokusu',query:'car-fragrance'},
        {name:'Koltuk Kılıfı',query:'seat-cover'}
      ]},
      { name: 'Bakım & Yedek Parça', items: [
        {name:'Motor Yağı',query:'engine-oil'},{name:'Fren Takımı',query:'brake-pads'},
        {name:'Akü',query:'car-battery'},{name:'Silecek',query:'wipers'},{name:'Filtre',query:'car-filter'}
      ]},
      { name: 'Lastik & Jant', items: [
        {name:'Yaz Lastiği',query:'summer-tires'},{name:'Kış Lastiği',query:'winter-tires'},
        {name:'Çelik Jant',query:'steel-rims'},{name:'Alaşım Jant',query:'alloy-wheels'}
      ]},
      { name: 'Motosiklet', items: [
        {name:'Kask',query:'helmet'},{name:'Moto Giyim',query:'moto-gear'},
        {name:'Moto Aksesuar',query:'moto-accessories'}
      ]},
    ],
  },

  // 12. YAPI MARKET & BAHÇE
  {
    id: 'yapi',
    name: 'Yapı Market & Bahçe',
    slug: 'yapi-market',
    icon: 'Wrench',
    image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&q=80&w=800',
    filterAttributes: [
      { key: 'brand', label: 'Marka', type: 'checkbox', productField: 'top-level',
        options: [{value:'Bosch',label:'Bosch'},{value:'Makita',label:'Makita'},{value:'DeWalt',label:'DeWalt'},{value:'Stanley',label:'Stanley'}] },
      { key: 'toolType', label: 'Ürün Tipi', type: 'checkbox', productField: 'attributes',
        options: [{value:'El Aleti',label:'El Aleti'},{value:'Güç Aleti',label:'Güç Aleti'},{value:'Bahçe',label:'Bahçe'},{value:'Boya',label:'Boya'},{value:'Elektrik',label:'Elektrik'}] },
      { key: 'price', label: 'Fiyat', type: 'range', unit: '₺' },
    ],
    subGroups: [
      { name: 'El & Güç Aletleri', items: [
        {name:'Tornavida & Pense',query:'hand-tools'},{name:'Matkap & Delici',query:'drill'},
        {name:'Testere & Kesici',query:'saw'},{name:'Ölçüm Aletleri',query:'measuring-tools'}
      ]},
      { name: 'Elektrik & Aydınlatma', items: [
        {name:'Priz & Fiş',query:'socket'},{name:'Kablo & Kanal',query:'cable'},
        {name:'LED Ampul',query:'led-bulb'},{name:'Sigorta & Tablo',query:'fuse-box'}
      ]},
      { name: 'Boya & Yapıştırıcı', items: [
        {name:'İç Cephe Boyası',query:'interior-paint'},{name:'Dış Cephe Boyası',query:'exterior-paint'},
        {name:'Yapıştırıcı & Dolgu',query:'adhesive'},{name:'Rulo & Fırça',query:'paint-tools'}
      ]},
      { name: 'Bahçe', items: [
        {name:'Çim Biçme Makinesi',query:'lawn-mower'},{name:'Bahçe Hortumu',query:'garden-hose'},
        {name:'Saksı & Toprak',query:'pots'},{name:'Bahçe El Aletleri',query:'garden-tools'},
        {name:'Sulama Sistemi',query:'irrigation'}
      ]},
    ],
  },

  // 13. SEYAHAT & BAVUL
  {
    id: 'seyahat',
    name: 'Seyahat & Bavul',
    slug: 'seyahat',
    icon: 'Briefcase',
    image: 'https://images.unsplash.com/photo-1488085061387-422e29b40080?auto=format&fit=crop&q=80&w=800',
    filterAttributes: [
      { key: 'brand', label: 'Marka', type: 'checkbox', productField: 'top-level',
        options: [{value:'Samsonite',label:'Samsonite'},{value:'American Tourister',label:'American Tourister'},{value:'Delsey',label:'Delsey'},{value:'Roncato',label:'Roncato'}] },
      { key: 'price', label: 'Fiyat', type: 'range', unit: '₺' },
    ],
    subGroups: [
      { name: 'Bavul & Çanta', items: [
        {name:'Kabin Bavulu',query:'cabin-luggage'},{name:'Büyük Bavul',query:'large-luggage'},
        {name:'Sırt Çantası',query:'travel-backpack'},{name:'El Bagajı',query:'carry-on'}
      ]},
      { name: 'Seyahat Aksesuarları', items: [
        {name:'Seyahat Yastığı',query:'travel-pillow'},{name:'Adaptör & Çoğaltıcı',query:'travel-adapter'},
        {name:'Pasaport Kılıfı',query:'passport-holder'},{name:'Valiz Kilidi',query:'luggage-lock'},
        {name:'Makyaj & Tuvalet Çantası',query:'toiletry-bag'}
      ]},
      { name: 'Outdoor Seyahat', items: [
        {name:'Trekking Çantası',query:'trekking-bag'},{name:'Bel Çantası',query:'fanny-pack'},
        {name:'Hidrasyon Sırt Çantası',query:'hydration-pack'}
      ]},
    ],
  },

  // ── L2 SUBKATEGORİLER — ELEKTRONİK ──────────────────────────────────────
  { id: 'elec-telefon', name: 'Telefon & Aksesuar', slug: 'telefon-aksesuar', parentId: 'electronics', level: 2 as const, menuOrder: 1,
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=400',
    items: [{name:'Akıllı Telefon',query:'smartphone'},{name:'iPhone',query:'iphone'},{name:'Android Telefon',query:'android'},{name:'Yenilenmiş Telefon',query:'refurbished'},{name:'Telefon Kılıfı',query:'phone-case'},{name:'Şarj Aleti',query:'charger'},{name:'Kulaklık',query:'headphone'},{name:'Ekran Koruyucu',query:'screen-protector'}] },
  { id: 'elec-bilgisayar', name: 'Bilgisayar', slug: 'bilgisayar', parentId: 'electronics', level: 2 as const, menuOrder: 2,
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&q=80&w=400',
    items: [{name:'Laptop',query:'laptop'},{name:'Gaming Laptop',query:'gaming-laptop'},{name:'Masaüstü PC',query:'desktop'},{name:'All-in-One PC',query:'aio'},{name:'PC Bileşenleri',query:'components'},{name:'SSD & Depolama',query:'storage'}] },
  { id: 'elec-monitor', name: 'Monitör & Çevre Birimleri', slug: 'monitor-cevre', parentId: 'electronics', level: 2 as const, menuOrder: 3,
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&q=80&w=400',
    items: [{name:'Monitör',query:'monitor'},{name:'Klavye',query:'keyboard'},{name:'Mouse',query:'mouse'},{name:'Webcam',query:'webcam'},{name:'Hoparlör',query:'speaker'}] },
  { id: 'elec-tv', name: 'TV & Ses Sistemleri', slug: 'tv-ses', parentId: 'electronics', level: 2 as const, menuOrder: 4,
    image: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&q=80&w=400',
    items: [{name:'4K TV',query:'4k-tv'},{name:'QLED TV',query:'qled'},{name:'Soundbar',query:'soundbar'},{name:'Ev Sinema Sistemi',query:'home-cinema'}] },
  { id: 'elec-kamera', name: 'Fotoğraf & Kamera', slug: 'fotograf-kamera', parentId: 'electronics', level: 2 as const, menuOrder: 5,
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=400',
    items: [{name:'DSLR Fotoğraf Makinesi',query:'dslr'},{name:'Aynasız Kamera',query:'mirrorless'},{name:'Aksiyon Kamera',query:'action-cam'},{name:'Drone',query:'drone'},{name:'Tripod',query:'tripod'}] },
  { id: 'elec-oyun', name: 'Oyun & Konsol', slug: 'oyun-konsol', parentId: 'electronics', level: 2 as const, menuOrder: 6,
    image: 'https://images.unsplash.com/photo-1593118247619-e2d6f056869e?auto=format&fit=crop&q=80&w=400',
    items: [{name:'PlayStation',query:'playstation'},{name:'Xbox',query:'xbox'},{name:'Nintendo Switch',query:'nintendo'},{name:'PC Oyun',query:'pc-game'},{name:'Joystick',query:'controller'}] },
  { id: 'elec-giyilebilir', name: 'Giyilebilir Teknoloji', slug: 'giyilebilir', parentId: 'electronics', level: 2 as const, menuOrder: 7,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=400',
    items: [{name:'Akıllı Saat',query:'smartwatch'},{name:'Fitness Bilekliği',query:'fitness-band'},{name:'TWS Kulaklık',query:'tws'},{name:'Akıllı Gözlük',query:'smart-glasses'}] },

  // ── L2 SUBKATEGORİLER — KADIN ────────────────────────────────────────────
  { id: 'kadin-giyim', name: 'Giyim', slug: 'kadin-giyim', parentId: 'kadin', level: 2 as const, menuOrder: 1,
    image: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&q=80&w=400',
    items: [{name:'Elbise',query:'dress'},{name:'Bluz & Gömlek',query:'blouse'},{name:'Pantolon & Tayt',query:'women-pants'},{name:'Etek',query:'skirt'},{name:'Kazak & Sweatshirt',query:'women-sweater'},{name:'Mont & Kaban',query:'women-coat'},{name:'Tişört',query:'women-tshirt'},{name:'Takım Elbise',query:'women-suit'}] },
  { id: 'kadin-ayakkabi', name: 'Ayakkabı', slug: 'kadin-ayakkabi', parentId: 'kadin', level: 2 as const, menuOrder: 2,
    image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=80&w=400',
    items: [{name:'Topuklu Ayakkabı',query:'heels'},{name:'Spor Ayakkabı',query:'women-sneaker'},{name:'Bot & Çizme',query:'women-boots'},{name:'Sandalet',query:'sandals'},{name:'Babet',query:'flats'}] },
  { id: 'kadin-canta', name: 'Çanta', slug: 'kadin-canta', parentId: 'kadin', level: 2 as const, menuOrder: 3,
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=400',
    items: [{name:'El Çantası',query:'handbag'},{name:'Sırt Çantası',query:'backpack'},{name:'Omuz Çantası',query:'shoulder-bag'},{name:'Clutch',query:'clutch'},{name:'Cüzdan',query:'wallet'}] },
  { id: 'kadin-aksesuar', name: 'Aksesuar', slug: 'kadin-aksesuar', parentId: 'kadin', level: 2 as const, menuOrder: 4,
    image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=400',
    items: [{name:'Kolye & Bileklik',query:'jewelry'},{name:'Şal & Eşarp',query:'scarf'},{name:'Güneş Gözlüğü',query:'sunglasses'},{name:'Kemer',query:'belt'},{name:'Şapka',query:'hat'}] },
  { id: 'kadin-spor', name: 'Spor Giyim', slug: 'kadin-spor', parentId: 'kadin', level: 2 as const, menuOrder: 5,
    image: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&q=80&w=400',
    items: [{name:'Spor Tayt',query:'sports-leggings'},{name:'Spor Sütyeni',query:'sports-bra'},{name:'Koşu Kıyafeti',query:'running-wear'},{name:'Yoga Kıyafeti',query:'yoga-wear'}] },

  // ── L2 SUBKATEGORİLER — ERKEK ────────────────────────────────────────────
  { id: 'erkek-giyim', name: 'Giyim', slug: 'erkek-giyim', parentId: 'erkek', level: 2 as const, menuOrder: 1,
    image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&q=80&w=400',
    items: [{name:'Gömlek',query:'men-shirt'},{name:'Tişört',query:'men-tshirt'},{name:'Pantolon',query:'men-pants'},{name:'Sweatshirt & Hoodie',query:'hoodie'},{name:'Mont & Kaban',query:'men-coat'},{name:'Kazak',query:'men-sweater'},{name:'Takım Elbise',query:'suit'},{name:'Şort',query:'shorts'}] },
  { id: 'erkek-ayakkabi', name: 'Ayakkabı', slug: 'erkek-ayakkabi', parentId: 'erkek', level: 2 as const, menuOrder: 2,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=400',
    items: [{name:'Spor Ayakkabı',query:'men-sneaker'},{name:'Klasik Ayakkabı',query:'oxford'},{name:'Bot',query:'men-boots'},{name:'Terlik & Sandalet',query:'men-sandals'}] },
  { id: 'erkek-canta', name: 'Çanta & Cüzdan', slug: 'erkek-canta', parentId: 'erkek', level: 2 as const, menuOrder: 3,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=400',
    items: [{name:'Sırt Çantası',query:'men-backpack'},{name:'Laptop Çantası',query:'laptop-bag'},{name:'Cüzdan',query:'men-wallet'},{name:'Postacı Çantası',query:'messenger-bag'}] },
  { id: 'erkek-aksesuar', name: 'Aksesuar', slug: 'erkek-aksesuar', parentId: 'erkek', level: 2 as const, menuOrder: 4,
    image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&q=80&w=400',
    items: [{name:'Kemer',query:'men-belt'},{name:'Kravat',query:'tie'},{name:'Saat',query:'watch'},{name:'Güneş Gözlüğü',query:'men-sunglasses'},{name:'Şapka',query:'men-hat'}] },
  { id: 'erkek-spor', name: 'Spor Giyim', slug: 'erkek-spor', parentId: 'erkek', level: 2 as const, menuOrder: 5,
    image: 'https://images.unsplash.com/photo-1571019613914-85f342c6a11e?auto=format&fit=crop&q=80&w=400',
    items: [{name:'Koşu Kıyafeti',query:'men-running'},{name:'Eşofman',query:'tracksuit'},{name:'Futbol Forması',query:'football-kit'},{name:'Bisiklet Kıyafeti',query:'cycling-wear'}] },

  // ── L2 SUBKATEGORİLER — EV & YAŞAM ──────────────────────────────────────
  { id: 'home-mobilya', name: 'Mobilya', slug: 'ev-mobilya', parentId: 'home', level: 2 as const, menuOrder: 1,
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=400',
    items: [{name:'Koltuk & Kanepe',query:'sofa'},{name:'Yemek Masası',query:'dining-table'},{name:'Yatak Odası',query:'bedroom-set'},{name:'Kitaplık & Raf',query:'bookshelf'},{name:'TV Ünitesi',query:'tv-unit'},{name:'Çalışma Masası',query:'desk'}] },
  { id: 'home-mutfak', name: 'Mutfak & Yemek', slug: 'ev-mutfak', parentId: 'home', level: 2 as const, menuOrder: 2,
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&q=80&w=400',
    items: [{name:'Tencere & Tava',query:'cookware'},{name:'Bıçak Seti',query:'knife-set'},{name:'Kahve & Çay Ekipmanı',query:'coffee-equipment'},{name:'Depolama & Organizasyon',query:'storage'},{name:'Yemek Takımı',query:'dinnerware'},{name:'Air Fryer',query:'airfryer'}] },
  { id: 'home-yatak', name: 'Yatak & Yorgan', slug: 'ev-yatak', parentId: 'home', level: 2 as const, menuOrder: 3,
    image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&q=80&w=400',
    items: [{name:'Yorgan',query:'duvet'},{name:'Yastık',query:'pillow'},{name:'Nevresim Takımı',query:'bedding-set'},{name:'Battaniye',query:'blanket'}] },
  { id: 'home-dekor', name: 'Dekorasyon', slug: 'ev-dekor', parentId: 'home', level: 2 as const, menuOrder: 4,
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&q=80&w=400',
    items: [{name:'Tablo & Poster',query:'wall-art'},{name:'Heykel & Biblo',query:'figurine'},{name:'Mum & Aromalı',query:'candles'},{name:'Yapay Çiçek & Saksı',query:'plants'}] },
  { id: 'home-aydinlatma', name: 'Aydınlatma', slug: 'ev-aydinlatma', parentId: 'home', level: 2 as const, menuOrder: 5,
    image: 'https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?auto=format&fit=crop&q=80&w=400',
    items: [{name:'Avize',query:'chandelier'},{name:'Masa Lambası',query:'desk-lamp'},{name:'LED Strip',query:'led-strip'},{name:'Gece Lambası',query:'night-light'}] },

  // ── L2 SUBKATEGORİLER — KOZMETİK & BAKIM ────────────────────────────────
  { id: 'beauty-makyaj', name: 'Makyaj', slug: 'makyaj', parentId: 'beauty', level: 2 as const, menuOrder: 1,
    image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&q=80&w=400',
    items: [{name:'Fondöten & Kapatıcı',query:'foundation'},{name:'Ruj & Dudak',query:'lipstick'},{name:'Maskara & Eyeliner',query:'mascara'},{name:'Far Paleti',query:'eyeshadow'},{name:'Allık & Aydınlatıcı',query:'blush'},{name:'Makyaj Fırçası',query:'makeup-brush'}] },
  { id: 'beauty-cilt', name: 'Cilt Bakımı', slug: 'cilt-bakimi', parentId: 'beauty', level: 2 as const, menuOrder: 2,
    image: 'https://images.unsplash.com/photo-1556228578-567ba14f75f0?auto=format&fit=crop&q=80&w=400',
    items: [{name:'Nemlendirici',query:'moisturizer'},{name:'Güneş Kremi',query:'sunscreen'},{name:'Serum & Ampul',query:'serum'},{name:'Temizleyici',query:'cleanser'},{name:'Göz Kremi',query:'eye-cream'},{name:'Yüz Maskesi',query:'face-mask'}] },
  { id: 'beauty-sac', name: 'Saç Bakımı', slug: 'sac-bakimi', parentId: 'beauty', level: 2 as const, menuOrder: 3,
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=400',
    items: [{name:'Şampuan',query:'hair-shampoo'},{name:'Saç Kremi',query:'conditioner'},{name:'Saç Maskesi',query:'hair-mask'},{name:'Saç Boyası',query:'hair-dye'},{name:'Düzleştirici & Maşa',query:'hair-tools'}] },
  { id: 'beauty-parfum', name: 'Parfüm', slug: 'parfum', parentId: 'beauty', level: 2 as const, menuOrder: 4,
    image: 'https://images.unsplash.com/photo-1541643600914-78b084683702?auto=format&fit=crop&q=80&w=400',
    items: [{name:'Kadın Parfümü',query:'women-perfume'},{name:'Erkek Parfümü',query:'men-perfume'},{name:'Unisex Parfüm',query:'unisex-perfume'},{name:'Deodorant & Koku',query:'fragrance-deo'}] },

  // ── L2 SUBKATEGORİLER — SPOR & OUTDOOR ──────────────────────────────────
  { id: 'sport-fitness', name: 'Fitness & Gym', slug: 'fitness-gym', parentId: 'sport', level: 2 as const, menuOrder: 1,
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=400',
    items: [{name:'Dumbbell & Halter',query:'dumbbell'},{name:'Koşu Bandı',query:'treadmill'},{name:'Yoga Matı & Aksesuar',query:'yoga'},{name:'Protein & Takviye',query:'supplements'},{name:'Fitness Eldiveni',query:'gym-gloves'}] },
  { id: 'sport-outdoor', name: 'Outdoor & Kamp', slug: 'outdoor-kamp', parentId: 'sport', level: 2 as const, menuOrder: 2,
    image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&q=80&w=400',
    items: [{name:'Kamp Çadırı',query:'tent'},{name:'Uyku Tulumu',query:'sleeping-bag'},{name:'Trekking Ayakkabısı',query:'hiking-shoes'},{name:'Tırmanma Ekipmanı',query:'climbing'},{name:'Kamp Ocağı',query:'camp-stove'}] },
  { id: 'sport-bisiklet', name: 'Bisiklet', slug: 'bisiklet', parentId: 'sport', level: 2 as const, menuOrder: 3,
    image: 'https://images.unsplash.com/photo-1511994298241-608e28f14fde?auto=format&fit=crop&q=80&w=400',
    items: [{name:'Dağ Bisikleti',query:'mtb'},{name:'Yol Bisikleti',query:'road-bike'},{name:'Elektrikli Bisiklet',query:'e-bike'},{name:'Bisiklet Aksesuar',query:'bike-accessories'}] },
  { id: 'sport-takim', name: 'Takım Sporları', slug: 'takim-sporlari', parentId: 'sport', level: 2 as const, menuOrder: 4,
    image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&q=80&w=400',
    items: [{name:'Futbol',query:'football'},{name:'Basketbol',query:'basketball'},{name:'Voleybol',query:'volleyball'},{name:'Tenis',query:'tennis'},{name:'Padel',query:'padel'}] },
];

