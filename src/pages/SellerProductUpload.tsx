import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Package, List, Image as ImageIcon, 
  Tag, Truck, Search, CheckCircle2, ChevronRight, ChevronLeft,
  AlertCircle, Plus, Trash2
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { useProductStore } from '../store/useProductStore';

type Step = {
  id: string;
  title: string;
  icon: React.ReactNode;
};

const STEPS: Step[] = [
  { id: 'category', title: 'Category & AI', icon: <Sparkles className="w-5 h-5" /> },
  { id: 'basic', title: 'Basic Info', icon: <Package className="w-5 h-5" /> },
  { id: 'attributes', title: 'Attributes', icon: <List className="w-5 h-5" /> },
  { id: 'media', title: 'Media', icon: <ImageIcon className="w-5 h-5" /> },
  { id: 'pricing', title: 'Pricing & Stock', icon: <Tag className="w-5 h-5" /> },
  { id: 'shipping', title: 'Shipping', icon: <Truck className="w-5 h-5" /> },
  { id: 'seo', title: 'SEO & Visibility', icon: <Search className="w-5 h-5" /> }
];

const PIM_SCHEMAS: Record<string, any[]> = {
  smartphone: [
    { id: 'ram', label: 'RAM', type: 'select', options: ['4GB', '8GB', '12GB', '16GB'] },
    { id: 'storage', label: 'Storage', type: 'select', options: ['128GB', '256GB', '512GB', '1TB'] },
    { id: 'color', label: 'Color', type: 'text' },
    { id: '5g', label: '5G Support', type: 'checkbox' }
  ],
  shoes: [
    { id: 'size', label: 'Size', type: 'select', options: ['38', '39', '40', '41', '42', '43', '44', '45'] },
    { id: 'material', label: 'Material', type: 'text' },
    { id: 'color', label: 'Color', type: 'text' }
  ]
};

