import React, { useState, useEffect, useMemo } from 'react';
import { DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, rectSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getCategories, createCategory, updateCategory, deleteCategory, seedDefaultCategories } from '@/services/productService';
import { uploadCategoryImage } from '@/services/storageService';
import { getHomepageSections, upsertHomepageSection } from '@/services/cmsService';
import { Category, HomepageSection, HeroSlide, FilterAttribute, FilterAttributeType } from '@/types';
import { Plus, Edit, Trash2, X, Loader2, ToggleLeft, ToggleRight, ChevronUp, ChevronDown, Save, RefreshCw, Upload, SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';
import { CATEGORIES as MOCK_CATEGORIES } from '@/mockData';

function normName(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9ğüşöçı]/g, '');
}

function getMockItems(parentId: string, subName: string) {
  const parent = MOCK_CATEGORIES.find(c => c.id === parentId);
  if (!parent?.subGroups) return [];
  const norm = normName(subName);
  const group = parent.subGroups.find(g => {
    const gn = normName(g.name);
    return gn === norm || gn.startsWith(norm) || norm.startsWith(gn);
  });
  return group?.items ?? [];
}

const SECTION_LABELS: Record<string, string> = {
  hero: 'Hero Banner',
  flash_deals: 'Flash Deals',
  product_row: 'Ürün Satırı',
  banner_grid: 'Banner Grid',
  promo_cards: 'Promo Kartlar',
  brand_strip: 'Marka Şeridi',
};

