import { writeBatch, doc, collection, getDocs, query, where, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { MOCK_PRODUCTS, CATEGORIES } from '../mockData';
import { Product } from '../types';

export class BotService {
  /**
   * Simulates a bot adding a new product based on a specific category.
   * In a real bot, this would scrape or generate content.
   */
  static async simulateBotAddition(categoryId: string) {
    try {
      const category = CATEGORIES.find(c => c.id === categoryId);
      if (!category) throw new Error('Invalid category for bot deployment');

      // Pick a random template from mock data that matches category
      const templates = MOCK_PRODUCTS.filter(p => p.categoryId === categoryId);
      const template = templates[Math.floor(Math.random() * templates.length)];

      if (!template) {
        // Fallback to random if no template found
        const randomTemplate = MOCK_PRODUCTS[Math.floor(Math.random() * MOCK_PRODUCTS.length)];
        return this.addBotProduct({ ...randomTemplate, categoryId });
      }

      return this.addBotProduct(template);
    } catch (error) {
       console.error('Bot Error:', error);
       throw error;
    }
  }

  private static async addBotProduct(template: Product) {
    const botId = `BOT-${Math.floor(Math.random() * 1000)}`;
    const newId = `product-${Date.now()}-${botId}`;
    
    const newProduct: Product = {
      ...template,
      id: newId,
      title: `[BOT-${botId}] ${template.title}`,
      sellerId: 'mcr-global-bot', // Specialized bot seller
      stock: Math.floor(Math.random() * 100) + 10,
      createdAt: new Date().toISOString()
    };

    const batch = writeBatch(db);
    const prodRef = doc(db, 'products', newProduct.id);
    batch.set(prodRef, newProduct);

    // Track bot action in activity log
    const logRef = doc(collection(db, 'activity_logs'));
    batch.set(logRef, {
      type: 'BOT_ITEM_ADDED',
      botId: botId,
      productId: newProduct.id,
      category: newProduct.categoryId,
      timestamp: new Date().toISOString()
    });

    await batch.commit();
    return newProduct;
  }

  /**
   * Deploys bots across all categories
   */
  static async deployGlobalBots() {
    const results: Product[] = [];
    for (const cat of CATEGORIES) {
      const prod = await this.simulateBotAddition(cat.id);
      results.push(prod);
    }
    return results;
  }
}
