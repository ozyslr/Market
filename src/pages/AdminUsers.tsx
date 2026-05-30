import React, { useState, useEffect } from 'react';
import { getUsers, updateUser, deleteUser } from '@/services/userService';
import { User, UserRole } from '@/types';
import { Edit, Trash2, Shield, User as UserIcon, Loader2 } from 'lucide-react';
import { MOCK_USER } from '@/mockData';

export function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      let data = await getUsers();
      if (data.length === 0) {
        // Fallback to mock data if empty
        data = [{...MOCK_USER, id: 'mock-1'}];
      }
      setUsers(data);
    } catch(e) {
      console.error(e);
      setUsers([{...MOCK_USER, id: 'mock-1'}]); // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (id: string, currentRole: UserRole) => {
    const roles: UserRole[] = ['buyer', 'seller', 'admin', 'moderator'];
    const currentIndex = roles.indexOf(currentRole);
    const nextRole = roles[(currentIndex + 1) % roles.length];
    
    if (id.startsWith('mock')) {
       setUsers(users.map(u => u.id === id ? { ...u, role: nextRole } : u));
       return;
    }

    try {
      await updateUser(id, { role: nextRole });
      await fetchUsers();
    } catch(e) {
      console.error("Failed to update role");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      if (id.startsWith('mock')) {
        setUsers(users.filter(u => u.id !== id));
        return;
      }
      try {
        await deleteUser(id);
        await fetchUsers();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="bg-white rounded-[3.5rem] p-12 border border-[#F8F8FA] shadow-sm flex flex-col min-h-[500px]">
      <div className="flex items-center justify-between mb-10">
        <h3 className="text-2xl font-display font-black uppercase italic tracking-tighter text-[#1A1033]">User Management</h3>
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
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-[#1A1033]/40">User</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-[#1A1033]/40">Email</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-[#1A1033]/40">Role</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-[#1A1033]/40">Country</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-[#1A1033]/40 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-primary/5">
              {users.map((user) => (
                <tr key={user.id} className="group hover:bg-brand-secondary/30 transition-colors">
                  <td className="px-8 py-6 flex items-center gap-4">
                     <div className="w-10 h-10 rounded-full bg-brand-primary/5 flex items-center justify-center text-brand-primary">
                        <UserIcon size={16} />
                     </div>
                     <span className="font-bold text-sm text-[#1A1033]">{user.name}</span>
                  </td>
                  <td className="px-8 py-6 text-sm text-[#1A1033]/60">{user.email}</td>
                  <td className="px-8 py-6">
                    <button 
                      onClick={() => handleRoleChange(user.id, user.role)}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${user.role === 'admin' ? 'bg-red-50 text-red-600 border-red-200' : user.role === 'seller' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-brand-secondary text-brand-primary/60 border-transparent hover:border-brand-primary/10'}`}
                    >
                      {user.role}
                    </button>
                  </td>
                  <td className="px-8 py-6 text-sm text-[#1A1033]/60">{user.country || 'N/A'}</td>
                  <td className="px-8 py-6 text-right">
                    <button onClick={() => handleDelete(user.id)} className="p-2 text-[#1A1033]/40 hover:text-red-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                   <td colSpan={5} className="px-8 py-12 text-center text-[#1A1033]/40 text-sm font-bold">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
