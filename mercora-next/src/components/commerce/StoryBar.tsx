'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface StoryItem {
  id: string;
  name: string;
  image: string;
  link: string;
  color?: string;
}

export function StoryBar() {
  const [stories, setStories] = useState<StoryItem[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const q = query(collection(db, 'categories'), orderBy('name', 'asc'), limit(10));
        const snap = await getDocs(q);
        const items = snap.docs.map(d => ({
          id: d.id,
          name: (d.data().name as string) || 'Category',
          image: (d.data().image as string) || '',
          link: `/category/${(d.data().slug as string) || d.id}`,
          color: (d.data().color as string) || '#7C3AED',
        }));
        setStories(items.length > 0 ? items : defaultStories);
      } catch {
        setStories(defaultStories);
      }
    }
    load();
  }, []);

  if (!stories.length) return null;

  return (
    <div className="flex gap-4 overflow-x-auto no-scrollbar py-4 px-2">
      {stories.map(story => (
        <Link
          key={story.id}
          href={story.link}
          className="flex flex-col items-center gap-1.5 flex-shrink-0 group"
        >
          <div
            className="w-16 h-16 md:w-20 md:h-20 rounded-full p-0.5"
            style={{ background: `conic-gradient(${story.color || '#7C3AED'}, #EC4899, ${story.color || '#7C3AED'})` }}
          >
            <div className="w-full h-full rounded-full overflow-hidden border-2 border-white">
              <OptimizedImage
                src={story.image}
                alt={story.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <span className="text-[10px] md:text-xs text-gray-600 truncate max-w-[72px] text-center group-hover:text-purple-700 transition-colors">
            {story.name}
          </span>
        </Link>
      ))}
    </div>
  );
}

const defaultStories: StoryItem[] = [
  { id: '1', name: 'Elektronik', image: '', link: '/category/elektronik', color: '#7C3AED' },
  { id: '2', name: 'Moda', image: '', link: '/category/moda', color: '#EC4899' },
  { id: '3', name: 'Ev & Yaşam', image: '', link: '/category/ev-yasam', color: '#10B981' },
  { id: '4', name: 'Spor', image: '', link: '/category/spor', color: '#F59E0B' },
  { id: '5', name: 'Bebek', image: '', link: '/category/bebek-cocuk', color: '#3B82F6' },
  { id: '6', name: 'Kitap', image: '', link: '/category/kitap-hobi', color: '#EF4444' },
];
