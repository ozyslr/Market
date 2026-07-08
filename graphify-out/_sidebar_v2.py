path = r"O:\AI\E-tic 2026\src\pages\SellerStore.tsx"
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find the sidebar start and count through it
import re
# Find the old sidebar — from "Sidebar — only non-homepage" to the closing </aside> before <main>
start_marker = '{/* Sidebar — only non-homepage */}'
start_idx = content.find(start_marker)
if start_idx < 0:
    print("Sidebar marker not found")
    exit(1)

# Find the matching closing pair: {activeTab !== 'products' && ( ... </aside> )}
# Walk forward from start_idx
depth = 0
paren_depth = 0
in_jsx_expr = False
i = start_idx
while i < len(content):
    c = content[i]
    if c == '{': depth += 1
    elif c == '}': depth -= 1
    elif c == '<':
        # Check if it's </aside>
        if content[i:i+8] == '</aside>':
            # Make sure we're at the right depth
            if depth == 0:
                i += 8
                # Check if the next char is the closing of the conditional
                rest = content[i:i+20].strip()
                if rest.startswith(')'):
                    i += 1
                    break
    i += 1

end_idx = i
old_sidebar = content[start_idx:end_idx]

new_sidebar = '''{/* Sidebar — only non-homepage */}
          {activeTab !== 'products' && (
            <aside className="w-64 shrink-0 space-y-3 hidden lg:block">
              {/* Seller Profile Card */}
              <div className="bg-white rounded-2xl p-3 shadow-sm border border-brand-primary/5 text-center">
                <img src={seller.avatar} alt={seller.name} className="w-10 h-10 rounded-full mx-auto object-cover border border-accent/20" />
                <h3 className="text-xs font-bold text-brand-primary mt-1.5">{seller.name}</h3>
                <div className="flex items-center justify-center gap-1 text-[11px]"><Star size={10} className="text-yellow-400 fill-yellow-400" /><span className="font-bold">{seller.rating}</span><span className="text-brand-primary/30">({seller.reviewsCount})</span></div>
                <div className="flex gap-1.5 mt-2">
                  <button onClick={handleFollow} disabled={followLoading} className="flex-1 px-2 py-1.5 bg-brand-primary text-white rounded-lg text-[10px] font-bold disabled:opacity-60">{following ? 'Takibi Bırak' : 'Takip Et'}</button>
                  <button onClick={copyToClipboard} className="px-2 py-1.5 bg-brand-secondary rounded-lg"><Share2 size={11} /></button>
                </div>
              </div>

              {/* Category */}
              <div className="bg-white rounded-2xl p-3 shadow-sm border border-brand-primary/5">
                <h4 className="text-[11px] font-black uppercase text-brand-primary/30 mb-2">Kategori</h4>
                <div className="relative mb-2">
                  <Search size={12} className="absolute start-2 top-1/2 -translate-y-1/2 text-brand-primary/20" />
                  <input type="text" placeholder="Kategori ara..." className="w-full ps-7 pe-2 py-1.5 bg-brand-secondary/30 rounded-lg text-[11px] outline-none border-0" />
                </div>
                <div className="space-y-0.5 max-h-40 overflow-y-auto">
                  <button onClick={() => setSelectedCategory('all')} className={cn('flex items-center justify-between w-full text-left px-2 py-1 rounded text-[11px]', selectedCategory === 'all' ? 'bg-accent/10 text-accent font-bold' : 'text-brand-primary/60 hover:bg-brand-secondary/50')}><span>Tüm Kategoriler</span><span className="text-[10px] opacity-40">{sellerProducts.length}</span></button>
                  {categories.map((catId) => {
                    const count = sellerProducts.filter((p: any) => p.categoryId === catId).length;
                    return (
                      <button key={catId} onClick={() => setSelectedCategory(catId)} className={cn('flex items-center justify-between w-full text-left px-2 py-1 rounded text-[11px]', selectedCategory === catId ? 'bg-accent/10 text-accent font-bold' : 'text-brand-primary/60 hover:bg-brand-secondary/50')}><span className="capitalize">{catId.replace(/-/g, ' ')}</span><span className="text-[10px] opacity-40">{count}</span></button>
                    );
                  })}
                </div>
              </div>

              {/* Brand */}
              <div className="bg-white rounded-2xl p-3 shadow-sm border border-brand-primary/5">
                <h4 className="text-[11px] font-black uppercase text-brand-primary/30 mb-2">Marka</h4>
                <div className="relative mb-2">
                  <Search size={12} className="absolute start-2 top-1/2 -translate-y-1/2 text-brand-primary/20" />
                  <input type="text" placeholder="Marka ara..." className="w-full ps-7 pe-2 py-1.5 bg-brand-secondary/30 rounded-lg text-[11px] outline-none border-0" />
                </div>
                <div className="space-y-0.5 max-h-32 overflow-y-auto">
                  {[...new Set(sellerProducts.map((p: any) => p.brand).filter(Boolean))].slice(0, 12).map((brand: any) => (
                    <button key={brand} onClick={() => setSearchQuery(brand)} className="flex items-center gap-2 w-full text-left px-2 py-1 rounded text-[11px] text-brand-primary/60 hover:bg-brand-secondary/50">
                      <span className="w-3 h-3 rounded border border-brand-primary/20 flex items-center justify-center text-[8px]">{searchQuery === brand ? '✓' : ''}</span><span className="capitalize">{brand}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="bg-white rounded-2xl p-3 shadow-sm border border-brand-primary/5">
                <h4 className="text-[11px] font-black uppercase text-brand-primary/30 mb-2">Fiyat Aralığı</h4>
                <div className="flex items-center gap-2">
                  <input type="number" placeholder="Min" className="w-full px-2 py-1.5 bg-brand-secondary/30 rounded-lg text-[11px] outline-none border-0" />
                  <span className="text-brand-primary/20 text-xs">-</span>
                  <input type="number" placeholder="Max" className="w-full px-2 py-1.5 bg-brand-secondary/30 rounded-lg text-[11px] outline-none border-0" />
                </div>
                <button className="w-full mt-2 py-1.5 bg-accent/10 text-accent rounded-lg text-[10px] font-bold hover:bg-accent/20 transition-all">Uygula</button>
              </div>

              {/* Color */}
              <div className="bg-white rounded-2xl p-3 shadow-sm border border-brand-primary/5">
                <h4 className="text-[11px] font-black uppercase text-brand-primary/30 mb-2">Renk</h4>
                <div className="flex flex-wrap gap-1.5">
                  {['#000000','#FFFFFF','#808080','#FF0000','#0000FF','#008000','#FFFF00','#FFA500','#800080','#FFC0CB','#8B4513','#00FFFF'].map((color) => (
                    <button key={color} className="w-6 h-6 rounded-full border-2 border-brand-primary/10 hover:border-accent hover:scale-110 transition-all" style={{ backgroundColor: color }} title={color} />
                  ))}
                </div>
              </div>

              {/* Rating */}
              <div className="bg-white rounded-2xl p-3 shadow-sm border border-brand-primary/5">
                <h4 className="text-[11px] font-black uppercase text-brand-primary/30 mb-2">Puanlama</h4>
                <div className="space-y-1">
                  {[4,3,2,1].map((r) => (
                    <button key={r} onClick={() => { setActiveTab('reviews'); setReviewFilter(r); }}
                      className={cn('flex items-center gap-2 w-full text-left px-2 py-1 rounded text-[11px] hover:bg-brand-secondary/50', reviewFilter === r ? 'bg-accent/5' : 'text-brand-primary/60')}>
                      <span className="text-yellow-400 text-xs">{'★'.repeat(r)}{'☆'.repeat(5-r)}</span><span className="opacity-50">ve üzeri</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Features */}
              <div className="bg-white rounded-2xl p-3 shadow-sm border border-brand-primary/5">
                <h4 className="text-[11px] font-black uppercase text-brand-primary/30 mb-2">Özellikler</h4>
                <div className="space-y-1">
                  {['Kargo Bedava','Hızlı Teslimat','İndirimli Ürünler','Kuponlu Ürünler','Yeni Ürünler','Son Şans'].map((item) => (
                    <label key={item} className="flex items-center gap-2 px-2 py-1 rounded text-[11px] text-brand-primary/60 hover:bg-brand-secondary/50 cursor-pointer">
                      <span className="w-3 h-3 rounded border border-brand-primary/20 flex items-center justify-center text-[8px]"></span>{item}
                    </label>
                  ))}
                </div>
              </div>
            </aside>
          )}'''

content = content[:start_idx] + new_sidebar + content[end_idx:]
with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Sidebar replaced!')
