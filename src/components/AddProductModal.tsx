import React, { useState, useEffect } from 'react';
import { X, PackagePlus } from 'lucide-react';
import { Product } from '../types/index.ts';
import { Language, translations } from '../lib/translations.ts';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: Omit<Product, 'id' | 'shopId' | 'updatedAt'>) => void;
  editingProduct: Product | null;
  language: Language;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingProduct,
  language,
}) => {
  const t = translations[language];

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Essentials');
  const [buyingPrice, setBuyingPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [quantity, setQuantity] = useState('10');
  const [lowStockThreshold, setLowStockThreshold] = useState('5');
  const [unit, setUnit] = useState('pcs');

  useEffect(() => {
    if (editingProduct) {
      setName(editingProduct.name);
      setCategory(editingProduct.category);
      setBuyingPrice(editingProduct.buyingPrice.toString());
      setSellingPrice(editingProduct.sellingPrice.toString());
      setQuantity(editingProduct.quantity.toString());
      setLowStockThreshold(editingProduct.lowStockThreshold.toString());
      setUnit(editingProduct.unit);
    } else {
      setName('');
      setCategory('Essentials');
      setBuyingPrice('');
      setSellingPrice('');
      setQuantity('10');
      setLowStockThreshold('5');
      setUnit('pcs');
    }
  }, [editingProduct, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const buy = Number(buyingPrice) || 0;
    const sell = Number(sellingPrice) || 0;
    const qty = Number(quantity) || 0;
    const threshold = Number(lowStockThreshold) || 5;

    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      category: category.trim() || 'General',
      buyingPrice: buy,
      sellingPrice: sell,
      quantity: qty,
      lowStockThreshold: threshold,
      unit: unit || 'pcs',
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-3.5 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-2">
          <h3 className="font-bold text-base flex items-center gap-1.5">
            <PackagePlus className="w-4 h-4 text-emerald-600" />
            <span>{editingProduct ? (language === 'sw' ? 'Hariri Bidhaa' : 'Edit Product') : t.addProduct}</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <label className="block text-xs font-bold mb-1">{t.productName} *</label>
          <input
            type="text"
            required
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Unga Jogoo 2kg"
            className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-bold mb-1">{t.category}</label>
            <input
              type="text"
              value={category}
              onChange={e => setCategory(e.target.value)}
              placeholder="e.g. Unga, Drinks"
              className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">Unit</label>
            <select
              value={unit}
              onChange={e => setUnit(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="pcs">Pcs / Vipande</option>
              <option value="packets">Packets</option>
              <option value="kg">Kilograms (kg)</option>
              <option value="bottles">Bottles</option>
              <option value="loaves">Loaves</option>
              <option value="boxes">Boxes</option>
              <option value="bales">Bales</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-bold mb-1">{t.buyingPrice}</label>
            <input
              type="number"
              step="any"
              required
              value={buyingPrice}
              onChange={e => setBuyingPrice(e.target.value)}
              placeholder="e.g. 175"
              className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">{t.sellingPrice} *</label>
            <input
              type="number"
              step="any"
              required
              value={sellingPrice}
              onChange={e => setSellingPrice(e.target.value)}
              placeholder="e.g. 210"
              className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-emerald-700 dark:text-emerald-400"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-bold mb-1">{t.quantity} *</label>
            <input
              type="number"
              required
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              placeholder="e.g. 24"
              className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">{t.minAlertLevel}</label>
            <input
              type="number"
              required
              value={lowStockThreshold}
              onChange={e => setLowStockThreshold(e.target.value)}
              placeholder="5"
              className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-xs font-bold text-neutral-700 dark:text-neutral-300"
          >
            {t.cancel}
          </button>
          <button
            type="submit"
            className="flex-1 py-2.5 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 shadow-sm"
          >
            {t.save}
          </button>
        </div>
      </form>
    </div>
  );
};
