'use client';

import { useState } from 'react';
import { Bot, Sparkles, Loader2, Check, AlertCircle } from 'lucide-react';
import { generateBotProducts, getBotProducts, deleteBotProduct, getTemplateCount } from '@/services/botService';
interface BotSalesEngineProps {
  sellerId: string;
  onProductsCreated?: (count: number) => void;
}

export function BotSalesEngine({ sellerId, onProductsCreated }: BotSalesEngineProps) {
  const [count, setCount] = useState(4);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleGenerate = async () => {
    setGenerating(true);
    setResult(null);
    try {
      const ids = await generateBotProducts(sellerId, count);
      if (ids.length > 0) {
        setResult({ success: true, message: `${ids.length} products created successfully!` });
        onProductsCreated?.(ids.length);
      } else {
        setResult({ success: false, message: 'No products were created. Please try again.' });
      }
    } catch {
      setResult({ success: false, message: 'Failed to generate products.' });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-100">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-purple-100 rounded-xl">
          <Bot size={24} className="text-purple-700" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            Bot Sales Engine
            <Sparkles size={16} className="text-yellow-500" />
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Instantly generate demo products with AI-generated names, descriptions, and pricing.
            Perfect for testing your store setup.
          </p>

          <div className="flex items-center gap-3 mt-4">
            <select
              value={count}
              onChange={e => setCount(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-purple-200 focus:border-purple-600 outline-none"
            >
              {[2, 4, 6, 8].map(n => (
                <option key={n} value={n}>{n} products</option>
              ))}
            </select>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-5 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 disabled:opacity-50 font-medium text-sm transition-colors flex items-center gap-2"
            >
              {generating ? (
                <><Loader2 size={16} className="animate-spin" /> Generating...</>
              ) : (
                <><Bot size={16} /> Generate</>
              )}
            </button>
          </div>

          {result && (
            <div className={`flex items-center gap-2 mt-3 text-sm ${
              result.success ? 'text-green-700' : 'text-red-700'
            }`}>
              {result.success ? <Check size={16} /> : <AlertCircle size={16} />}
              {result.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
