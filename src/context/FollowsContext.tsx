import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getFollowedSellers, followSeller, unfollowSeller } from '@/services/followService';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface FollowsContextType {
  followedSellers: string[];
  isFollowing: (sellerId: string) => boolean;
  toggleFollow: (sellerId: string) => Promise<void>;
  loading: boolean;
}

const FollowsContext = createContext<FollowsContextType | undefined>(undefined);

export function FollowsProvider({ children }: { children: React.ReactNode }) {
  const { firebaseUser } = useAuth();
  const [followedSellers, setFollowedSellers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!firebaseUser) {
      setFollowedSellers([]);
      return;
    }
    setLoading(true);
    getFollowedSellers(firebaseUser.uid)
      .then(setFollowedSellers)
      .finally(() => setLoading(false));
  }, [firebaseUser]);

  const isFollowing = useCallback(
    (sellerId: string) => followedSellers.includes(sellerId),
    [followedSellers],
  );

  const toggleFollow = useCallback(
    async (sellerId: string) => {
      if (!firebaseUser) return;
      const wasFollowing = followedSellers.includes(sellerId);
      // Optimistic update
      setFollowedSellers((prev) =>
        wasFollowing ? prev.filter((id) => id !== sellerId) : [...prev, sellerId],
      );
      try {
        if (wasFollowing) {
          await unfollowSeller(firebaseUser.uid, sellerId);
        } else {
          await followSeller(firebaseUser.uid, sellerId);
        }
        // Update seller's follower count
        await updateDoc(doc(db, 'sellers', sellerId), {
          followersCount: increment(wasFollowing ? -1 : 1),
        });
      } catch {
        // Rollback on error
        setFollowedSellers((prev) =>
          wasFollowing ? [...prev, sellerId] : prev.filter((id) => id !== sellerId),
        );
      }
    },
    [firebaseUser, followedSellers],
  );

  return (
    <FollowsContext.Provider value={{ followedSellers, isFollowing, toggleFollow, loading }}>
      {children}
    </FollowsContext.Provider>
  );
}

export function useFollows() {
  const ctx = useContext(FollowsContext);
  if (!ctx) throw new Error('useFollows must be used within a FollowsProvider');
  return ctx;
}
