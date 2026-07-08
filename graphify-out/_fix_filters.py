path = r"O:\AI\E-tic 2026\src\pages\SellerStore.tsx"
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old_filters = '''\t\t\t\t<div className="bg-white rounded-2xl p-3 shadow-sm border border-brand-primary/5 space-y-3">
\t\t\t\t\t<h3 className="text-[10px] font-black uppercase text-brand-primary/30">Filtrele</h3>
\t\t\t\t\t<div>
\t\t\t\t\t\t<h4 className="text-[10px] font-bold text-brand-primary/50 mb-1">Kategori</h4>
\t\t\t\t\t\t<div className="space-y-0.5 max-h-32 overflow-y-auto">
\t\t\t\t\t\t\t<button
\t\t\t\t\t\t\t\tonClick={() => setSelectedCategory('all')}
\t\t\t\t\t\t\t\tclassName={cn(
\t\t\t\t\t\t\t\t\t'block w-full text-left px-2 py-0.5 rounded text-[11px]',
\t\t\t\t\t\t\t\t\tselectedCategory === 'all'
\t\t\t\t\t\t\t\t\t\t? 'bg-accent/10 text-accent font-bold'
\t\t\t\t\t\t\t\t\t\t: 'text-brand-primary/50 hover:bg-brand-secondary/50',
\t\t\t\t\t\t\t\t)}
\t\t\t\t\t\t\t>
\t\t\t\t\t\t\t\tTümü
\t\t\t\t\t\t\t</button>
\t\t\t\t\t\t\t{categories.slice(0, 8).map((catId) => (
\t\t\t\t\t\t\t\t<button
\t\t\t\t\t\t\t\t\tkey={catId}
\t\t\t\t\t\t\t\t\tonClick={() => setSelectedCategory(catId)}
\t\t\t\t\t\t\t\t\tclassName={cn(
\t\t\t\t\t\t\t\t\t\t'block w-full text-left px-2 py-0.5 rounded text-[11px]',
\t\t\t\t\t\t\t\t\t\tselectedCategory === catId
\t\t\t\t\t\t\t\t\t\t\t? 'bg-accent/10 text-accent font-bold'
\t\t\t\t\t\t\t\t\t\t\t: 'text-brand-primary/50 hover:bg-brand-secondary/50',
\t\t\t\t\t\t\t\t\t)}
\t\t\t\t\t\t\t\t>
\t\t\t\t\t\t\t\t\t{catId.replace(/-/g, ' ')}
\t\t\t\t\t\t\t\t</button>
\t\t\t\t\t\t\t))}
\t\t\t\t\t\t</div>
\t\t\t\t\t</div>
\t\t\t\t\t<div>
\t\t\t\t\t\t<h4 className="text-[10px] font-bold text-brand-primary/50 mb-1">Puan</h4>
\t\t\t\t\t\t{[4, 3, 2, 1].map((r) => (
\t\t\t\t\t\t\t<button
\t\t\t\t\t\t\t\tkey={r}
\t\t\t\t\t\t\t\tclassName="block w-full text-left px-2 py-0.5 rounded text-[11px] text-brand-primary/50 hover:bg-brand-secondary/50"
\t\t\t\t\t\t\t>
\t\t\t\t\t\t\t\t{'★'.repeat(r)}{'☆'.repeat(5 - r)} ve üzeri
\t\t\t\t\t\t\t</button>
\t\t\t\t\t\t))}
\t\t\t\t\t</div>
\t\t\t\t</div>'''