function HomepageSectionsEditor() {
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    getHomepageSections().then(data => { setSections(data); setLoading(false); });
  }, []);

  const updateSection = (id: string, updates: Partial<HomepageSection>) =>
    setSections(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));

  const updateConfig = (id: string, patch: Partial<HomepageSection['config']>) =>
    setSections(prev => prev.map(s => s.id === id ? { ...s, config: { ...s.config, ...patch } } : s));

  const saveSection = async (section: HomepageSection) => {
    setSaving(section.id);
    try { await upsertHomepageSection(section); } finally { setSaving(null); }
  };

  const moveSection = (id: string, dir: 'up' | 'down') => {
    setSections(prev => {
      const idx = prev.findIndex(s => s.id === id);
      if (dir === 'up' && idx === 0) return prev;
      if (dir === 'down' && idx === prev.length - 1) return prev;
      const next = [...prev];
      const swap = dir === 'up' ? idx - 1 : idx + 1;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next.map((s, i) => ({ ...s, order: i }));
    });
  };

  const addSlide = (sectionId: string) => {
    const slide: HeroSlide = { id: crypto.randomUUID(), title: '', subtitle: '', desc: '', image: '', category: '', color: 'accent', enabled: true };
    setSections(prev => prev.map(s => s.id === sectionId
      ? { ...s, config: { ...s.config, slides: [...(s.config.slides || []), slide] } } : s));
  };

  const updateSlide = (sectionId: string, slideId: string, patch: Partial<HeroSlide>) =>
    setSections(prev => prev.map(s => s.id === sectionId
      ? { ...s, config: { ...s.config, slides: (s.config.slides || []).map(sl => sl.id === slideId ? { ...sl, ...patch } : sl) } } : s));

  const deleteSlide = (sectionId: string, slideId: string) =>
    setSections(prev => prev.map(s => s.id === sectionId
      ? { ...s, config: { ...s.config, slides: (s.config.slides || []).filter(sl => sl.id !== slideId) } } : s));

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;

  return (
    <div className="space-y-4">
      {sections.map((section, idx) => (
        <div key={section.id} className={cn('bg-[#F8F8FA] rounded-3xl p-6 border-2 transition-all', section.enabled ? 'border-accent/10' : 'border-transparent opacity-60')}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <button onClick={() => moveSection(section.id, 'up')} disabled={idx === 0} className="p-0.5 text-[#1A1033]/30 hover:text-accent disabled:opacity-20"><ChevronUp size={14} /></button>
                <button onClick={() => moveSection(section.id, 'down')} disabled={idx === sections.length - 1} className="p-0.5 text-[#1A1033]/30 hover:text-accent disabled:opacity-20"><ChevronDown size={14} /></button>
              </div>
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-[#1A1033]/30">{SECTION_LABELS[section.type] || section.type}</span>
                <h4 className="text-sm font-black text-[#1A1033]">{section.title || section.id}</h4>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => updateSection(section.id, { enabled: !section.enabled })} className="transition-colors">
                {section.enabled ? <ToggleRight size={26} className="text-accent" /> : <ToggleLeft size={26} className="text-[#1A1033]/30" />}
              </button>
              <button onClick={() => saveSection(section)} disabled={saving === section.id}
                className="px-4 py-2 bg-accent text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 disabled:opacity-50 hover:scale-105 transition-all">
                {saving === section.id ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Kaydet
              </button>
            </div>
          </div>

          {section.type === 'product_row' && (
            <div className="flex gap-4 flex-wrap">
              <div>
                <label className="text-[9px] font-bold uppercase text-[#1A1033]/40 mb-1 block">Filtre</label>
                <select value={section.config.filter || 'featured'}
                  onChange={e => updateConfig(section.id, { filter: e.target.value as HomepageSection['config']['filter'] })}
                  className="px-3 py-2 bg-white rounded-xl text-xs font-bold border border-transparent focus:border-accent/20 outline-none">
                  <option value="featured">Öne Çıkan</option>
                  <option value="bestSeller">En Çok Satan</option>
                  <option value="isFlashDeal">Flash Deal</option>
                  <option value="newArrival">Yeni Gelen</option>
                </select>
              </div>
              <div>
                <label className="text-[9px] font-bold uppercase text-[#1A1033]/40 mb-1 block">Limit</label>
                <input type="number" min={4} max={50} value={section.config.limit || 20}
                  onChange={e => updateConfig(section.id, { limit: parseInt(e.target.value) })}
                  className="w-20 px-3 py-2 bg-white rounded-xl text-xs font-bold border border-transparent focus:border-accent/20 outline-none" />
              </div>
              <div className="w-full">
                <label className="text-[9px] font-bold uppercase text-[#1A1033]/40 mb-1 block">
                  Sabitlenmiş Ürün ID'leri <span className="normal-case font-normal">(virgülle ayır — boşsa filtre kullanılır)</span>
                </label>
                <input
                  type="text"
                  placeholder="p1, p2, p3 ..."
                  value={(section.config.pinnedProductIds || []).join(', ')}
                  onChange={e => {
                    const ids = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                    updateConfig(section.id, { pinnedProductIds: ids.length ? ids : undefined });
                  }}
                  className="w-full px-3 py-2 bg-white rounded-xl text-xs font-bold border border-transparent focus:border-accent/20 outline-none font-mono"
                />
              </div>
            </div>
          )}

          {section.type === 'flash_deals' && (
            <div className="flex gap-4 flex-wrap">
              <div>
                <label className="text-[9px] font-bold uppercase text-[#1A1033]/40 mb-1 block">Bitiş Zamanı</label>
                <input type="datetime-local"
                  value={section.config.flashDealEndTime ? section.config.flashDealEndTime.slice(0, 16) : ''}
                  onChange={e => updateConfig(section.id, { flashDealEndTime: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                  className="px-3 py-2 bg-white rounded-xl text-xs font-bold border border-transparent focus:border-accent/20 outline-none" />
              </div>
              <div>
                <label className="text-[9px] font-bold uppercase text-[#1A1033]/40 mb-1 block">Limit</label>
                <input type="number" min={4} max={50} value={section.config.limit || 20}
                  onChange={e => updateConfig(section.id, { limit: parseInt(e.target.value) })}
                  className="w-20 px-3 py-2 bg-white rounded-xl text-xs font-bold border border-transparent focus:border-accent/20 outline-none" />
              </div>
            </div>
          )}

          {section.type === 'hero' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] text-[#1A1033]/40 font-bold">{(section.config.slides || []).length} slayt</span>
                <button onClick={() => addSlide(section.id)}
                  className="px-3 py-1.5 bg-white border border-accent/20 rounded-xl text-[10px] font-black uppercase text-accent flex items-center gap-1 hover:bg-accent hover:text-white transition-all">
                  <Plus size={12} /> Slayt Ekle
                </button>
              </div>
              <div className="space-y-3">
                {(section.config.slides || []).map((slide) => (
                  <div key={slide.id} className="bg-white rounded-2xl p-4 border border-brand-primary/5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      {[
                        { label: 'Başlık (TR)', key: 'title', val: slide.title },
                        { label: 'Title (EN)', key: 'titleEn', val: slide.titleEn || '' },
                        { label: 'Alt Başlık (TR)', key: 'subtitle', val: slide.subtitle },
                        { label: 'Subtitle (EN)', key: 'subtitleEn', val: slide.subtitleEn || '' },
                        { label: 'Açıklama (TR)', key: 'desc', val: slide.desc },
                        { label: 'Description (EN)', key: 'descEn', val: slide.descEn || '' },
                      ].map(({ label, key, val }) => (
                        <div key={key}>
                          <label className="text-[9px] font-bold uppercase text-[#1A1033]/30 mb-1 block">{label}</label>
                          <input value={val} onChange={e => updateSlide(section.id, slide.id, { [key]: e.target.value })}
                            className="w-full px-3 py-2 bg-[#F8F8FA] rounded-lg text-xs font-bold outline-none" />
                        </div>
                      ))}
                      <div className="md:col-span-2">
                        <label className="text-[9px] font-bold uppercase text-[#1A1033]/30 mb-1 block">Görsel URL</label>
                        <input value={slide.image} onChange={e => updateSlide(section.id, slide.id, { image: e.target.value })}
                          className="w-full px-3 py-2 bg-[#F8F8FA] rounded-lg text-xs font-bold outline-none" placeholder="https://..." />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold uppercase text-[#1A1033]/30 mb-1 block">Kategori Slug</label>
                        <input value={slide.category} onChange={e => updateSlide(section.id, slide.id, { category: e.target.value })}
                          className="w-full px-3 py-2 bg-[#F8F8FA] rounded-lg text-xs font-bold outline-none" placeholder="electronics" />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold uppercase text-[#1A1033]/30 mb-1 block">Renk (Tailwind)</label>
                        <input value={slide.color} onChange={e => updateSlide(section.id, slide.id, { color: e.target.value })}
                          className="w-full px-3 py-2 bg-[#F8F8FA] rounded-lg text-xs font-bold outline-none" placeholder="accent" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <button onClick={() => updateSlide(section.id, slide.id, { enabled: !slide.enabled })} className="flex items-center gap-1 text-[10px] font-bold text-[#1A1033]/40 hover:text-accent">
                        {slide.enabled ? <ToggleRight size={18} className="text-accent" /> : <ToggleLeft size={18} />}
                        {slide.enabled ? 'Aktif' : 'Pasif'}
                      </button>
                      {slide.image && <img src={slide.image} className="h-8 w-14 object-cover rounded-lg" referrerPolicy="no-referrer" alt={slide.title || 'Slide'} loading="lazy" />}
                      <button onClick={() => deleteSlide(section.id, slide.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function SortableCategoryCard({ id, children }: { id: string; children: React.ReactNode; key?: React.Key }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      {...attributes}
    >
      <div className="relative">
        <div
          {...listeners}
          className="absolute top-2 left-2 z-10 cursor-grab active:cursor-grabbing p-1.5 rounded-md bg-white/80 text-[#1A1033]/40 hover:text-accent shadow-sm"
          title="Sıralamak için sürükle"
        >
          ⠿
        </div>
        {children}
      </div>
    </div>
  );
}

export function AdminCMS() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'categories' | 'homepage'>('categories');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [parentPreset, setParentPreset] = useState<string>('');
  const [seeding, setSeeding] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [filterAttributes, setFilterAttributes] = useState<FilterAttribute[]>([]);
  const [newFilterAttr, setNewFilterAttr] = useState<Partial<FilterAttribute>>({ key: '', label: '', type: 'checkbox', options: [], productField: 'attributes' });
  const [editingL3, setEditingL3] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuery, setNewItemQuery] = useState('');

  useEffect(() => { if (activeTab === 'categories') fetchCategories(); }, [activeTab]);

  const fetchCategories = async () => {
    setIsLoading(true);
    const data = await getCategories();
    setCategories(data);
    setIsLoading(false);
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const parentId = formData.get('parentId') as string;
    let finalImageUrl = imageUrl;
    if (imageFile) {
      const tempId = editingCategory?.id ?? `cat_${Date.now()}`;
      finalImageUrl = await uploadCategoryImage(tempId, imageFile);
    }
    const catData: Partial<Category> = {
      name,
      description,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      image: finalImageUrl || '',
      ...(parentId ? { parentId } : {}),
      ...(bannerUrl ? { bannerUrl } : {}),
      ...(filterAttributes.length > 0 ? { filterAttributes } : {}),
    };
    try {
      if (editingCategory) { await updateCategory(editingCategory.id, catData); }
      else { await createCategory(catData); }
      await fetchCategories();
      closeForm();
    } catch (err) {
      console.error(err);
      alert(t('admin.cms.saveFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const closeForm = () => {
    setIsFormOpen(false); setEditingCategory(null); setParentPreset('');
    setImageFile(null); setImagePreview(''); setImageUrl(''); setBannerUrl('');
    setFilterAttributes([]); setNewFilterAttr({ key: '', label: '', type: 'checkbox', options: [], productField: 'attributes' });
  };

  const handleSeed = async () => {
    setSeeding(true);
    await seedDefaultCategories();
    await fetchCategories();
    setSeeding(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCategory(id);
      await fetchCategories();
    } catch (err) {
      console.error(err);
      alert('Silme başarısız. Firebase izinlerini veya bağlantını kontrol et.');
    } finally {
      setDeletingId(null);
    }
  };

  const removeL3Item = async (subId: string, query: string, currentItems: { name: string; query: string }[]) => {
    const newItems = currentItems.filter(i => i.query !== query);
    await updateCategory(subId, { items: newItems });
    await fetchCategories();
  };

  const confirmAddL3Item = async (subId: string, currentItems: { name: string; query: string }[]) => {
    if (!newItemName.trim() || !newItemQuery.trim()) return;
    const newItems = [...currentItems, { name: newItemName.trim(), query: newItemQuery.trim() }];
    await updateCategory(subId, { items: newItems });
    setNewItemName(''); setNewItemQuery(''); setEditingL3(null);
    await fetchCategories();
  };

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const topLevel = useMemo(
    () => categories.filter(c => !c.parentId).sort((a, b) => (a.menuOrder ?? 999) - (b.menuOrder ?? 999)),
    [categories]
  );

  async function handleCategoryDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = topLevel.findIndex(c => c.id === active.id);
    const newIndex = topLevel.findIndex(c => c.id === over.id);
    const reordered = arrayMove(topLevel, oldIndex, newIndex) as Category[];
    setCategories(prev => [
      ...prev.filter(c => c.parentId),
      ...reordered.map((c, i) => ({ ...c, menuOrder: i })),
    ]);
    await Promise.all(reordered.map((c, i) => updateCategory(c.id, { menuOrder: i })));
  }

  const childrenOf = (id: string) => categories.filter(c => c.parentId === id);
  const parentName = (parentId: string) => categories.find(c => c.id === parentId)?.name ?? parentId;

  return (
    <div className="bg-white rounded-[3.5rem] p-12 border border-[#F8F8FA] shadow-sm flex flex-col min-h-[500px]">
      {/* Tab Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex gap-2">
          {(['categories', 'homepage'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={cn('px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all',
                activeTab === tab ? 'bg-[#1A1033] text-white' : 'bg-[#F8F8FA] text-[#1A1033]/40 hover:text-[#1A1033]')}>
              {tab === 'categories' ? 'Kategori Menü' : 'Anasayfa Bölümleri'}
            </button>
          ))}
        </div>
        {activeTab === 'categories' && (
          <div className="flex items-center gap-2">
            <button onClick={handleSeed} disabled={seeding}
              className="px-4 py-3 bg-brand-primary/10 text-brand-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-primary/20 transition-all flex items-center gap-2 disabled:opacity-50">
              <RefreshCw size={14} className={seeding ? 'animate-spin' : ''} />
              {seeding ? 'Senkronize...' : 'Varsayılanları Senkronize Et'}
            </button>
            <button onClick={() => { setEditingCategory(null); setImageUrl(''); setIsFormOpen(true); }}
              className="px-6 py-3 bg-accent text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:scale-105 transition-all flex items-center gap-2">
              <Plus size={16} /> Yeni Menü
            </button>
          </div>
        )}
      </div>

      {/* Category Tab */}
      {activeTab === 'categories' && (
        isLoading ? (
          <div className="flex-1 flex justify-center items-center"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCategoryDragEnd}>
          <SortableContext items={topLevel.map(c => c.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topLevel.map((cat) => {
              const subs = childrenOf(cat.id);
              const isOpen = expandedId === cat.id;
              return (
                <SortableCategoryCard key={cat.id} id={cat.id}>
                <div className="bg-[#F8F8FA] rounded-3xl overflow-hidden border border-transparent hover:border-accent/10 transition-colors">
                  {/* Ana kategori kartı */}
                  <div className="p-6 relative group">
                    <div className="h-32 rounded-2xl overflow-hidden mb-4 relative">
                      <img src={cat.image} className="w-full h-full object-cover" alt={cat.name} referrerPolicy="no-referrer" loading="lazy" />
                      <div className="absolute inset-0 bg-black/20" />
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-black text-[#1A1033] uppercase">{cat.name}</h4>
                        <p className="text-[10px] text-[#1A1033]/40 uppercase tracking-wide mt-1">
                          Ana Menü {subs.length > 0 && <span className="ml-1 px-1.5 py-0.5 bg-accent/10 text-accent rounded-md">{subs.length} alt</span>}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditingCategory(cat); setParentPreset(''); setImageUrl(cat.image ?? ''); setBannerUrl(cat.bannerUrl ?? ''); setFilterAttributes(cat.filterAttributes ?? []); setIsFormOpen(true); }} className="p-2 bg-white rounded-lg shadow-md text-[#1A1033]/40 hover:text-accent transition-colors"><Edit size={14} /></button>
                        {deletingId === cat.id ? (
                          <div className="flex items-center gap-1 bg-white rounded-lg shadow-md px-2 py-1">
                            <span className="text-[9px] text-red-500 font-black">Sil?</span>
                            <button onClick={() => handleDelete(cat.id)} className="px-1.5 py-0.5 bg-red-500 text-white rounded text-[9px] font-black">Evet</button>
                            <button onClick={() => setDeletingId(null)} className="px-1.5 py-0.5 bg-[#F8F8FA] rounded text-[9px] font-black">Hayır</button>
                          </div>
                        ) : (
                          <button onClick={() => setDeletingId(cat.id)} className="p-2 bg-white rounded-lg shadow-md text-[#1A1033]/40 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Alt kategoriler bölümü */}
                  <div className="border-t border-[#1A1033]/5">
                    <button
                      onClick={() => setExpandedId(isOpen ? null : cat.id)}
                      className="w-full flex items-center justify-between px-6 py-3 text-[10px] font-black uppercase tracking-widest text-[#1A1033]/40 hover:text-[#1A1033] hover:bg-white/60 transition-colors"
                    >
                      <span>Alt Kategoriler</span>
                      <ChevronDown size={14} className={cn('transition-transform', isOpen && 'rotate-180')} />
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 space-y-2">
                            {subs.length === 0 && (
                              <p className="text-[10px] text-[#1A1033]/30 font-bold text-center py-2">Henüz alt kategori yok</p>
                            )}
                            {subs.map(sub => {
                              const l3Items: { name: string; query: string }[] = sub.items ?? getMockItems(cat.id, sub.name);
                              return (
                                <div key={sub.id} className="bg-white rounded-xl overflow-hidden">
                                  <div className="flex items-center justify-between px-4 py-2.5">
                                    <span className="text-xs font-bold text-[#1A1033]">{sub.name}</span>
                                    <div className="flex gap-1 shrink-0 items-center">
                                      <button onClick={() => { setEditingCategory(sub); setParentPreset(sub.parentId ?? ''); setImageUrl(sub.image ?? ''); setBannerUrl(sub.bannerUrl ?? ''); setFilterAttributes(sub.filterAttributes ?? []); setIsFormOpen(true); }} className="p-1.5 text-[#1A1033]/30 hover:text-accent rounded-lg hover:bg-accent/5 transition-colors"><Edit size={12} /></button>
                                      {deletingId === sub.id ? (
                                        <div className="flex items-center gap-1">
                                          <span className="text-[9px] text-red-500 font-black">Sil?</span>
                                          <button onClick={() => handleDelete(sub.id)} className="px-1.5 py-0.5 bg-red-500 text-white rounded text-[9px] font-black">Evet</button>
                                          <button onClick={() => setDeletingId(null)} className="px-1.5 py-0.5 bg-[#F8F8FA] rounded text-[9px] font-black">Hayır</button>
                                        </div>
                                      ) : (
                                        <button onClick={() => setDeletingId(sub.id)} className="p-1.5 text-[#1A1033]/30 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"><Trash2 size={12} /></button>
                                      )}
                                    </div>
                                  </div>
                                  <div className="px-4 pb-3 border-t border-[#F8F8FA]">
                                    <div className="flex flex-wrap gap-1 pt-2 mb-1">
                                      {l3Items.map(item => (
                                        <span key={item.query} className="group/tag flex items-center gap-0.5 text-[9px] px-2 py-0.5 bg-[#F8F8FA] rounded-md text-[#1A1033]/50 font-semibold">
                                          {item.name}
                                          <button
                                            onClick={() => removeL3Item(sub.id, item.query, l3Items)}
                                            className="opacity-0 group-hover/tag:opacity-100 hover:text-red-500 transition-opacity leading-none"
                                          ><X size={7} /></button>
                                        </span>
                                      ))}
                                    </div>
                                    {editingL3 === sub.id ? (
                                      <div className="flex gap-1 mt-1">
                                        <input
                                          value={newItemName}
                                          onChange={e => setNewItemName(e.target.value)}
                                          placeholder="Ad (ör: Bebek Arabası)"
                                          className="flex-1 min-w-0 px-2 py-1 text-[9px] bg-[#F8F8FA] rounded-lg outline-none font-bold"
                                        />
                                        <input
                                          value={newItemQuery}
                                          onChange={e => setNewItemQuery(e.target.value)}
                                          placeholder="query"
                                          className="w-20 px-2 py-1 text-[9px] bg-[#F8F8FA] rounded-lg outline-none font-bold"
                                          onKeyDown={e => e.key === 'Enter' && confirmAddL3Item(sub.id, l3Items)}
                                        />
                                        <button onClick={() => confirmAddL3Item(sub.id, l3Items)} className="px-2 py-1 bg-accent text-white rounded-lg text-[9px] font-black">+</button>
                                        <button onClick={() => setEditingL3(null)} className="px-2 py-1 bg-[#F8F8FA] rounded-lg text-[9px] font-black text-[#1A1033]/40"><X size={8} /></button>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => { setEditingL3(sub.id); setNewItemName(''); setNewItemQuery(''); }}
                                        className="flex items-center gap-0.5 text-[9px] font-black text-accent/50 hover:text-accent transition-colors mt-1"
                                      ><Plus size={9} /> Alt Bağlantı Ekle</button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                            <button
                              onClick={() => { setEditingCategory(null); setParentPreset(cat.id); setImageUrl(''); setIsFormOpen(true); }}
                              className="w-full flex items-center justify-center gap-1.5 py-2 border-2 border-dashed border-accent/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-accent/60 hover:text-accent hover:border-accent/40 transition-colors"
                            >
                              <Plus size={12} /> Alt Kategori Ekle
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                </SortableCategoryCard>
              );
            })}
          </div>
          </SortableContext>
          </DndContext>
        )
      )}

      {/* Homepage Sections Tab */}
      {activeTab === 'homepage' && <HomepageSectionsEditor />}

      {/* Category Form Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeForm} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-lg bg-white rounded-[2.5rem] overflow-hidden shadow-2xl p-8 z-10">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-display font-black uppercase italic tracking-tight">
                    {editingCategory ? 'Kategoriyi Düzenle' : (parentPreset ? 'Alt Kategori Ekle' : 'Ana Kategori Ekle')}
                  </h3>
                  {parentPreset && (
                    <p className="text-[10px] text-accent font-bold mt-1">
                      Üst: {parentName(parentPreset)}
                    </p>
                  )}
                </div>
                <button onClick={closeForm} className="text-[#1A1033]/30 hover:text-[#1A1033]"><X size={20} /></button>
              </div>
              <form onSubmit={handleFormSubmit} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-[#1A1033] uppercase mb-2">Ad</label>
                  <input type="text" name="name" required defaultValue={editingCategory?.name} className="w-full px-4 py-3 bg-[#F8F8FA] rounded-xl text-sm font-bold border border-transparent focus:border-accent/20 outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#1A1033] uppercase mb-2">Görsel</label>
                  <div className="flex gap-3 items-start">
                    {(imagePreview || imageUrl) && (
                      <img src={imagePreview || imageUrl} alt="Önizleme" className="w-16 h-16 object-cover rounded-xl border border-[#1A1033]/10 shrink-0" referrerPolicy="no-referrer" loading="lazy" />
                    )}
                    <div className="flex-1 space-y-2">
                      <input
                        type="url"
                        value={imageUrl}
                        onChange={e => { setImageUrl(e.target.value); setImagePreview(''); }}
                        placeholder="https://... görsel URL"
                        className="w-full px-3 py-2 bg-[#F8F8FA] rounded-xl text-sm border-0 outline-none"
                      />
                      <label className="flex items-center gap-2 cursor-pointer px-3 py-2 bg-[#1A1033]/10 rounded-xl text-[10px] font-black text-[#1A1033] hover:bg-[#1A1033]/20 transition-all w-fit">
                        <Upload size={12} />
                        Dosyadan Yükle
                        <input type="file" accept="image/*" className="hidden" onChange={e => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          setImageFile(f);
                          setImagePreview(URL.createObjectURL(f));
                        }} />
                      </label>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#1A1033] uppercase mb-2">Banner Görseli (Sayfa Üst Bandı)</label>
                  <div className="flex gap-3 items-center">
                    {bannerUrl && (
                      <img src={bannerUrl} alt="Banner Önizleme" className="w-20 h-10 object-cover rounded-lg border border-[#1A1033]/10 shrink-0" referrerPolicy="no-referrer" loading="lazy" />
                    )}
                    <input
                      type="url"
                      value={bannerUrl}
                      onChange={e => setBannerUrl(e.target.value)}
                      placeholder="https://... banner URL (opsiyonel)"
                      className="flex-1 px-3 py-2 bg-[#F8F8FA] rounded-xl text-sm border-0 outline-none"
                    />
                  </div>
                  <p className="text-[9px] text-[#1A1033]/30 mt-1 font-bold">Boş bırakılırsa kategori görseli kullanılır.</p>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#1A1033] uppercase mb-2">Açıklama</label>
                  <textarea name="description" rows={3} defaultValue={editingCategory?.description} className="w-full px-4 py-3 bg-[#F8F8FA] rounded-xl text-sm font-bold border border-transparent focus:border-accent/20 outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#1A1033] uppercase mb-2">Üst Kategori (İsteğe Bağlı)</label>
                  <select name="parentId" defaultValue={editingCategory?.parentId || parentPreset} className="w-full px-4 py-3 bg-[#F8F8FA] rounded-xl text-sm font-bold border border-transparent focus:border-accent/20 outline-none">
                    <option value="">Yok (Ana Kategori)</option>
                    {topLevel.filter(c => c.id !== editingCategory?.id).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                {/* Filtre Özellikleri */}
                <div className="border-t border-[#1A1033]/5 pt-6 space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-[#1A1033]/60 flex items-center gap-2">
                    <SlidersHorizontal size={14} /> Filtre Özellikleri
                  </h4>
                  <div className="space-y-2">
                    {filterAttributes.map((attr, idx) => (
                      <div key={idx} className="flex items-start justify-between p-3 bg-[#F8F8FA] rounded-xl gap-2">
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-black text-[#1A1033]">{attr.label}</span>
                          <span className="text-[10px] text-[#1A1033]/40 ml-2">({attr.key} · {attr.type})</span>
                          {attr.options && attr.options.length > 0 && (
                            <p className="text-[10px] text-[#1A1033]/40 mt-0.5 truncate">{attr.options.map(o => o.value).join(', ')}</p>
                          )}
                        </div>
                        <button type="button" onClick={() => setFilterAttributes(prev => prev.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600 transition-colors p-1 flex-shrink-0"><X size={14} /></button>
                      </div>
                    ))}
                  </div>
                  <div className="bg-[#F8F8FA] rounded-xl p-4 space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1033]/40">Yeni Filtre</p>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" placeholder="Alan (key): brand" value={newFilterAttr.key ?? ''} onChange={e => setNewFilterAttr(p => ({ ...p, key: e.target.value }))} className="px-3 py-2 bg-white rounded-lg text-xs font-bold outline-none" />
                      <input type="text" placeholder="Başlık: Marka" value={newFilterAttr.label ?? ''} onChange={e => setNewFilterAttr(p => ({ ...p, label: e.target.value }))} className="px-3 py-2 bg-white rounded-lg text-xs font-bold outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <select value={newFilterAttr.type ?? 'checkbox'} onChange={e => setNewFilterAttr(p => ({ ...p, type: e.target.value as FilterAttributeType }))} className="px-3 py-2 bg-white rounded-lg text-xs font-bold outline-none">
                        <option value="checkbox">Checkbox (Çoklu)</option>
                        <option value="range">Aralık (Min/Max)</option>
                        <option value="select">Seçim (Tekli)</option>
                        <option value="rating">Yıldız</option>
                      </select>
                      <select value={newFilterAttr.productField ?? 'attributes'} onChange={e => setNewFilterAttr(p => ({ ...p, productField: e.target.value as 'top-level' | 'attributes' }))} className="px-3 py-2 bg-white rounded-lg text-xs font-bold outline-none">
                        <option value="attributes">attributes[key]</option>
                        <option value="top-level">Üst alan (brand...)</option>
                      </select>
                    </div>
                    {(newFilterAttr.type === 'checkbox' || newFilterAttr.type === 'select') && (
                      <input type="text" placeholder="Seçenekler: Samsung, Apple, Xiaomi" value={(newFilterAttr.options ?? []).map(o => o.value).join(', ')} onChange={e => setNewFilterAttr(p => ({ ...p, options: e.target.value.split(',').map(v => ({ value: v.trim(), label: v.trim() })).filter(o => o.value) }))} className="w-full px-3 py-2 bg-white rounded-lg text-xs font-bold outline-none" />
                    )}
                    <button type="button" onClick={() => { if (!newFilterAttr.key || !newFilterAttr.label) return; setFilterAttributes(prev => [...prev, newFilterAttr as FilterAttribute]); setNewFilterAttr({ key: '', label: '', type: 'checkbox', options: [], productField: 'attributes' }); }} className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-xl text-xs font-black hover:bg-accent/90 transition-all">
                      <Plus size={12} /> Filtre Ekle
                    </button>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end">
                  <button type="submit" disabled={isLoading} className="px-8 py-4 bg-[#1A1033] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:shadow-xl transition-all disabled:opacity-50">
                    {isLoading ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
