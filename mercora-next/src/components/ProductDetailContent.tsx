'use client';

import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ShoppingCart, Heart, Star, Truck, Shield, RotateCcw, Box, ChevronRight } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { ProductCarousel } from '@/components/commerce/ProductCarousel';
import { ProductRecommendations } from '@/components/commerce/ProductRecommendations';
import { ReviewSection } from '@/components/product/ReviewSection';
import { QASection } from '@/components/product/QASection';
import { getCategories } from '@/services/productService';
import type { Product, Category } from '@/types';
import { cn } from '@/lib/utils';

const ARViewer = dynamic(() => import('@/components/commerce/ARViewer').then(m => ({ default: m.ARViewer })), { ssr: false });

export function ProductDetailContent({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { t } = useLanguage();
  const { user, firebaseUser } = useAuth();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [arOpen, setArOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState<'details' | 'specs' | 'reviews' | 'qa'>('details');

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
  }, []);

  const categoryPath = useMemo(() => {
    if (!categories.length || !product.categoryId) return [];
    const cat = categories.find(c => c.id === product.categoryId);
    if (!cat) return [{ id: product.categoryId, name: product.categoryId }];
    const path = [cat];
    let parentId = cat.parentId;
    while (parentId) {
      const parent = categories.find(c => c.id === parentId);
      if (parent) {
        path.unshift(parent);
        parentId = parent.parentId;
      } else break;
    }
    return path;
  }, [categories, product.categoryId]);

  const wishlisted = isWishlisted(product.id);
  const inStock = product.stock > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-1.5 flex-wrap">
        <Link href="/" className="hover:text-purple-700">{t('nav.home_page')}</Link>
        {categoryPath.map((cat, i) => (
          <span key={cat.id} className="flex items-center gap-1.5">
            <ChevronRight size={12} className="text-gray-300" />
            {i < categoryPath.length - 1 ? (
              <Link href={`/category/${cat.id}`} className="hover:text-purple-700">{cat.name}</Link>
            ) : (
              <span className="text-gray-900">{cat.name}</span>
            )}
          </span>
        ))}
        <ChevronRight size={12} className="text-gray-300" />
        <span className="text-gray-900">{product.title}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Images */}
        <div>
          <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 mb-4">
            {product.images?.[selectedImage] ? (
              <Image
                src={product.images[selectedImage]}
                alt={product.title}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                No Image
              </div>
            )}
          </div>
          {product.images && product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 flex-shrink-0 ${
                    i === selectedImage ? 'border-purple-700' : 'border-gray-200'
                  }`}
                >
                  <Image src={img} alt="" fill sizes="80px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">{product.brand}</p>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">{product.title}</h1>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  className={i < Math.round(product.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                />
              ))}
            </div>
            <span className="text-sm text-gray-500">
              {product.rating || 0} ({product.reviewsCount || 0} {t('product.reviews')})
            </span>
          </div>

          {/* Price */}
          <div className="mb-6">
            <span className="text-3xl font-bold text-gray-900">
              {product.currency || '£'}{product.price.toLocaleString()}
            </span>
            {product.oldPrice && (
              <span className="text-lg text-gray-400 line-through ml-2">
                {product.currency || '£'}{product.oldPrice.toLocaleString()}
              </span>
            )}
            {product.discountPercentage && (
              <span className="ml-2 bg-red-100 text-red-700 text-sm font-bold px-2 py-1 rounded">
                -{product.discountPercentage}%
              </span>
            )}
          </div>

          {/* Stock */}
          <div className="mb-6">
            {inStock ? (
              <span className="text-green-700 text-sm font-semibold flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full inline-block" />
                {t('product.inStock')} ({product.stock} adet)
              </span>
            ) : (
              <span className="text-red-600 text-sm font-semibold">{t('product.outOfStock')}</span>
            )}
          </div>

          {/* Description */}
          <p className="text-gray-600 leading-relaxed mb-6">{product.description}</p>

          {/* Quantity + Add to Cart */}
          {inStock && (
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 text-gray-600 hover:bg-gray-100"
                >
                  -
                </button>
                <span className="px-4 py-2 font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="px-3 py-2 text-gray-600 hover:bg-gray-100"
                >
                  +
                </button>
              </div>
              <button
                onClick={() => addItem(product.id, quantity)}
                className="flex-1 bg-purple-700 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-800 transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingCart size={20} />
                {t('product.addToCart')}
              </button>
              <button
                onClick={() => toggleWishlist(product.id)}
                className={`p-3 rounded-xl border ${
                  wishlisted ? 'border-red-200 bg-red-50' : 'border-gray-300'
                }`}
              >
                <Heart size={20} className={wishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'} />
              </button>
              {/* AR View */}
              {product.images?.[0] && (
                <button
                  onClick={() => setArOpen(true)}
                  className="p-3 rounded-xl border border-gray-300 hover:bg-gray-50"
                  title="AR View"
                >
                  <Box size={20} className="text-gray-600" />
                </button>
              )}
            </div>
          )}

          {/* Trust Badges */}
          <div className="border-t border-gray-200 pt-6 grid grid-cols-3 gap-4">
            <div className="text-center">
              <Truck size={24} className="mx-auto mb-2 text-gray-600" />
              <p className="text-xs font-medium">{t('badge.free_shipping')}</p>
            </div>
            <div className="text-center">
              <Shield size={24} className="mx-auto mb-2 text-gray-600" />
              <p className="text-xs font-medium">{t('trust.safe_payment')}</p>
            </div>
            <div className="text-center">
              <RotateCcw size={24} className="mx-auto mb-2 text-gray-600" />
              <p className="text-xs font-medium">{t('trust.easy_return')}</p>
            </div>
          </div>

          {/* Specifications */}
          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <div className="border-t border-gray-200 pt-6 mt-6">
              <h3 className="font-bold mb-3">{t('product.specifications')}</h3>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key} className="col-span-2 grid grid-cols-2">
                    <dt className="text-gray-500">{key}</dt>
                    <dd className="font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>

      {/* Tabbed Detailed View */}
      <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden mt-12">
        <div className="flex border-b border-gray-200 dark:border-zinc-800 overflow-x-auto no-scrollbar">
          {[
            { id: 'details', label: t('product.description') },
            { id: 'specs', label: t('product.specifications') },
            { id: 'reviews', label: t('product.reviews') },
            { id: 'qa', label: t('product.questions_answers') }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-8 py-6 text-xs font-black uppercase tracking-widest transition-all relative shrink-0",
                activeTab === tab.id ? "text-accent border-b-2 border-accent" : "text-gray-400 hover:text-gray-900 dark:hover:text-white"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        <div className="p-8 md:p-12">
          {activeTab === 'details' && (
            <div className="prose prose-zinc dark:prose-invert max-w-none">
              <div className="text-gray-700 dark:text-zinc-300 leading-relaxed font-medium whitespace-pre-wrap">
                {product.longDescription || product.description}
              </div>
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="grid grid-cols-1 border border-gray-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
              {product.specifications && Object.keys(product.specifications).length > 0 ? (
                Object.entries(product.specifications).map(([key, val], i) => (
                  <div key={key} className={cn("grid grid-cols-2 p-6 transition-colors", i % 2 === 0 ? "bg-gray-50 dark:bg-zinc-800/30" : "bg-white dark:bg-zinc-900")}>
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-zinc-500">{key}</span>
                    <span className="text-sm font-black text-gray-900 dark:text-white uppercase italic">{val as string}</span>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center text-gray-400 italic">No specifications provided.</div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <ReviewSection
              productId={product.id}
              sellerId={product.sellerId}
              productRating={product.rating}
              currentUserId={firebaseUser?.uid}
              currentUserName={user?.name || firebaseUser?.displayName || undefined}
              isSeller={user?.id === product.sellerId || user?.role === 'admin'}
              isLoggedIn={!!firebaseUser}
            />
          )}

          {activeTab === 'qa' && (
            <QASection
              productId={product.id}
              currentUserId={firebaseUser?.uid}
              currentUserName={user?.name || firebaseUser?.displayName || undefined}
              isSeller={user?.id === product.sellerId || user?.role === 'admin'}
              isLoggedIn={!!firebaseUser}
            />
          )}
        </div>
      </div>

      {/* AR Viewer */}
      {arOpen && product.images?.[0] && (
        <ARViewer imageUrl={product.images[0]} productName={product.title} onClose={() => setArOpen(false)} />
      )}

      {/* Product Carousel — same seller */}
      {product.sellerId && (
        <section className="mt-12">
          <ProductCarousel
            title="More from this seller"
            products={[product].map(p => ({
              id: p.id, name: p.title, price: p.price, images: p.images || [], rating: p.rating,
            }))}
          />
        </section>
      )}

      {/* Recommendations */}
      <section className="mt-8">
        <ProductRecommendations type="cross-sell" currentProductId={product.id} category={product.categoryId} maxResults={6} />
      </section>
    </div>
  );
}
