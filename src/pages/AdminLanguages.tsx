import React, { useState } from 'react';
import { useLanguage, LanguagePack } from '@/context/LanguageContext';
import { Languages, Plus, Trash2, Save, X, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'motion/react';

export function AdminLanguages() {
  const { t, availableLanguages, setAvailableLanguages, translations, setTranslations } = useLanguage();
  const [editingLang, setEditingLang] = useState<string | null>(null);
  const [newLangConfig, setNewLangConfig] = useState<Partial<LanguagePack> | null>(null);

  const [localTranslations, setLocalTranslations] = useState<Record<string, Record<string, string>>>(translations);

  const handleSaveLang = () => {
     if (newLangConfig && newLangConfig.code && newLangConfig.name) {
       // Add new lang
       setAvailableLanguages([...availableLanguages, newLangConfig as LanguagePack]);
       
       // Initialize translations
       setTranslations({
         ...localTranslations,
         [newLangConfig.code]: localTranslations['en'] || {} 
       });
       setLocalTranslations(prev => ({
         ...prev,
         [newLangConfig.code!]: localTranslations['en'] || {} 
       }));
       setNewLangConfig(null);
     }
  };

  const handleRemoveLang = (code: string) => {
    if (code === 'en' || code === 'tr') return; // Cannot remove base languages
    setAvailableLanguages(availableLanguages.filter(l => l.code !== code));
    if (editingLang === code) setEditingLang(null);
  };

  const handleTranslationChange = (langCode: string, key: string, value: string) => {
     setLocalTranslations(prev => ({
        ...prev,
        [langCode]: {
           ...prev[langCode],
           [key]: value
        }
     }));
  };

  const saveTranslations = () => {
     setTranslations(localTranslations);
     alert(t('admin.languages.saved'));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between bg-white dark:bg-zinc-900 p-8 rounded-[3rem] shadow-sm border border-brand-primary/5 dark:border-white/5">
        <div>
           <div className="flex items-center gap-3 mb-2">
             <div className="w-10 h-10 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
               <Languages size={20} />
             </div>
             <h2 className="text-3xl font-display font-black uppercase italic tracking-tighter text-brand-primary dark:text-white">{t('admin.languages.title')}</h2>
           </div>
           <p className="text-xs font-bold text-brand-primary/40 dark:text-white/40 uppercase tracking-widest ps-13">{t('admin.languages.subtitle')}</p>
        </div>
        <button className="px-6 py-3 bg-accent text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform flex items-center gap-2" onClick={saveTranslations}>
           <Save size={16} /> Değişiklikleri Kaydet
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         {/* ACTIVE LANGUAGES */}
         <div className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-brand-primary/5 dark:border-white/5 shadow-sm">
               <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-black uppercase tracking-widest text-brand-primary dark:text-white">Aktif Diller</h3>
                  <button onClick={() => setNewLangConfig({})} className="w-8 h-8 rounded-full bg-brand-primary/5 dark:bg-white/5 flex items-center justify-center hover:bg-accent hover:text-white transition-colors">
                     <Plus size={16} />
                  </button>
               </div>

               {newLangConfig !== null && (
                 <div className="mb-6 p-4 rounded-2xl bg-brand-secondary/50 dark:bg-zinc-950 border border-brand-primary/10">
                    <div className="space-y-3">
                       <input type="text" placeholder="Dil Kodu (örn: fr)" className="w-full px-3 py-2 text-xs font-bold rounded-xl border dark:border-white/10 dark:bg-zinc-900 outline-none focus:border-accent" value={newLangConfig.code || ''} onChange={e => setNewLangConfig({ ...newLangConfig, code: e.target.value })} />
                       <input type="text" placeholder="Dil Adı (örn: Français)" className="w-full px-3 py-2 text-xs font-bold rounded-xl border dark:border-white/10 dark:bg-zinc-900 outline-none focus:border-accent" value={newLangConfig.name || ''} onChange={e => setNewLangConfig({ ...newLangConfig, name: e.target.value })} />
                       <input type="text" placeholder="Bayrak Emoji (örn: 🇫🇷)" className="w-full px-3 py-2 text-xs font-bold rounded-xl border dark:border-white/10 dark:bg-zinc-900 outline-none focus:border-accent" value={newLangConfig.flag || ''} onChange={e => setNewLangConfig({ ...newLangConfig, flag: e.target.value })} />
                       <div className="flex gap-2">
                          <button onClick={handleSaveLang} className="flex-1 py-2 bg-brand-primary text-white text-[10px] uppercase font-black tracking-widest rounded-xl">Ekle</button>
                          <button onClick={() => setNewLangConfig(null)} className="py-2 px-3 bg-brand-primary/10 text-brand-primary dark:text-white text-[10px] uppercase font-black tracking-widest rounded-xl"><X size={14} /></button>
                       </div>
                    </div>
                 </div>
               )}

               <div className="space-y-3">
                  {availableLanguages.map((lang) => (
                     <div key={lang.code} className={cn("flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer", editingLang === lang.code ? "bg-accent/5 border-accent text-accent" : "bg-white dark:bg-zinc-900 border-brand-primary/5 dark:border-white/5 hover:border-brand-primary/20")} onClick={() => setEditingLang(lang.code)}>
                        <div className="flex items-center gap-4">
                           <span className="text-2xl">{lang.flag}</span>
                           <div>
                              <p className="text-sm font-black tracking-tight">{lang.name}</p>
                              <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">{lang.code}</p>
                           </div>
                        </div>
                        {lang.code !== 'en' && lang.code !== 'tr' && (
                           <button onClick={(e) => { e.stopPropagation(); handleRemoveLang(lang.code); }} className="w-8 h-8 rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors">
                              <Trash2 size={14} />
                           </button>
                        )}
                     </div>
                  ))}
               </div>
            </div>
         </div>

         {/* TRANSLATION EDITOR */}
         <div className="lg:col-span-8">
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-brand-primary/5 dark:border-white/5 shadow-sm min-h-[500px]">
               {editingLang ? (
                  <>
                     <div className="flex items-center justify-between mb-8 pb-6 border-b border-brand-primary/5 dark:border-white/5">
                        <div className="flex items-center gap-3">
                           <Settings className="text-accent" />
                           <h3 className="text-xl font-display font-black uppercase tracking-tighter">[{editingLang}] Çeviri Stüdyosu</h3>
                        </div>
                     </div>
                     <div className="space-y-4 max-h-[600px] overflow-y-auto pe-4 custom-scrollbar-sidebar">
                        {Object.keys(localTranslations['en'] || {}).map((key) => (
                           <div key={key} className="flex flex-col gap-2 p-4 rounded-2xl bg-brand-secondary/30 dark:bg-zinc-950 border border-brand-primary/5">
                              <p className="text-[10px] font-black font-mono text-brand-primary/40 dark:text-white/40">{key}</p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest opacity-30 mb-1">English (Referans)</p>
                                    <div className="px-3 py-2 bg-brand-primary/5 dark:bg-white/5 rounded-xl text-xs font-bold opacity-60">
                                       {localTranslations['en'][key]}
                                    </div>
                                 </div>
                                 <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-accent mb-1">{availableLanguages.find(l=>l.code === editingLang)?.name} Çevirisi</p>
                                    <textarea 
                                       rows={2}
                                       className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border dark:border-white/10 rounded-xl text-xs font-bold outline-none focus:ring-2 ring-accent/20 transition-all resize-none"
                                       value={localTranslations[editingLang]?.[key] || ''}
                                       onChange={(e) => handleTranslationChange(editingLang, key, e.target.value)}
                                       placeholder="Çeviriyi buraya girin..."
                                    />
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>
                  </>
               ) : (
                  <div className="h-full flex flex-col items-center justify-center text-brand-primary/20 dark:text-white/20">
                     <Languages size={64} className="mb-4 opacity-50" strokeWidth={1} />
                     <p className="text-sm font-black uppercase tracking-widest text-center">Çevirilerini düzenlemek için<br/>yandan bir dil seçin.</p>
                  </div>
               )}
            </div>
         </div>
      </div>
    </div>
  );
}
