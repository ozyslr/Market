import re

path = r"O:\AI\E-tic 2026\src\pages\SellerStore.tsx"
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the sidebar (from "<aside className="lg:col-span-3" to the closing </aside>)
old_sidebar = r'''        {/* Sidebar Info */}
        <aside className="lg:col-span-3 space-y-8">
          <div className="bg-white rounded-\[2\.5rem\] p-8 shadow-sm border border-brand-primary/5">
            <h3 className="text-xs font-black uppercase tracking-\[0\.2em\] text-brand-primary/30 mb-6">
              Satıcı Performansı
            </h3>
            <div className="space-y-6">
              <div className="p-4 bg-brand-secondary rounded-2xl border border-brand-primary/5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-\[10px\] font-bold uppercase text-brand-primary/40">
                    Kargo Hızı
                  </span>
                  <span className="text-\[10px\] font-black text-green-500 uppercase tracking-widest">
                    Hızlı
                  </span>
                </div>
                <div className="text-lg font-black text-brand-primary">
                  {seller\.fulfillment\?\.shipSpeed}
                </div>
              </div>
              <div className="p-4 bg-brand-secondary rounded-2xl border border-brand-primary/5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-\[10px\] font-bold uppercase text-brand-primary/40">
                    Uyumluluk
                  </span>
                  <span className="text-\[10px\] font-black text-accent uppercase tracking-widest">
                    En Üst
                  </span>
                </div>
                <div className="text-lg font-black text-brand-primary">
                  {seller\.fulfillment\?\.compliance}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-brand-primary text-white rounded-\[2\.5rem\] p-8 overflow-hidden relative group">
            <Zap
              size={100}
              className="absolute -top-10 -end-10 text-white/5 rotate-12 group-hover:rotate-0 transition-transform duration-700"
            />
            <Award size={24} className="text-accent mb-4" />
            <h4 className="text-xl font-display font-black leading-tight mb-4 uppercase italic">
              Küresel Çok Merkezli <br /> Satıcı
            </h4>
            <p className="text-xs text-white/60 font-medium leading-relaxed">
              Bu satıcı, hızlı küresel teslimat için İngiltere, Almanya ve Dubai'deki depolarda stok
              bulundurmaktadır.
            </p>
            <button className="mt-8 flex items-center gap-2 text-\[10px\] font-black uppercase tracking-widest text-accent hover:gap-4 transition-all">
              Kimlik Bilgilerini Doğrula <ArrowRight size={14} />
            </button>
          </div>
        </aside>'''

new_sidebar = '''        {/* Sidebar — only on product listing tabs */}
        {activeTab !== 'products' && (
        <aside className="lg:col-span-3 space-y-4">
          {/* Seller Profile Card */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-brand-primary/5 text-center">
            <img src={seller.avatar} alt={seller.name} className="w-16 h-16 rounded-full mx-auto object-cover border-2 border-accent" />
            <h3 className="text-sm font-black text-brand-primary mt-3">{seller.name}</h3>
            <div className="flex items-center justify-center gap-1 mt-1">
              <Star size={12} className="text-yellow-400 fill-yellow-400" />
              <span className="text-xs font-bold">{seller.rating}</span>
              <span className="text-[10px] text-brand-primary/30">({seller.reviewsCount})</span>
            </div>
            <p className="text-[10px] text-brand-primary/40 mt-1">{seller.followers} Takipçi</p>
            {seller.isVerified && <span className="inline-block mt-2 px-2 py-0.5 bg-green-100 text-green-600 text-[9px] font-black rounded-full">Doğrulanmış Satıcı</span>}
            <div className="flex gap-2 mt-3">
              <button onClick={handleFollow} disabled={followLoading} className="flex-1 px-3 py-2 bg-brand-primary text-white rounded-lg text-[10px] font-bold disabled:opacity-60">{following ? 'Takibi Bırak' : 'Takip Et'}</button>
              <button onClick={copyToClipboard} className="px-3 py-2 bg-brand-secondary rounded-lg text-[10px] font-bold"><Share2 size={12} /></button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-brand-primary/5 space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-brand-primary/30">Filtrele</h3>

            {/* Category */}
            <div>
              <h4 className="text-[10px] font-bold text-brand-primary/50 mb-2">Kategori</h4>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {categories.slice(0, 10).map((catId) => (
                  <button key={catId} onClick={() => setSelectedCategory(catId)} className={cn('block w-full text-left px-2 py-1 rounded text-xs', selectedCategory === catId ? 'bg-accent/10 text-accent font-bold' : 'text-brand-primary/60 hover:bg-brand-secondary/50')}>{catId.replace(/-/g, ' ')} ({sellerProducts.filter((p: any) => p.categoryId === catId).length})</button>
                ))}
              </div>
            </div>

            {/* Brand */}
            <div>
              <h4 className="text-[10px] font-bold text-brand-primary/50 mb-2">Marka</h4>
              {[...new Set(sellerProducts.map((p: any) => p.brand).filter(Boolean))].slice(0, 8).map((brand: any) => (
                <button key={brand} onClick={() => setSearchQuery(brand)} className="block w-full text-left px-2 py-1 rounded text-xs text-brand-primary/60 hover:bg-brand-secondary/50">{brand}</button>
              ))}
            </div>

            {/* Price Range */}
            <div>
              <h4 className="text-[10px] font-bold text-brand-primary/50 mb-2">Fiyat Aralığı</h4>
              <div className="flex gap-2">
                <input type="number" placeholder="Min" className="w-full px-2 py-1.5 bg-brand-secondary/30 rounded-lg text-xs border-0 outline-none" />
                <span className="text-brand-primary/20">-</span>
                <input type="number" placeholder="Max" className="w-full px-2 py-1.5 bg-brand-secondary/30 rounded-lg text-xs border-0 outline-none" />
              </div>
            </div>

            {/* Rating */}
            <div>
              <h4 className="text-[10px] font-bold text-brand-primary/50 mb-2">Puanlama</h4>
              {[4,3,2,1].map((r) => (
                <button key={r} className="block w-full text-left px-2 py-1 rounded text-xs text-brand-primary/60 hover:bg-brand-secondary/50">{'★'.repeat(r)}{'☆'.repeat(5-r)} ve üzeri</button>
              ))}
            </div>

            {/* Avantajlı Ürünler */}
            <div>
              <h4 className="text-[10px] font-bold text-brand-primary/50 mb-2">Avantajlı Ürünler</h4>
              {['Kargo Bedava', 'Hızlı Teslimat', 'İndirimli', 'Kuponlu'].map((tag) => (
                <button key={tag} className="block w-full text-left px-2 py-1 rounded text-xs text-brand-primary/60 hover:bg-brand-secondary/50">{tag}</button>
              ))}
            </div>
          </div>
        </aside>
        )}'''

content = re.sub(old_sidebar, new_sidebar, content, flags=re.DOTALL)
with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Sidebar replaced')