new_filters = '''\t\t\t\t<div className="bg-white rounded-2xl p-3 shadow-sm border border-brand-primary/5 space-y-4">
\t\t\t\t\t<div>
\t\t\t\t\t\t<h4 className="text-[11px] font-black uppercase text-brand-primary/30 mb-2">Kategoriler</h4>
\t\t\t\t\t\t<div className="space-y-0.5">
\t\t\t\t\t\t\t<button onClick={() => setSelectedCategory('all')}
\t\t\t\t\t\t\t\tclassName={cn('flex items-center justify-between w-full text-left px-2 py-1.5 rounded-lg text-xs transition-all',
\t\t\t\t\t\t\t\t\tselectedCategory === 'all' ? 'bg-accent/10 text-accent font-bold' : 'text-brand-primary/60 hover:bg-brand-secondary/50')}>
\t\t\t\t\t\t\t\t<span>Tüm Ürünler</span>
\t\t\t\t\t\t\t\t<span className="text-[10px] opacity-50">{sellerProducts.length}</span>
\t\t\t\t\t\t\t</button>
\t\t\t\t\t\t\t{categories.map((catId) => {
\t\t\t\t\t\t\t\tconst count = sellerProducts.filter((p: any) => p.categoryId === catId).length;
\t\t\t\t\t\t\t\treturn (
\t\t\t\t\t\t\t\t\t<button key={catId} onClick={() => setSelectedCategory(catId)}
\t\t\t\t\t\t\t\t\t\tclassName={cn('flex items-center justify-between w-full text-left px-2 py-1.5 rounded-lg text-xs transition-all',
\t\t\t\t\t\t\t\t\t\t\tselectedCategory === catId ? 'bg-accent/10 text-accent font-bold' : 'text-brand-primary/60 hover:bg-brand-secondary/50')}>
\t\t\t\t\t\t\t\t\t\t<span className="capitalize">{catId.replace(/-/g, ' ')}</span>
\t\t\t\t\t\t\t\t\t\t<span className="text-[10px] opacity-50">{count}</span>
\t\t\t\t\t\t\t\t\t</button>
\t\t\t\t\t\t\t\t);
\t\t\t\t\t\t\t})}
\t\t\t\t\t\t</div>
\t\t\t\t\t</div>
\t\t\t\t\t<div>
\t\t\t\t\t\t<h4 className="text-[11px] font-black uppercase text-brand-primary/30 mb-2">Marka</h4>
\t\t\t\t\t\t<div className="space-y-0.5 max-h-28 overflow-y-auto">
\t\t\t\t\t\t\t{[...new Set(sellerProducts.map((p: any) => p.brand).filter(Boolean))].slice(0, 10).map((brand: any) => (
\t\t\t\t\t\t\t\t<button key={brand} onClick={() => setSearchQuery(brand)}
\t\t\t\t\t\t\t\t\tclassName="block w-full text-left px-2 py-1.5 rounded-lg text-xs text-brand-primary/60 hover:bg-brand-secondary/50 capitalize">{brand}</button>
\t\t\t\t\t\t\t))}
\t\t\t\t\t\t</div>
\t\t\t\t\t</div>
\t\t\t\t\t<div>
\t\t\t\t\t\t<h4 className="text-[11px] font-black uppercase text-brand-primary/30 mb-2">Puan</h4>
\t\t\t\t\t\t{[4,3,2,1].map((r) => (
\t\t\t\t\t\t\t<button key={r} className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-lg text-xs text-brand-primary/60 hover:bg-brand-secondary/50">
\t\t\t\t\t\t\t\t<span className="text-yellow-400">{'★'.repeat(r)}{'☆'.repeat(5-r)}</span><span className="opacity-50">ve üzeri</span>
\t\t\t\t\t\t\t</button>
\t\t\t\t\t\t))}
\t\t\t\t\t</div>
\t\t\t\t\t<div>
\t\t\t\t\t\t<h4 className="text-[11px] font-black uppercase text-brand-primary/30 mb-2">Avantajlı Ürünler</h4>
\t\t\t\t\t\t<div className="space-y-0.5">
\t\t\t\t\t\t\t{['Kargo Bedava','Hızlı Teslimat','İndirimli Ürünler','Kuponlu Ürünler'].map((item) => (
\t\t\t\t\t\t\t\t<button key={item} className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-lg text-xs text-brand-primary/60 hover:bg-brand-secondary/50">
\t\t\t\t\t\t\t\t\t<span>{item === 'Kargo Bedava' ? '📦' : item === 'Hızlı Teslimat' ? '⚡' : item === 'İndirimli Ürünler' ? '🏷️' : '🎫'}</span> {item}
\t\t\t\t\t\t\t\t</button>
\t\t\t\t\t\t\t))}
\t\t\t\t\t\t</div>
\t\t\t\t\t</div>
\t\t\t\t</div>'''

content = content.replace(old_filters, new_filters)
with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Filters replaced')
