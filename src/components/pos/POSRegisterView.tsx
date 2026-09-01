import React, { useState } from 'react';
import { useSchool } from '../../contexts/SchoolContext';
import { StoreItem, PaymentMethod, POSReceipt, Student } from '../../types';
import { 
  ShoppingCart, 
  Search, 
  Trash2, 
  Plus, 
  Minus, 
  Printer, 
  CheckCircle2, 
  CreditCard, 
  DollarSign, 
  Smartphone, 
  User, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { formatGHS, formatDate } from '../../utils/formatting';
import { GhanaFlagBadge } from '../common/EmptyState';

export const POSRegisterView: React.FC = () => {
  const { storeItems, students, processPOSSale, school } = useSchool();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Cart state
  const [cart, setCart] = useState<Array<{ item: StoreItem; quantity: number }>>([]);
  const [customerName, setCustomerName] = useState('Walk-in Parent / Guardian');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mtn_momo');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  
  // Receipt modal
  const [activeReceipt, setActiveReceipt] = useState<POSReceipt | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const categories = [
    { id: 'all', label: 'All Items' },
    { id: 'uniforms', label: 'Uniforms & PE' },
    { id: 'books', label: 'Books' },
    { id: 'stationery', label: 'Stationery' },
    { id: 'accessories', label: 'Crests & Badges' },
  ];

  const filteredItems = storeItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const addToCart = (item: StoreItem) => {
    if (item.currentStock <= 0) {
      alert(`Sorry, ${item.name} is currently out of stock.`);
      return;
    }

    setCart(prev => {
      const existing = prev.find(c => c.item.id === item.id);
      if (existing) {
        if (existing.quantity >= item.currentStock) {
          alert(`Cannot add more than available stock (${item.currentStock} units).`);
          return prev;
        }
        return prev.map(c => c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      } else {
        return [...prev, { item, quantity: 1 }];
      }
    });
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(prev => {
      return prev.map(c => {
        if (c.item.id === itemId) {
          const newQty = c.quantity + delta;
          if (newQty <= 0) return null;
          if (newQty > c.item.currentStock) {
            alert(`Maximum available stock is ${c.item.currentStock}.`);
            return c;
          }
          return { ...c, quantity: newQty };
        }
        return c;
      }).filter(Boolean) as Array<{ item: StoreItem; quantity: number }>;
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(c => c.item.id !== itemId));
  };

  const clearCart = () => setCart([]);

  const subtotal = cart.reduce((acc, c) => acc + (c.item.sellingPrice * c.quantity), 0);
  const totalAmount = subtotal;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);

    const studentObj = students.find(s => s.id === selectedStudentId);

    const receipt = await processPOSSale({
      items: cart.map(c => ({
        itemId: c.item.id,
        itemName: c.item.name,
        unitPrice: c.item.sellingPrice,
        quantity: c.quantity,
        totalPrice: c.item.sellingPrice * c.quantity,
      })),
      totalAmount,
      subtotal,
      paymentMethod,
      customerName: studentObj ? `${studentObj.firstName} ${studentObj.lastName} (Student)` : customerName,
      studentId: studentObj?.id,
      studentName: studentObj ? `${studentObj.firstName} ${studentObj.lastName}` : undefined,
      cashierName: 'School Cashier / Storekeeper',
      status: 'completed',
    });

    setIsProcessing(false);
    setCart([]);
    setActiveReceipt(receipt);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-200">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-teal-600" />
            <span>School POS Cashier Register</span>
          </h2>
          <p className="text-xs text-gray-500">Fast checkout for uniforms, exercise books, stationery & inventory deductions</p>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-teal-800 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-200">
          <GhanaFlagBadge size="sm" />
          <span>Currency: Ghanaian Cedi (GH₵)</span>
        </div>
      </div>

      {/* POS Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT: Product Catalog Selector (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Search & Category Filter */}
          <div className="bg-white rounded-xl border border-gray-200 p-3.5 shadow-xs space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Scan barcode, SKU or search items..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-teal-600 text-white shadow-2xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Product Items Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[560px] overflow-y-auto pr-1">
            {filteredItems.map(item => {
              const inStock = item.currentStock > 0;
              const cartEntry = cart.find(c => c.item.id === item.id);

              return (
                <div
                  key={item.id}
                  onClick={() => inStock && addToCart(item)}
                  className={`bg-white rounded-xl border p-3.5 flex flex-col justify-between gap-3 text-left transition-all ${
                    inStock 
                      ? 'border-gray-200 hover:border-teal-400 hover:shadow-md cursor-pointer active:scale-98' 
                      : 'border-gray-200 opacity-60 bg-gray-50 cursor-not-allowed'
                  } ${cartEntry ? 'ring-2 ring-teal-500 border-teal-500' : ''}`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-gray-400">{item.sku}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                        inStock ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                      }`}>
                        {inStock ? `${item.currentStock} ${item.unit}` : 'Out of stock'}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-gray-900 leading-snug line-clamp-2">
                      {item.name}
                    </h4>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span className="text-sm font-black text-teal-800">
                      {formatGHS(item.sellingPrice)}
                    </span>
                    {cartEntry && (
                      <span className="w-5 h-5 bg-teal-600 text-white font-bold text-xs rounded-full flex items-center justify-center">
                        {cartEntry.quantity}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Active Cart & Checkout Register (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-teal-600" />
              <h3 className="text-sm font-bold text-gray-900">Current Order Cart</h3>
              <span className="text-xs bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded-full">
                {cart.reduce((a, c) => a + c.quantity, 0)} Items
              </span>
            </div>

            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-[11px] font-bold text-red-600 hover:text-red-700 hover:underline"
              >
                Clear Cart
              </button>
            )}
          </div>

          {/* Customer Selection */}
          <div className="space-y-2 text-xs">
            <label className="block font-bold text-gray-700">Customer / Student Link</label>
            <select
              value={selectedStudentId}
              onChange={e => setSelectedStudentId(e.target.value)}
              className="w-full text-xs font-medium border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Walk-in Customer / Parent</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.classroomName})</option>
              ))}
            </select>
          </div>

          {/* Cart Items List */}
          <div className="max-h-56 overflow-y-auto space-y-2 divide-y divide-gray-100 pr-1">
            {cart.length === 0 ? (
              <div className="text-center py-8 text-xs text-gray-400">
                Cart is empty. Click any item on the left to add.
              </div>
            ) : (
              cart.map(line => (
                <div key={line.item.id} className="pt-2 first:pt-0 flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-gray-900 truncate">{line.item.name}</div>
                    <div className="text-[11px] text-gray-500">
                      {formatGHS(line.item.sellingPrice)} each
                    </div>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => updateQuantity(line.item.id, -1)}
                      className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center font-bold"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center font-bold text-gray-900">{line.quantity}</span>
                    <button
                      onClick={() => updateQuantity(line.item.id, 1)}
                      className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center font-bold"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="text-right shrink-0 w-16">
                    <div className="font-bold text-gray-900">
                      {formatGHS(line.item.sellingPrice * line.quantity)}
                    </div>
                  </div>

                  <button
                    onClick={() => removeFromCart(line.item.id)}
                    className="text-gray-400 hover:text-red-600 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-2 pt-3 border-t border-gray-100 text-xs">
            <span className="font-bold text-gray-700 block">Payment Method</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('mtn_momo')}
                className={`p-2 rounded-lg border text-xs font-bold text-center transition-all ${
                  paymentMethod === 'mtn_momo' ? 'border-teal-600 bg-teal-50 text-teal-800' : 'border-gray-200 text-gray-700'
                }`}
              >
                MTN MoMo
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`p-2 rounded-lg border text-xs font-bold text-center transition-all ${
                  paymentMethod === 'cash' ? 'border-teal-600 bg-teal-50 text-teal-800' : 'border-gray-200 text-gray-700'
                }`}
              >
                Cash
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('telecel_cash')}
                className={`p-2 rounded-lg border text-xs font-bold text-center transition-all ${
                  paymentMethod === 'telecel_cash' ? 'border-teal-600 bg-teal-50 text-teal-800' : 'border-gray-200 text-gray-700'
                }`}
              >
                Telecel Cash
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`p-2 rounded-lg border text-xs font-bold text-center transition-all ${
                  paymentMethod === 'card' ? 'border-teal-600 bg-teal-50 text-teal-800' : 'border-gray-200 text-gray-700'
                }`}
              >
                Card / POS
              </button>
            </div>
          </div>

          {/* Cart Total Breakdown */}
          <div className="bg-gray-50 rounded-xl p-3.5 space-y-2 text-xs">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal:</span>
              <span className="font-medium">{formatGHS(subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Tax / VAT:</span>
              <span className="font-medium">GH₵ 0.00 (Exempt)</span>
            </div>
            <div className="flex justify-between text-base font-black text-gray-900 pt-2 border-t border-gray-200">
              <span>TOTAL DUE:</span>
              <span className="text-teal-700">{formatGHS(totalAmount)}</span>
            </div>
          </div>

          {/* Complete Checkout Button */}
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || isProcessing}
            className="w-full py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isProcessing ? 'Processing Sale...' : `Charge ${formatGHS(totalAmount)}`}</span>
          </button>
        </div>
      </div>

      {/* POS THERMAL RECEIPT MODAL */}
      {activeReceipt && (
        <Modal
          isOpen={!!activeReceipt}
          onClose={() => setActiveReceipt(null)}
          title="POS Sales Receipt"
          subtitle={`Receipt #: ${activeReceipt.receiptNumber}`}
          maxWidth="md"
        >
          <div className="space-y-4">
            {/* Thermal styled receipt slip */}
            <div className="bg-white p-5 rounded-lg border border-gray-300 font-mono text-xs text-gray-900 space-y-3 shadow-2xs">
              <div className="text-center border-b border-dashed border-gray-400 pb-3 space-y-0.5">
                <div className="font-bold text-sm uppercase">{school?.name}</div>
                <div className="text-[11px] text-gray-500">Store & Stationery POS Slip</div>
                <div className="text-[10px] text-gray-700 font-bold">Receipt #: {activeReceipt.receiptNumber}</div>
                {(activeReceipt.reference || activeReceipt.transactionReference) && (
                  <div className="text-[9px] text-gray-500 font-mono">Ref: {activeReceipt.reference || activeReceipt.transactionReference}</div>
                )}
                <div className="text-[10px] text-gray-500">{formatDate(activeReceipt.timestamp)}</div>
              </div>

              <div className="text-gray-700 space-y-0.5 text-[11px]">
                <div><b>Customer:</b> {activeReceipt.customerName}</div>
                <div><b>Payment:</b> {activeReceipt.paymentMethod.toUpperCase()}</div>
                <div><b>Cashier:</b> {activeReceipt.cashierName}</div>
              </div>

              {/* Items */}
              <div className="border-t border-b border-dashed border-gray-400 py-2 space-y-1">
                {activeReceipt.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-[11px]">
                    <span className="truncate pr-2">{it.quantity}x {it.itemName}</span>
                    <span className="font-bold shrink-0">{formatGHS(it.totalPrice)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 text-right pt-1 text-sm font-black">
                <div className="flex justify-between">
                  <span>TOTAL:</span>
                  <span className="text-teal-800">{formatGHS(activeReceipt.totalAmount)}</span>
                </div>
              </div>

              <div className="text-center text-[10px] text-gray-500 pt-2 border-t border-dashed border-gray-400">
                Goods sold are not returnable without this receipt. Thank you!
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold text-xs shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Print Thermal Slip</span>
              </button>

              <button
                onClick={() => setActiveReceipt(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
