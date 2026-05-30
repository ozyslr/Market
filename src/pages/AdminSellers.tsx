import React, { useState, useEffect } from 'react';
import { getSellers, updateSeller, deleteSeller } from '@/services/userService';
import { Seller } from '@/types';
import { Edit, Trash2, Store, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { MOCK_SELLERS } from '@/mockData';

export function AdminSellers() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSellers();
  }, []);

  const fetchSellers = async () => {
    setIsLoading(true);
    try {
      let data = await getSellers();
      if (data.length === 0) {
        data = MOCK_SELLERS; // Fallback
      }
      setSellers(data);
    } catch(e) {
      console.error(e);
      setSellers(MOCK_SELLERS); // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVerification = async (id: string, currentStatus: boolean) => {
    if (id.startsWith('s')) {
       // Mock data typically has format like 's1', 's2'
       setSellers(sellers.map(s => s.id === id ? { ...s, isVerified: !currentStatus } : s));
       return;
    }
    try {
      await updateSeller(id, { isVerified: !currentStatus });
      await fetchSellers();
    } catch(e) {
      console.error("Failed to update verification");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this seller?')) {
      if (id.startsWith('s')) {
        setSellers(sellers.filter(s => s.id !== id));
        return;
      }
      try {
        await deleteSeller(id);
        await fetchSellers();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="bg-white rounded-[3.5rem] p-12 border border-[#F8F8FA] shadow-sm flex flex-col min-h-[500px]">
      <div className="flex items-center justify-between mb-10">
        <h3 className="text-2xl font-display font-black uppercase italic tracking-tighter text-[#1A1033]">Seller Management</h3>
      </div>

      {isLoading ? (
        <div className="flex-1 flex justify-center items-center">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      ) : (
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-brand-primary/5">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-[#1A1033]/40">Store</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-[#1A1033]/40">Origin</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-[#1A1033]/40">Status</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-[#1A1033]/40 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-primary/5">
              {sellers.map((seller) => (
                <tr key={seller.id} className="group hover:bg-brand-secondary/30 transition-colors">
                  <td className="px-8 py-6 flex items-center gap-4">
                     <div className="w-10 h-10 rounded-full bg-brand-primary/5 flex items-center justify-center text-brand-primary">
                        <Store size={16} />
                     </div>
                     <div>
                        <span className="font-bold text-sm text-[#1A1033] block">{seller.storeName}</span>
                        <span className="text-[10px] text-[#1A1033]/40 uppercase tracking-widest">{seller.slug}</span>
                     </div>
                  </td>
                  <td className="px-8 py-6 text-sm text-[#1A1033]/60">{seller.origin}</td>
                  <td className="px-8 py-6">
                    <button 
                      onClick={() => toggleVerification(seller.id, seller.isVerified)}
                      className={`px-3 py-1.5 rounded-lg flex items-center gap-2 text-[9px] font-black uppercase tracking-widest border transition-all ${seller.isVerified ? 'bg-green-50 text-green-600 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}
                    >
                      {seller.isVerified ? <><CheckCircle size={12} /> Verified</> : <><XCircle size={12} /> Unverified</>}
                    </button>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button onClick={() => handleDelete(seller.id)} className="p-2 text-[#1A1033]/40 hover:text-red-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {sellers.length === 0 && (
                <tr>
                   <td colSpan={4} className="px-8 py-12 text-center text-[#1A1033]/40 text-sm font-bold">No sellers found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
