import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search as SearchIcon, Zap,
  TrendingUp, SlidersHorizontal, Grid, List as ListIcon,
  ArrowRight
} from 'lucide-react';
import { MOCK_PRODUCTS, CATEGORIES } from '@/mockData';
import type { Product } from '@/types';
import { cn } from '@/lib/utils';
import { ProductCard } from '@/components/commerce/ProductCard';
import { useLanguage } from '@/context/LanguageContext';

export function SearchResultsPage() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const categoryId = searchParams.get('category') || '';
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (categoryId) params.set('category', categoryId)

    setLoading(true)
    fetch(`/api/products?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.products && data.products.length >= 0) {
          setResults(data.products)
        } else {
          throw new Error('fallback')
        }
      })
      .catch(() => {
        // Fallback to mock data when API not available
        const filtered = MOCK_PRODUCTS.filter((p) => {
          const matchesQuery = !query ||
            p.title.toLowerCase().includes(query.toLowerCase()) ||
            p.description.toLowerCase().includes(query.toLowerCase())
          const matchesCategory = !categoryId || p.categoryId === categoryId
          return matchesQuery && matchesCategory
        })
        setResults(filtered)
      })
      .finally(() => setLoading(false))
  }, [query, categoryId]);

  return (
    <div className="min-h-screen bg-brand-secondary/20 pt-8 pb-20">
      <div className="max-w-[1600px] mx-auto px-6">
        {/* Search Header / Breadcrumb */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-primary/40 mb-4">
              <Link to="/" className="hover:text-accent">Mercora Global</Link>
              <span>/</span>
              <span className="text-brand-primary">Search Results</span>
            </div>
            <h1 className="text-4xl font-display font-black tracking-tighter text-brand-primary uppercase italic">
               {results.length} Artifacts Found for "{query || categoryId}"
            </h1>
          </div>

          <div className="flex bg-white rounded-2xl p-1.5 border border-brand-primary/5 shadow-sm">
             <button 
               onClick={() => setViewMode('grid')}
               className={cn("px-4 py-2 rounded-xl transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest", viewMode === 'grid' ? "bg-brand-primary text-white shadow-lg" : "text-brand-primary/40 hover:text-brand-primary")}
             >
               <Grid size={14} /> Grid
             </button>
             <button 
               onClick={() => setViewMode('list')}
               className={cn("px-4 py-2 rounded-xl transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest", viewMode === 'list' ? "bg-brand-primary text-white shadow-lg" : "text-brand-primary/40 hover:text-brand-primary")}
             >
               <ListIcon size={14} /> List
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Advanced Filters Sidebar */}
          <aside className="lg:col-span-3 space-y-8">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-brand-primary/5">
               <div className="flex items-center justify-between mb-8">
                 <h3 className="text-xs font-black uppercase tracking-[0.2em] text-accent">Curated Filters</h3>
                 <SlidersHorizontal size={14} className="text-brand-primary/20" />
               </div>

               <div className="space-y-10">
                 {/* Category Filter */}
                 <div className="space-y-4">
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-primary">Global Departments</h4>
                   <div className="space-y-2">
                     {CATEGORIES.map(cat => (
                       <label key={cat.id} className="flex items-center gap-3 group cursor-pointer">
                         <input type="checkbox" defaultChecked={categoryId === cat.id} className="w-4 h-4 rounded border-brand-primary/10 text-accent focus:ring-accent transition-all" />
                         <span className="text-sm font-bold text-brand-primary/60 group-hover:text-brand-primary transition-colors">{cat.name}</span>
                       </label>
                     ))}
                   </div>
                 </div>

                 {/* fulfillment Filter */}
                 <div className="space-y-4">
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-primary">Fulfillment Hub</h4>
                   <div className="space-y-2">
                     {['UK Direct', 'European Union', 'Middle East Hub', 'Merchant Direct'].map(hub => (
                       <label key={hub} className="flex items-center gap-3 group cursor-pointer">
                         <input type="checkbox" className="w-4 h-4 rounded border-brand-primary/10 text-accent focus:ring-accent" />
                         <span className="text-sm font-bold text-brand-primary/60 group-hover:text-brand-primary transition-colors">{hub}</span>
                       </label>
                     ))}
                   </div>
                 </div>

                 {/* Price Filter */}
                 <div className="space-y-4">
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-primary">Investment Level</h4>
                   <div className="grid grid-cols-2 gap-3">
                     <div className="relative">
                       <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-brand-primary/20">£</span>
                       <input type="number" placeholder="Min" className="w-full pl-6 pr-2 py-2 bg-brand-secondary/30 rounded-xl text-xs font-bold outline-none" />
                     </div>
                     <div className="relative">
                       <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-brand-primary/20">£</span>
                       <input type="number" placeholder="Max" className="w-full pl-6 pr-2 py-2 bg-brand-secondary/30 rounded-xl text-xs font-bold outline-none" />
                     </div>
                   </div>
                 </div>

                 {/* Certifications */}
                 <div className="space-y-4">
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-primary">Merchant Shields</h4>
                   <div className="space-y-2">
                     {['Artisan Verified', 'Multi-Escrow Ready', 'Tax Compliant', 'Eco-Artifact'].map(shield => (
                       <label key={shield} className="flex items-center gap-3 group cursor-pointer">
                         <input type="checkbox" className="w-4 h-4 rounded border-brand-primary/10 text-accent focus:ring-accent" />
                         <span className="text-sm font-bold text-brand-primary/60 group-hover:text-brand-primary transition-colors flex items-center gap-2">
                            {shield}
                         </span>
                       </label>
                     ))}
                   </div>
                 </div>
               </div>
            </div>

            {/* Strategic Banner */}
            <div className="bg-brand-primary rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
               <Zap size={100} className="absolute -top-10 -right-10 text-white/5 rotate-12 group-hover:rotate-0 transition-transform duration-700" />
               <TrendingUp size={24} className="text-accent mb-4" />
               <h4 className="text-xl font-display font-black tracking-tight leading-tight mb-4 uppercase italic">Global <br /> Dynamic <br /> Insights</h4>
               <p className="text-xs text-white/60 font-medium leading-relaxed">We've identified a 15% increase in demand for these artifacts in your region. Act fast.</p>
               <button className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-accent hover:gap-4 transition-all">
                 View Market Pulse <ArrowRight size={14} />
               </button>
            </div>
          </aside>

          {/* Results Grid */}
          <main className="lg:col-span-9">
            <div className={cn(
               "grid gap-10",
               viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
            )}>
              {results.length > 0 ? (
                results.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))
              ) : (
                <div className="col-span-full py-40 flex flex-col items-center justify-center text-center">
                  <div className="w-24 h-24 bg-brand-secondary rounded-full flex items-center justify-center mb-8 animate-bounce">
                    <SearchIcon size={40} className="text-brand-primary/10" />
                  </div>
                  <h3 className="text-3xl font-display font-black text-brand-primary opacity-20 uppercase italic italic">The global archives are silent.</h3>
                  <p className="text-brand-primary/40 mt-4 max-w-sm">No artifacts matched your query. Try searching for broader artisan categories or use the AI Assistant.</p>
                </div>
              )}
            </div>
            
            {/* Pagination / Load More */}
            {results.length > 0 && (
              <div className="mt-20 flex flex-col items-center gap-6">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary/20">Archiving artifacts 1 - {results.length} of {results.length}</p>
                <button className="px-12 py-5 bg-white border border-brand-primary/5 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] hover:bg-brand-primary hover:text-white transition-all shadow-xl shadow-brand-primary/5">
                  Load Global Feed
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
