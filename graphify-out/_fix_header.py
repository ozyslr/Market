path = r"O:\AI\E-tic 2026\src\pages\SellerStore.tsx"
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace banner header (smaller), remove store URL section, remove store management,
# add store info bar below banner

old_header = '''    <div className="min-h-screen bg-brand-secondary/30 pb-20">
      {/* Hero Banner */}
      <div className="relative h-96 w-full overflow-hidden">
        <img
          src={seller.banner}
          alt={seller.name + ' banner'}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-secondary/80 to-transparent" />

        <div className="absolute bottom-12 start-0 end-0">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="w-32 h-32 bg-white rounded-[2.5rem] shadow-2xl p-6 ring-8 ring-white/10 overflow-hidden">
                <img
                  src={seller.avatar}
                  alt={seller.name + ' logo'}
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-4xl md:text-5xl font-display font-black tracking-tighter text-brand-primary">
                    {seller.name}
                  </h1>
                  {seller.isVerified && <CheckCircle size={24} className="text-accent" />}
                </div>
                <div className="flex flex-wrap items-center gap-4 mt-3">
                  <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-brand-primary">
                    <MapPin size={14} className="text-accent" /> {seller.origin}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-brand-primary">
                    <Star size={14} className="text-yellow-400 fill-yellow-400" /> {seller.rating} (
                    {seller.reviewsCount} değerlendirme)
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-brand-primary">
                    <UserPlus size={14} className="text-accent" /> {seller.followers} Takipçi
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleFollow}
                disabled={followLoading}
                className="px-8 py-4 bg-brand-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-brand-primary/20 hover:bg-accent transition-all flex items-center gap-2 disabled:opacity-60"
              >
                {following ? 'Takibi Bırak' : 'Takip Et'}
              </button>
              {firebaseUser && user?.id !== sellerData.id && (
                <button
                  onClick={() => navigate(`/messages?sellerId=${sellerData.id}`)}
                  className="px-6 py-4 bg-white border-2 border-accent/20 text-accent hover:bg-accent hover:text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm transition-all flex items-center gap-2"
                >
                  <MessageSquare size={18} />
                  Mesaj Gönder
                </button>
              )}
              <button
                onClick={copyToClipboard}
                title="Mağaza bağlantısını kopyala"
                className="p-4 bg-white rounded-2xl border border-brand-primary/5 shadow-sm hover:scale-110 transition-transform"
              >
                {copied ? <Check size={18} className="text-green-500" /> : <Share2 size={18} />}
              </button>
            </div>
          </div>
        </div>
      </div>'''

new_header = '''    <div className="min-h-screen bg-brand-secondary/30 pb-20">
      {/* Hero Banner — compact */}
      <div className="relative h-48 md:h-56 w-full overflow-hidden">
        <img src={seller.banner} alt={seller.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-secondary/80 to-transparent" />
        <div className="absolute bottom-4 start-0 end-0">
          <div className="max-w-7xl mx-auto px-4 flex items-end justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-2xl shadow-lg p-3 ring-2 ring-white/20 overflow-hidden shrink-0">
                <img src={seller.avatar} alt={seller.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" loading="lazy" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg md:text-xl font-black text-white drop-shadow-md">{seller.name}</h1>
                  {seller.isVerified && <CheckCircle size={14} className="text-accent" />}
                </div>
                <div className="flex items-center gap-3 text-[11px] text-white/80 mt-0.5">
                  <span className="flex items-center gap-1"><Star size={11} className="text-yellow-400 fill-yellow-400" />{seller.rating} ({seller.reviewsCount})</span>
                  <span>{seller.followers} Takipçi</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleFollow} disabled={followLoading} className="px-4 py-2 bg-white text-brand-primary rounded-xl text-[11px] font-bold hover:bg-accent hover:text-white transition-all disabled:opacity-60">{following ? 'Takibi Bırak' : 'Takip Et'}</button>
              <button onClick={copyToClipboard} className="p-2 bg-white/20 backdrop-blur rounded-xl text-white hover:bg-white/30 transition-all" title="Paylaş">{copied ? <Check size={14} /> : <Share2 size={14} />}</button>
            </div>
          </div>
        </div>
      </div>

      {/* Store Info Bar */}
      <div className="bg-white border-b border-brand-primary/5">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center gap-4 md:gap-8 text-xs text-brand-primary/50">
          <span className="flex items-center gap-1.5"><History size={12} /> {seller.joinedDate} tarihinden beri</span>
          <span className="flex items-center gap-1.5"><MapPin size={12} /> {seller.origin}</span>
          <span className="flex items-center gap-1.5"><ShieldCheck size={12} /> Kurumsal Fatura</span>
          <span className="flex items-center gap-1.5"><Package size={12} /> Ortalama Kargo: 2-3 gün</span>
          <span className="flex items-center gap-1.5"><MessageSquare size={12} /> Soru Cevaplama: ~4 saat</span>
        </div>
      </div>'''

content = content.replace(old_header, new_header)

# Remove store URL section + store management section
# Find and remove from "Shareable store URL" to end of store management
old_url = '''      {/* Shareable store URL */}
      <div className="max-w-7xl mx-auto px-6 mt-6">
        <div className="bg-white rounded-2xl border border-brand-primary/5 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary/40">
            Mağaza Bağlantısı
          </span>
          <div className="flex-1 flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={storeUrl}
              className="flex-1 ps-3 pe-3 py-2 bg-brand-secondary/30 rounded-xl border border-brand-primary/5 text-sm font-medium text-brand-primary/70 outline-none text-start"
            />
            <button
              onClick={copyToClipboard}
              className="p-2 bg-accent/10 text-accent rounded-xl hover:bg-accent/20 transition-all"
              title="Kopyala"
            >
              {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
            </button>
          </div>
          {copied && (
            <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-lg">
              Store URL copied!
            </span>
          )}
        </div>
      </div>'''

content = content.replace(old_url, '')

# Remove store management section (owner only)
old_mgmt_start = '''      {/* Store management (owner only): logo / banner upload + about counter */}
      {isOwner && ('''
old_mgmt_end = '''      )}'''

idx_start = content.find(old_mgmt_start)
if idx_start >= 0:
    # Find matching closing brace
    depth = 0
    idx = idx_start + len(old_mgmt_start)
    while idx < len(content):
        if content[idx] == '{': depth += 1
        elif content[idx] == '}': depth -= 1
        if depth == 0 and content[idx] == '}':
            # Check if this is the closing )}
            if content[idx-1:idx+3] == '}  )}':
                idx = content.find('{/* Store management', idx_start-100)
                if idx < 0:
                    idx = content.rfind('{/* Store management', 0, idx_start)
                if idx >= 0:
                    # Find end
                    s = idx
                    d = 0
                    started = False
                    while s < len(content):
                        if content[s] == '{': d += 1; started = True
                        elif content[s] == '}': d -= 1
                        if started and d == 0:
                            content = content[:idx] + content[s+1:]
                            break
                        s += 1
                break
        idx += 1

# Also remove the sidebar badge card (Küresel Çok Merkezli) if still present
# Actually the sidebar was already replaced. Let's make sure.

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Header redesigned')
