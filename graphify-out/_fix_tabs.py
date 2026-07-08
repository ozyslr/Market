path = r"O:\AI\E-tic 2026\src\pages\SellerStore.tsx"
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Change main area grid to only have sidebar on non-products tabs
content = content.replace(
    '<main className="lg:col-span-9">',
    '<main className={cn("lg:col-span-9", activeTab === "products" ? "lg:col-span-12" : "")}>'
)

# Replace the AnimatePresence block to handle all/deals tabs
old_anim = '''            {activeTab === 'products' ? ('''
new_anim = '''            {activeTab === 'products' ? (
              /* ── ANA SAYFA ── */'''
content = content.replace(old_anim, new_anim)

# After the main block content, add the 'all' and 'deals' tab content
# Find the closing of the products block and add new tab content
old_closing = '''                </section>
              </motion.div>
            ) : activeTab === 'about' ? ('''
new_closing = '''                </section>
              </motion.div>
            ) : (activeTab === 'all' || activeTab === 'deals') ? (
              /* ── TÜM ÜRÜNLER / FIRSAT ÜRÜNLERİ ── */
              <motion.div key="listing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                {/* Search + Sort */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-brand-primary/20" />
                    <input type="text" placeholder="Mağazada ürün ara..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full ps-10 pe-4 py-3 bg-white rounded-xl border border-brand-primary/5 text-sm font-medium outline-none focus:ring-2 focus:ring-accent/20" />
                  </div>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="px-4 py-3 bg-white rounded-xl text-xs font-bold text-brand-primary/60 outline-none border-0 shrink-0">
                    <option value="default">Sıralama</option>
                    <option value="price_asc">Fiyat: Düşükten Yükseğe</option>
                    <option value="price_desc">Fiyat: Yüksekten Düşüğe</option>
                    <option value="rating">En Popüler</option>
                    <option value="newest">En Yeniler</option>
                  </select>
                </div>

                {/* Category chips */}
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setSelectedCategory('all')} className={cn('px-3 py-1.5 rounded-lg text-[10px] font-black uppercase', selectedCategory === 'all' ? 'bg-brand-primary text-white' : 'bg-white text-brand-primary/50')}>Tümü</button>
                  {categories.slice(0, 8).map((catId) => (
                    <button key={catId} onClick={() => setSelectedCategory(catId)} className={cn('px-3 py-1.5 rounded-lg text-[10px] font-black uppercase', selectedCategory === catId ? 'bg-brand-primary text-white' : 'bg-white text-brand-primary/50')}>{catId.replace(/-/g, ' ')}</button>
                  ))}
                </div>

                {/* Product count */}
                <p className="text-xs text-brand-primary/30">{displayProducts.length} ürün listeleniyor</p>

                {/* Product Grid */}
                <div className={cn('grid gap-4', viewMode === 'grid' ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-1')}>
                  {(activeTab === 'deals' ? displayProducts.filter((p: any) => p.isFlashDeal || p.oldPrice) : displayProducts).slice(0, 24).map((product: any) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {displayProducts.length > 24 && (
                  <div className="flex justify-center pt-4">
                    <button className="px-8 py-3 bg-white rounded-xl border-2 border-brand-primary/10 text-xs font-black uppercase text-brand-primary/60 hover:border-accent hover:text-accent transition-all">Daha Fazla Ürün Göster</button>
                  </div>
                )}
              </motion.div>
            ) : activeTab === 'about' ? ('''

content = content.replace(old_closing, new_closing)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Tabs updated')
