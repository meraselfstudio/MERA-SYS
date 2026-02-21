import React, { useState, useEffect, useRef } from 'react';
import { getProducts } from '../../services/productService';
import { ShoppingCart, Trash2, Plus, Minus, User, CreditCard, Printer, X } from 'lucide-react';
import Receipt from './Receipt';
import { useReactToPrint } from 'react-to-print';
import { useFinance } from '../../context/FinanceContext';

const POSModule = () => {
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [customer, setCustomer] = useState({ name: '', type: 'Booking', payment: 'QRIS' });
    const [loading, setLoading] = useState(true);
    const [showReceiptPreview, setShowReceiptPreview] = useState(false);

    const receiptRef = useRef();

    const { addTransaction } = useFinance();

    const handlePrint = useReactToPrint({
        content: () => receiptRef.current,
        documentTitle: `Receipt-${new Date().getTime()}`,
    });

    const handleConfirmAndPay = () => {
        // 1. Save Transaction to Database FIRST
        addTransaction({
            id: `TRX-${Date.now()}`,
            desc: `${customer.type} - ${customer.name}`,
            amount: total,
            type: 'IN',
            category: customer.type, // 'Booking' or 'OTS'
            method: customer.payment,
            items: cart
        });

        // 2. Trigger Print Dialog
        handlePrint();

        // 3. Clear Cart & Close Modal (with slight delay to allow print to capture)
        setTimeout(() => {
            setCart([]);
            setCustomer({ name: '', type: 'Booking', payment: 'QRIS' });
            setShowReceiptPreview(false);
        }, 500);
    };

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const data = await getProducts();
                setProducts(data);
            } catch (error) {
                console.error("Failed to load products", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    const categories = ['All', ...new Set(products.map(p => p.kategori).filter(Boolean))];

    const filteredProducts = selectedCategory === 'All'
        ? products
        : products.filter(p => p.kategori === selectedCategory);

    const addToCart = (product) => {
        const existingItem = cart.find(item => item.id === product.id);
        if (existingItem) {
            setCart(cart.map(item =>
                item.id === product.id ? { ...item, qty: item.qty + 1 } : item
            ));
        } else {
            setCart([...cart, { ...product, qty: 1 }]);
        }
    };

    const updateQty = (id, delta) => {
        setCart(cart.map(item => {
            if (item.id === id) {
                const newQty = Math.max(1, item.qty + delta);
                return { ...item, qty: newQty };
            }
            return item;
        }));
    };

    const removeFromCart = (id) => {
        setCart(cart.filter(item => item.id !== id));
    };

    const calculateTotal = () => {
        return cart.reduce((total, item) => {
            if (item.tipe_harga === 'bertingkat') {
                if (item.qty === 1) return total + (item.tier_1 || 0);
                if (item.qty === 2) return total + (item.tier_2 || item.tier_1 || 0);
                if (item.qty === 3) return total + (item.tier_3 || item.tier_2 || item.tier_1 || 0);
                if (item.qty > 3) {
                    const baseThree = item.tier_3 || item.tier_2 || item.tier_1 || 0;
                    const extra = (item.qty - 3) * (item.tier_lebih || 0);
                    return total + baseThree + extra;
                }
                return total;
            } else {
                return total + ((item.price || item.harga || 0) * item.qty);
            }
        }, 0);
    };

    const total = calculateTotal();

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(val);
    }

    const handlePay = () => {
        if (cart.length === 0) return;
        if (!customer.name.trim()) return;
        setShowReceiptPreview(true);
    };

    // All required fields must be filled to allow payment
    const canPay = cart.length > 0 && customer.name.trim() !== '' && !!customer.type && !!customer.payment;

    if (loading) return <div className="p-8 text-center text-gray-500">Loading products...</div>;

    return (
        <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-background">
            {/* Left Panel: Products */}
            <div className="flex-1 flex flex-col p-3 lg:p-4 gap-3 lg:gap-4 overflow-hidden bg-surface-950">

                {/* Categories */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 lg:px-5 py-2 rounded-xl text-xs lg:text-sm font-bold whitespace-nowrap transition-all border ${selectedCategory === cat
                                ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                                : 'bg-surface-800 text-gray-400 border-white/10 hover:border-primary/50 hover:text-white'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Product List - Mobile Responsive Grid */}
                <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3 content-start">
                    {filteredProducts.map(product => {
                        let displayPrice = product.price || product.harga;
                        if (product.tipe_harga === 'bertingkat') {
                            displayPrice = product.tier_1;
                        }

                        return (
                            <button
                                key={product.id}
                                onClick={() => addToCart(product)}
                                className="w-full p-3 lg:p-4 rounded-xl transition-all border border-white/10 hover:border-primary group flex items-center justify-between text-left"
                                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)', boxShadow: '0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07)' }}
                            >
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white text-sm lg:text-base">{product.name || product.nama}</h3>
                                    <div className="font-bold text-gray-900 dark:text-white text-xs lg:text-sm mt-1">
                                        {formatCurrency(displayPrice)}
                                        {product.tipe_harga === 'bertingkat' && <span className="text-[10px] lg:text-xs font-normal text-gray-400 ml-1">+tier</span>}
                                    </div>
                                </div>
                                <div className="h-7 w-7 lg:h-8 lg:w-8 rounded-full bg-surface-900 flex items-center justify-center text-gray-400 group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
                                    <Plus size={16} />
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Right Panel: Cart - 50vh on Mobile, Full height on Desktop */}
            <div className="w-full lg:w-96 h-[50vh] lg:h-full flex flex-col border-t lg:border-t-0 lg:border-l border-white/10 z-10 shrink-0" style={{ background: 'rgba(15,2,3,0.95)', boxShadow: '-4px 0 24px rgba(0,0,0,0.5)' }}>
                <div className="p-3 lg:p-4 border-b border-white/10 flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <h2 className="font-bold text-base lg:text-lg flex items-center gap-2 text-gray-900 dark:text-white">
                        <ShoppingCart size={18} className="text-primary" />
                        Order
                    </h2>
                    <span className="text-[10px] lg:text-xs font-bold bg-primary/10 text-primary px-2 py-1 rounded-full">{cart.reduce((acc, item) => acc + item.qty, 0)} items</span>
                </div>

                <div className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-3 lg:space-y-4">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <ShoppingCart size={40} className="mb-2 opacity-20" />
                            <p className="font-medium text-xs lg:text-sm">Cart is empty</p>
                        </div>
                    ) : (
                        cart.map(item => {
                            let itemTotal = 0;
                            let singlePriceDisplay = 0;

                            if (item.tipe_harga === 'bertingkat') {
                                if (item.qty === 1) itemTotal = item.tier_1 || 0;
                                else if (item.qty === 2) itemTotal = item.tier_2 || item.tier_1 || 0;
                                else if (item.qty === 3) itemTotal = item.tier_3 || item.tier_2 || item.tier_1 || 0;
                                else {
                                    const baseThree = item.tier_3 || item.tier_2 || item.tier_1 || 0;
                                    const extra = (item.qty - 3) * (item.tier_lebih || 0);
                                    itemTotal = baseThree + extra;
                                }
                                singlePriceDisplay = itemTotal / item.qty;
                            } else {
                                singlePriceDisplay = item.price || item.harga || 0;
                                itemTotal = singlePriceDisplay * item.qty;
                            }

                            return (
                                <div key={item.id} className="flex flex-col gap-2 p-2.5 lg:p-3 rounded-xl border border-white/10" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)' }}>
                                    <div className="flex justify-between items-start">
                                        <span className="text-xs lg:text-sm font-bold text-gray-900 dark:text-white w-3/4 line-clamp-2">{item.name || item.nama}</span>
                                        <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center bg-surface-900 rounded-lg shadow-sm border border-white/10">
                                            <button onClick={() => updateQty(item.id, -1)} className="p-1.5 hover:bg-surface-700 text-gray-400 rounded-l-lg"><Minus size={12} /></button>
                                            <span className="px-2 text-xs lg:text-sm font-bold w-6 text-center text-gray-900 dark:text-white">{item.qty}</span>
                                            <button onClick={() => updateQty(item.id, 1)} className="p-1.5 hover:bg-surface-700 text-gray-400 rounded-r-lg"><Plus size={12} /></button>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-xs lg:text-sm text-gray-900 dark:text-white">{formatCurrency(itemTotal)}</div>
                                            <div className="text-[9px] lg:text-[10px] text-gray-500">@{formatCurrency(singlePriceDisplay)} {item.tipe_harga === 'bertingkat' && 'avg'}</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Bottom Checkout Section */}
                <div className="p-3 bg-surface-900 border-t border-white/10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.2)]">
                    <div className="mb-1 space-y-2">
                        <div className="flex items-center gap-2 bg-surface-800 rounded-lg border border-white/10 px-3 py-2">
                            <User size={16} className="text-gray-400" />
                            <input
                                type="text"
                                placeholder="Customer Name"
                                className="bg-transparent flex-1 text-xs lg:text-sm outline-none text-gray-900 dark:text-white placeholder-gray-500 font-medium"
                                value={customer.name}
                                onChange={e => setCustomer({ ...customer, name: e.target.value })}
                            />
                        </div>

                        <div className="flex gap-1.5">
                            {['Booking', 'OTS'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setCustomer({ ...customer, type })}
                                    className={`flex-1 px-2 py-1.5 rounded-lg text-[10px] lg:text-xs font-bold transition-all border ${customer.type === type
                                        ? 'bg-primary text-white border-primary shadow-sm'
                                        : 'bg-surface-800 text-gray-400 border-white/10 hover:text-white'
                                        }`}
                                >
                                    {type}
                                </button>
                            ))}
                            {['QRIS', 'CASH'].map(method => (
                                <button
                                    key={method}
                                    onClick={() => setCustomer({ ...customer, payment: method })}
                                    className={`flex-1 px-2 py-1.5 rounded-lg text-[10px] lg:text-xs font-bold transition-all border ${customer.payment === method
                                        ? method === 'QRIS'
                                            ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                                            : 'border-green-500 bg-green-500/10 text-green-400'
                                        : 'bg-surface-800 border-white/10 text-gray-400 hover:text-white'
                                        }`}
                                >
                                    {method}
                                </button>
                            ))}
                        </div>

                        <div className="flex justify-between items-center text-lg lg:text-2xl font-black text-gray-900 dark:text-white px-2 py-2">
                            <span>Total</span>
                            <span>{formatCurrency(total)}</span>
                        </div>

                        <button
                            onClick={handlePay}
                            disabled={!canPay}
                            className={`w-full py-3 lg:py-4 rounded-xl font-bold text-white text-sm lg:text-base shadow-lg transition-all flex items-center justify-center gap-2 transform active:scale-95 ${canPay
                                ? 'bg-primary hover:bg-primary-dark shadow-primary/20 cursor-pointer'
                                : 'bg-surface-700 opacity-50 cursor-not-allowed'
                                }`}
                        >
                            <CreditCard size={18} />
                            {!customer.name.trim() ? 'Enter Customer' : !cart.length ? 'Add Items' : 'Pay Now'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Receipt Preview Modal - Ditarik keluar dari hirarki panel agar Z-Index Mutlak */}
            {showReceiptPreview && (
                <div className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-lg text-gray-900">Receipt Preview</h3>
                            <button onClick={() => setShowReceiptPreview(false)} className="p-1 hover:bg-gray-200 rounded-full text-gray-500">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 bg-gray-100 flex justify-center">
                            <div className="shadow-lg">
                                <Receipt
                                    ref={receiptRef}
                                    cart={cart}
                                    total={total}
                                    subtotal={total}
                                    paymentMethod={customer.payment}
                                    customer={customer}
                                />
                            </div>
                        </div>

                        <div className="p-4 border-t bg-white flex gap-3">
                            <button
                                onClick={() => setShowReceiptPreview(false)}
                                className="flex-1 py-3 rounded-xl font-bold text-gray-400 border border-white/10 hover:bg-surface-800 hover:text-gray-900 dark:text-white transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmAndPay}
                                className="flex-1 py-3 rounded-xl font-bold text-white bg-primary hover:bg-primary-dark flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                            >
                                <Printer size={18} />
                                Pay & Print
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default POSModule;