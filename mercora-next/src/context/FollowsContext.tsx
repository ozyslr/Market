'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getFollowedSellers, followSeller, unfollowSeller } from '@/services/followService';

interface FollowedSellerInfo {
  id: string;
  name: string;
  photoURL?: string;
}

interface FollowsContextType {
  followedIds: string[];
  followedSellers: FollowedSellerInfo[];
  loading: boolean;
  follow: (sellerId: string, sellerName?: string, sellerPhoto?: string) => Promise<void>;
  unfollow: (sellerId: string) => Promise<void>;
  isFollowing: (sellerId: string) => boolean;
}

const FollowsContext = createContext<FollowsContextType | undefined>(undefined);

export function FollowsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [followedIds, setFollowedIds] = useState<string[]>([]);
  const [followedSellers, setFollowedSellers] = useState<FollowedSellerInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setFollowedIds([]);
      setFollowedSellers([]);
      setLoading(false);
      return;
    }
    try {
      const ids = await getFollowedSellers(user.id);
      setFollowedIds(ids);
      // Convert plain IDs to minimal info objects
      setFollowedSellers(ids.map(id => ({ id, name: id })));
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const follow = async (sellerId: string, sellerName?: string, sellerPhoto?: string) => {
    if (!user) return;
    await followSeller(user.id, sellerId);
    if (!followedIds.includes(sellerId)) {
      setFollowedIds(prev => [...prev, sellerId]);
      setFollowedSellers(prev => [...prev, { id: sellerId, name: sellerName ?? sellerId, photoURL: sellerPhoto }]);
    }
  };

  const unfollow = async (sellerId: string) => {
    if (!user) return;
    await unfollowSeller(user.id, sellerId);
    setFollowedIds(prev => prev.filter(id => id !== sellerId));
    setFollowedSellers(prev => prev.filter(s => s.id !== sellerId));
  };

  const isFollowing = (sellerId: string) => followedIds.includes(sellerId);

  return (
    <FollowsContext.Provider value={{ followedIds, followedSellers, loading, follow, unfollow, isFollowing }}>
      {children}
    </FollowsContext.Provider>
  );
}

export function useFollows() {
  const context = useContext(FollowsContext);
  if (!context) throw new Error('useFollows must be used within a FollowsProvider');
  return context;
}