export function SellerProductUpload() {
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const [formData, setFormData] = useState({
    category: '',
    categoryPath: '',
    title: '',
    shortDescription: '',
    fullDescription: '',
    brand: '',
    sku: '',
    barcode: '',
    attributes: {} as Record<string, any>,
    hasVariants: false,
    variantAxes: [] as { name: string; values: string[] }[],
    variants: [] as any[],
    media: [] as any[],
    pricing: { basePrice: 0, salePrice: 0 },
    inventory: { stock: 0 },
    shipping: { weight: 0, length: 0, width: 0, height: 0, freeShipping: false },
    seo: { title: '', description: '' }
  });

  const navigate = useNavigate();
  const { addProduct, isLoading } = useProductStore();

  const handleSubmit = async () => {
    try {
      // Basic mapping of wizard data to Product model
      const newProduct = {
        title: formData.title,
        description: formData.fullDescription || formData.shortDescription,
        brand: formData.brand,
        sku: formData.sku,
        categoryId: formData.category || 'uncategorized',
        price: formData.pricing.basePrice,
        oldPrice: formData.pricing.salePrice > 0 ? formData.pricing.basePrice : undefined,
        stock: formData.inventory.stock,
        currency: 'TRY', // Default or from context
        originCountry: 'TR',
        images: formData.media.map(m => m.url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800'),
        attributes: formData.attributes,
        rating: 0,
        reviewsCount: 0,
        slug: formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substr(2, 5),
        sellerId: 'temp-seller-id' // Replace with actual user ID from AuthContext if available
      } as any;

      await addProduct(newProduct);
      alert('Product created successfully!');
      navigate('/dashboard/inventory'); // or reset form
    } catch (error) {
      console.error('Failed to create product:', error);
      alert('Failed to create product. Please try again.');
    }
  };

  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setDirection(1);
      setCurrentStep(curr => curr + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(curr => curr - 1);
    }
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 50 : -50,
      opacity: 0
    })
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-8 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Package className="w-8 h-8 text-primary-500" />
            Add New Product
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Smart PIM Engine - List your products with AI-powered taxonomy schema.
          </p>
        </div>

        {/* Wizard Layout */}
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Sidebar / Progress */}
          <div className="w-full md:w-64 flex-shrink-0">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sticky top-24">
              <nav aria-label="Progress">
                <ol className="space-y-4">
                  {STEPS.map((step, index) => {
                    const isActive = index === currentStep;
                    const isCompleted = index < currentStep;

                    return (
                      <li key={step.id}>
                        <div className={`group flex items-center gap-3 ${
                          isActive ? 'text-primary-600 dark:text-primary-400' :
                          isCompleted ? 'text-green-600 dark:text-green-400' :
                          'text-gray-400 dark:text-gray-500'
                        }`}>
                          <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors ${
                            isActive ? 'border-primary-600 bg-primary-50 dark:border-primary-400 dark:bg-primary-900/20' :
                            isCompleted ? 'border-green-600 bg-green-50 dark:border-green-400 dark:bg-green-900/20' :
                            'border-gray-300 dark:border-gray-600'
                          }`}>
                            {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : step.icon}
                          </div>
                          <span className={`text-sm font-medium ${isActive ? 'font-semibold' : ''}`}>
                            {step.title}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </nav>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-8 min-h-[500px] flex flex-col relative overflow-hidden">
              
              <div className="flex-1 relative">
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={currentStep}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ type: "tween", duration: 0.3 }}
                    className="absolute inset-0 overflow-y-auto no-scrollbar pb-10"
                  >
                    {/* Render Step Content */}
                    {currentStep === 0 && <StepCategory formData={formData} updateData={updateFormData} onNext={handleNext} />}
                    {currentStep === 1 && <StepBasicInfo formData={formData} updateData={updateFormData} />}
                    {currentStep === 2 && <StepAttributes formData={formData} updateData={updateFormData} />}
                    {currentStep === 3 && <StepMedia formData={formData} updateData={updateFormData} />}
                    {currentStep === 4 && <StepPricing formData={formData} updateData={updateFormData} />}
                    {currentStep === 5 && <StepShipping formData={formData} updateData={updateFormData} />}
                    {currentStep === 6 && <StepSEO formData={formData} updateData={updateFormData} />}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Navigation Footer */}
              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center z-10 bg-white dark:bg-gray-800">
                <button
                  onClick={handlePrev}
                  disabled={currentStep === 0}
                  className={`px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all ${
                    currentStep === 0 
                      ? 'opacity-0 pointer-events-none' 
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  <ChevronLeft className="w-5 h-5" />
                  Back
                </button>

                <button
                  onClick={currentStep === STEPS.length - 1 ? handleSubmit : handleNext}
                  disabled={isLoading}
                  className="px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-500/25 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isLoading ? 'Submitting...' : currentStep === STEPS.length - 1 ? 'Submit for Review' : 'Continue'}
                  {currentStep !== STEPS.length - 1 && <ChevronRight className="w-5 h-5" />}
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// --- Step Components ---

function StepCategory({ formData, updateData, onNext }: any) {
  const [search, setSearch] = useState('');
  const [suggestion, setSuggestion] = useState<any>(null);

  useEffect(() => {
    if (search.toLowerCase().includes('iphone') || search.toLowerCase().includes('samsung')) {
      setSuggestion({ key: 'smartphone', path: 'Electronics > Mobile Phones > Smartphones', title: search });
    } else if (search.toLowerCase().includes('shoe') || search.toLowerCase().includes('sneaker')) {
      setSuggestion({ key: 'shoes', path: 'Fashion > Shoes > Sneakers', title: search });
    } else {
      setSuggestion(null);
    }
  }, [search]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">What are you selling?</h2>
        <p className="mt-1 text-gray-500 dark:text-gray-400">Let our AI instantly categorize your product and build its schema.</p>
      </div>

      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Sparkles className="h-5 w-5 text-primary-500" />
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="block w-full pl-11 pr-4 py-4 border-2 border-gray-200 dark:border-gray-700 rounded-2xl leading-5 bg-white dark:bg-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 sm:text-lg transition-all text-gray-900 dark:text-white"
          placeholder="e.g. iPhone 15 Pro Max 256GB Black"
        />
      </div>

      <AnimatePresence>
        {suggestion && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800 flex items-start gap-3"
          >
            <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 dark:text-blue-300">AI Category Suggestion</h4>
              <p className="text-blue-700 dark:text-blue-400 text-sm mt-1">{suggestion.path}</p>
              <button 
                onClick={() => {
                  updateData({ category: suggestion.key, categoryPath: suggestion.path, title: suggestion.title });
                  onNext();
                }}
                className="mt-3 bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Confirm & Select
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {formData.category && (
        <div className="mt-4 p-4 border border-green-200 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-between">
          <span className="text-green-800 dark:text-green-300 font-medium text-sm">Selected: {formData.categoryPath}</span>
          <CheckCircle2 className="w-5 h-5 text-green-600" />
        </div>
      )}
    </div>
  );
}

function StepBasicInfo({ formData, updateData }: any) {
  return (
    <div className="space-y-6 h-full">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Basic Information</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product Title</label>
          <input 
            type="text" 
            value={formData.title}
            onChange={(e) => updateData({ title: e.target.value })}
            className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white" 
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Brand</label>
            <input 
              type="text" 
              value={formData.brand}
              onChange={(e) => updateData({ brand: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SKU</label>
            <input 
              type="text" 
              value={formData.sku}
              onChange={(e) => updateData({ sku: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white" 
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Short Description</label>
          <textarea 
            rows={3} 
            value={formData.shortDescription}
            onChange={(e) => updateData({ shortDescription: e.target.value })}
            className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white"
          ></textarea>
        </div>
      </div>
    </div>
  );
}

function StepAttributes({ formData, updateData }: any) {
  const schema = PIM_SCHEMAS[formData.category] || [];
  
  const handleAttrChange = (id: string, value: any) => {
    updateData({ attributes: { ...formData.attributes, [id]: value } });
  };

  const handleAddAxis = () => {
    updateData({ variantAxes: [...formData.variantAxes, { name: '', values: [] }] });
  };

  const updateAxisName = (index: number, name: string) => {
    const newAxes = [...formData.variantAxes];
    newAxes[index].name = name;
    updateData({ variantAxes: newAxes });
  };

  const updateAxisValues = (index: number, valuesStr: string) => {
    const newAxes = [...formData.variantAxes];
    newAxes[index].values = valuesStr.split(',').map(s => s.trim()).filter(Boolean);
    updateData({ variantAxes: newAxes });
  };

  const removeAxis = (index: number) => {
    const newAxes = [...formData.variantAxes];
    newAxes.splice(index, 1);
    updateData({ variantAxes: newAxes });
  };

  // Generate Cartesian Product of variant axes
  const generateVariants = () => {
    if (formData.variantAxes.length === 0) return;
    const axes = formData.variantAxes.filter((a: any) => a.values.length > 0);
    
    const cartesian = (...a: any[]): any[] => a.reduce((a, b) => a.flatMap((d: any) => b.map((e: any) => [d, e].flat())));
    
    let combinations = [];
    if (axes.length === 1) {
      combinations = axes[0].values.map((v: string) => [v]);
    } else if (axes.length > 1) {
      combinations = cartesian(...axes.map((a: any) => a.values));
    }

    const newVariants = combinations.map((combo: any, i: number) => {
      const attrs = axes.reduce((acc: any, axis: any, idx: number) => {
        acc[axis.name] = combo[idx];
        return acc;
      }, {});
      
      const variantName = Object.values(attrs).join(' - ');
      return {
        id: `var-${i}`,
        name: variantName,
        sku: `${formData.sku || 'SKU'}-${i+1}`,
        price: formData.pricing.basePrice || 0,
        stock: 0,
        attributes: attrs
      };
    });

    updateData({ variants: newVariants });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dynamic Attributes</h2>
        <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium dark:bg-primary-900/30 dark:text-primary-400 flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          Schema: {formData.category || 'Default'}
        </span>
      </div>
      
      {schema.length > 0 ? (
        <div className="grid grid-cols-2 gap-6">
          {schema.map((field) => (
            <div key={field.id}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{field.label}</label>
              {field.type === 'select' ? (
                <select 
                  value={formData.attributes[field.id] || ''}
                  onChange={(e) => handleAttrChange(field.id, e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 outline-none text-gray-900 dark:text-white"
                >
                  <option value="">Select...</option>
                  {field.options?.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              ) : field.type === 'checkbox' ? (
                <label className="flex items-center gap-2 mt-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={!!formData.attributes[field.id]}
                    onChange={(e) => handleAttrChange(field.id, e.target.checked)}
                    className="w-5 h-5 rounded text-primary-600 focus:ring-primary-500" 
                  />
                  <span className="text-gray-700 dark:text-gray-300">Yes</span>
                </label>
              ) : (
                <input 
                  type="text" 
                  value={formData.attributes[field.id] || ''}
                  onChange={(e) => handleAttrChange(field.id, e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 outline-none text-gray-900 dark:text-white" 
                />
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">Please select a category first to load specific attributes.</p>
      )}
      
      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <List className="w-5 h-5 text-primary-500" /> Variants Matrix
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Create product options (like size and color) to manage SKUs, prices, and inventory per variant.
            </p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Enable Variants</span>
            <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
              <input type="checkbox" checked={formData.hasVariants} onChange={(e) => updateData({ hasVariants: e.target.checked })} className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer" />
              <label className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer ${formData.hasVariants ? 'bg-primary-500' : 'bg-gray-300'}`}></label>
            </div>
          </label>
        </div>

        {formData.hasVariants && (
          <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl space-y-4 border border-gray-200 dark:border-gray-700">
            {formData.variantAxes.map((axis: any, index: number) => (
              <div key={index} className="flex items-start gap-4">
                <div className="flex-1">
                  <input type="text" placeholder="Option name (e.g. Color)" value={axis.name} onChange={(e) => updateAxisName(index, e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 outline-none mb-2" />
                  <input type="text" placeholder="Values (comma separated, e.g. Red, Blue, Green)" value={axis.values.join(', ')} onChange={(e) => updateAxisValues(index, e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 outline-none" />
                </div>
                <button onClick={() => removeAxis(index)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
            <div className="flex justify-between items-center">
              <button onClick={handleAddAxis} className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1">
                <Plus className="w-4 h-4" /> Add another option
              </button>
              <button onClick={generateVariants} className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors">
                Generate Matrix
              </button>
            </div>

            {formData.variants.length > 0 && (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-lg">Variant</th>
                      <th className="px-4 py-3">SKU</th>
                      <th className="px-4 py-3">Price</th>
                      <th className="px-4 py-3 rounded-tr-lg">Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.variants.map((v: any, i: number) => (
                      <tr key={v.id} className="border-b border-gray-200 dark:border-gray-700">
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{v.name}</td>
                        <td className="px-4 py-3">
                          <input type="text" value={v.sku} onChange={(e) => {
                            const newV = [...formData.variants];
                            newV[i].sku = e.target.value;
                            updateData({ variants: newV });
                          }} className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900" />
                        </td>
                        <td className="px-4 py-3">
                          <input type="number" value={v.price} onChange={(e) => {
                            const newV = [...formData.variants];
                            newV[i].price = parseFloat(e.target.value) || 0;
                            updateData({ variants: newV });
                          }} className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900" />
                        </td>
                        <td className="px-4 py-3">
                          <input type="number" value={v.stock} onChange={(e) => {
                            const newV = [...formData.variants];
                            newV[i].stock = parseInt(e.target.value, 10) || 0;
                            updateData({ variants: newV });
                          }} className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StepMedia({ formData, updateData }: any) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Product Media</h2>
        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium dark:bg-purple-900/30 dark:text-purple-400 flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          AI Bg-Removal Active
        </span>
      </div>
      
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-8 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer group">
        <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
          <ImageIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
        </div>
        <p className="text-gray-700 dark:text-gray-300 font-medium">Drag & drop your images here</p>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">or click to browse from your computer</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center">
            <ImageIcon className="w-6 h-6 text-gray-300 dark:text-gray-600" />
          </div>
        ))}
      </div>
    </div>
  );
}

function StepPricing({ formData, updateData }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Pricing & Inventory</h2>
      
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Base Price</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-500">$</span>
            <input 
              type="number" 
              value={formData.pricing.basePrice}
              onChange={(e) => updateData({ pricing: { ...formData.pricing, basePrice: parseFloat(e.target.value) || 0 } })}
              className="w-full pl-8 pr-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white" 
              placeholder="0.00" 
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sale Price (Optional)</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-500">$</span>
            <input 
              type="number" 
              value={formData.pricing.salePrice}
              onChange={(e) => updateData({ pricing: { ...formData.pricing, salePrice: parseFloat(e.target.value) || 0 } })}
              className="w-full pl-8 pr-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white" 
              placeholder="0.00" 
            />
          </div>
        </div>
      </div>

      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-green-900 dark:text-green-300">Market Insight</h4>
          <p className="text-green-700 dark:text-green-400 text-sm mt-1">The average price for this category is $1,199. Consider setting your price around $1,150 for maximum competitiveness.</p>
        </div>
      </div>

      {!formData.hasVariants && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stock Quantity</label>
          <input 
            type="number" 
            value={formData.inventory.stock}
            onChange={(e) => updateData({ inventory: { stock: parseInt(e.target.value, 10) || 0 } })}
            className="w-1/2 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white" 
            placeholder="0" 
          />
        </div>
      )}
      {formData.hasVariants && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Inventory is currently managed via the Variants Matrix.</p>
        </div>
      )}
    </div>
  );
}

function StepShipping({ formData, updateData }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Shipping & Delivery</h2>
      
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Weight (kg)</label>
          <input 
            type="number" 
            value={formData.shipping.weight}
            onChange={(e) => updateData({ shipping: { ...formData.shipping, weight: parseFloat(e.target.value) || 0 } })}
            className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 outline-none text-gray-900 dark:text-white" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Package Dimensions (L x W x H)</label>
          <div className="flex gap-2">
            <input type="number" placeholder="L" value={formData.shipping.length} onChange={(e) => updateData({ shipping: { ...formData.shipping, length: parseFloat(e.target.value) || 0 } })} className="w-full px-2 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 outline-none text-center text-gray-900 dark:text-white" />
            <input type="number" placeholder="W" value={formData.shipping.width} onChange={(e) => updateData({ shipping: { ...formData.shipping, width: parseFloat(e.target.value) || 0 } })} className="w-full px-2 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 outline-none text-center text-gray-900 dark:text-white" />
            <input type="number" placeholder="H" value={formData.shipping.height} onChange={(e) => updateData({ shipping: { ...formData.shipping, height: parseFloat(e.target.value) || 0 } })} className="w-full px-2 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 outline-none text-center text-gray-900 dark:text-white" />
          </div>
        </div>
      </div>

      <div className="pt-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input 
            type="checkbox" 
            checked={formData.shipping.freeShipping}
            onChange={(e) => updateData({ shipping: { ...formData.shipping, freeShipping: e.target.checked } })}
            className="w-5 h-5 rounded text-primary-600 focus:ring-primary-500" 
          />
          <div>
            <span className="block font-medium text-gray-900 dark:text-white">Offer Free Shipping</span>
            <span className="text-sm text-gray-500">Products with free shipping get 40% more visibility</span>
          </div>
        </label>
      </div>
    </div>
  );
}

function StepSEO({ formData, updateData }: any) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">SEO & Visibility</h2>
        <button 
          onClick={() => updateData({ seo: { title: `${formData.title} - Best Price`, description: `Buy ${formData.title} with the best quality and features. Shop now!` } })}
          className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium dark:bg-blue-900/30 dark:text-blue-400 flex items-center gap-1 hover:bg-blue-200 transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          Auto-Generate with AI
        </button>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SEO Title</label>
          <input 
            type="text" 
            value={formData.seo.title}
            onChange={(e) => updateData({ seo: { ...formData.seo, title: e.target.value } })}
            className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 outline-none text-gray-900 dark:text-white" 
          />
          <p className="text-xs text-gray-500 mt-1">Recommended length: 50-60 characters</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Meta Description</label>
          <textarea 
            rows={3} 
            value={formData.seo.description}
            onChange={(e) => updateData({ seo: { ...formData.seo, description: e.target.value } })}
            className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 outline-none text-gray-900 dark:text-white"
          ></textarea>
        </div>
      </div>

      <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-100 dark:border-orange-800 flex items-start gap-3 mt-6">
        <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-orange-900 dark:text-orange-300">Moderation Review</h4>
          <p className="text-orange-700 dark:text-orange-400 text-sm mt-1">Your product will be reviewed by our AI moderation engine before it goes live. This usually takes less than 2 minutes.</p>
        </div>
      </div>
    </div>
  );
}
