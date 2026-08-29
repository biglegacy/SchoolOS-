import React, { useState } from 'react';
import { useSchool } from '../../contexts/SchoolContext';
import { StoreItem, ProductCategory } from '../../types';
import { 
  Package, 
  Plus, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  RotateCcw, 
  Tag, 
  Layers, 
  TrendingUp 
} from 'lucide-react';
import { StatCard } from '../common/StatCard';
import { Modal } from '../common/Modal';
import { formatGHS } from '../../utils/formatting';

export const StoreInventoryView: React.FC = () => {
  const { storeItems, addStoreItem, updateStoreStock } = useSchool();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [restockItem, setRestockItem] = useState<StoreItem | null>(null);
  const [restockQuantity, setRestockQuantity] = useState<number>(20);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // New item form state
  const [formData, setFormData] = useState({
    name: '',
    sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
    category: 'uniforms' as ProductCategory,
    description: '',
    costPrice: 40,
    sellingPrice: 75,
    currentStock: 50,
    reorderLevel: 10,
    unit: 'pcs',
  });

  const categories: { id: string; label: string }[] = [
    { id: 'all', label: 'All Categories' },
    { id: 'uniforms', label: 'School Uniforms & PE' },
    { id: 'books', label: 'Textbooks & Workbooks' },
    { id: 'stationery', label: 'Exercise Books & Pens' },
    { id: 'accessories', label: 'Crests, Badges & Belts' },
  ];

  const itemsList = Array.isArray(storeItems) ? storeItems : [];
  const totalInventoryValuation = itemsList.reduce((acc, i) => acc + ((i?.sellingPrice || 0) * (i?.currentStock || 0)), 0);
  const lowStockItems = itemsList.filter(i => (i?.currentStock || 0) <= (i?.reorderLevel || 0));

  const filteredItems = itemsList.filter(i => {
    const matchesSearch = i.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      i.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoryFilter === 'all' || i.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    await addStoreItem({
      name: formData.name,
      sku: formData.sku,
      category: formData.category,
      description: formData.description || undefined,
      costPrice: Number(formData.costPrice),
      sellingPrice: Number(formData.sellingPrice),
      currentStock: Number(formData.currentStock),
      reorderLevel: Number(formData.reorderLevel),
      unit: formData.unit,
      status: 'active',
    });

    setIsAddModalOpen(false);
    setActionSuccess(`Added product ${formData.name} to store catalogue!`);
    setTimeout(() => setActionSuccess(null), 3500);

    setFormData({
      name: '',
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      category: 'uniforms',
      description: '',
      costPrice: 40,
      sellingPrice: 75,
      currentStock: 50,
      reorderLevel: 10,
      unit: 'pcs',
    });
  };

  const handleRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockItem) return;

    await updateStoreStock(restockItem.id, Number(restockQuantity), 'restock', 'Bulk supply delivery');
    setRestockItem(null);
    setActionSuccess(`Restocked +${restockQuantity} units for ${restockItem.name}!`);
    setTimeout(() => setActionSuccess(null), 3500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">School Store & Inventory</h2>
          <p className="text-xs text-gray-500">Track uniforms, books, stationery, crests, and reorder levels</p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {actionSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Store Products"
          value={storeItems.length}
          subtitle="Catalogue Items"
          icon={Package}
          iconBg="bg-teal-50"
          iconColor="text-teal-600"
        />
        <StatCard
          title="Inventory Retail Value"
          value={formatGHS(totalInventoryValuation)}
          subtitle="Stock Valuation in GH₵"
          icon={TrendingUp}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          title="Low Stock Alerts"
          value={lowStockItems.length}
          subtitle={lowStockItems.length > 0 ? "Requires restock" : "All levels healthy"}
          icon={AlertTriangle}
          iconBg={lowStockItems.length > 0 ? "bg-amber-50" : "bg-emerald-50"}
          iconColor={lowStockItems.length > 0 ? "text-amber-600" : "text-emerald-600"}
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search products by title or SKU code..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-3 py-2 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-5 py-3">Product Name & Code</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Cost Price</th>
                <th className="px-4 py-3">Selling Price</th>
                <th className="px-4 py-3">Current Stock</th>
                <th className="px-4 py-3">Stock Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {filteredItems.map(item => {
                const isLow = item.currentStock <= item.reorderLevel;

                return (
                  <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-gray-900 text-sm">{item.name}</div>
                      <div className="text-[11px] text-gray-400 font-mono">{item.sku}</div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="capitalize font-semibold text-gray-800 bg-gray-100 px-2 py-0.5 rounded text-[11px]">
                        {item.category}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 font-medium text-gray-600">
                      {formatGHS(item.costPrice)}
                    </td>

                    <td className="px-4 py-3.5 font-bold text-teal-800">
                      {formatGHS(item.sellingPrice)}
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="font-black text-sm text-gray-900">{item.currentStock}</span>
                      <span className="text-gray-400 text-[11px] ml-1">{item.unit}</span>
                    </td>

                    <td className="px-4 py-3.5">
                      {isLow ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3" /> Low ({item.currentStock} left)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> In Stock
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => {
                          setRestockItem(item);
                          setRestockQuantity(20);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-teal-50 text-gray-700 hover:text-teal-800 rounded-lg text-xs font-bold transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Restock</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* RESTOCK MODAL */}
      {restockItem && (
        <Modal
          isOpen={!!restockItem}
          onClose={() => setRestockItem(null)}
          title="Restock Product Supply"
          subtitle={`Product: ${restockItem.name} (${restockItem.sku})`}
          maxWidth="sm"
        >
          <form onSubmit={handleRestock} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Units to Add *</label>
              <input
                type="number"
                min="1"
                required
                value={restockQuantity}
                onChange={e => setRestockQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm font-bold text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Current Stock: {restockItem.currentStock} {restockItem.unit} → New Total: {restockItem.currentStock + restockQuantity} {restockItem.unit}
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRestockItem(null)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-bold text-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold shadow-xs"
              >
                Confirm Restock
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ADD PRODUCT MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Product to Store"
        subtitle="Record new uniform, textbook, exercise book, or school supply"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateProduct} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Product Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Primary School Day Uniform (Set)"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">SKU / Item Code *</label>
              <input
                type="text"
                required
                value={formData.sku}
                onChange={e => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono font-bold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Category *</label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value as ProductCategory })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
              >
                <option value="uniforms">Uniforms & PE</option>
                <option value="books">Textbooks</option>
                <option value="stationery">Stationery & Notes</option>
                <option value="accessories">Crests & Badges</option>
                <option value="other">Other Supplies</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Cost Price (GH₵) *</label>
              <input
                type="number"
                required
                min="0"
                step="0.1"
                value={formData.costPrice}
                onChange={e => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Selling Price (GH₵) *</label>
              <input
                type="number"
                required
                min="0"
                step="0.1"
                value={formData.sellingPrice}
                onChange={e => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold text-teal-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Initial Stock *</label>
              <input
                type="number"
                required
                min="0"
                value={formData.currentStock}
                onChange={e => setFormData({ ...formData, currentStock: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Reorder Level Alert *</label>
              <input
                type="number"
                required
                min="1"
                value={formData.reorderLevel}
                onChange={e => setFormData({ ...formData, reorderLevel: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Unit of Measure</label>
              <input
                type="text"
                placeholder="pcs, pack, set"
                value={formData.unit}
                onChange={e => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold text-xs rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-lg transition-colors shadow-xs"
            >
              Save Product
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
