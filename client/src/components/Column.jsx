import React, { useState, useEffect } from 'react';
import { Plus, TrendingUp, AlertTriangle, MessageCircle, Maximize2, X, Sparkles, ChevronRight } from 'lucide-react';
import ItemCard from './ItemCard';

// First-time tooltip component
const FirstTimeTooltip = ({ onDismiss }) => {
    return (
        <div className="first-time-tooltip animate-fade-in">
            <div className="tooltip-arrow"></div>
            <div className="tooltip-content">
                <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={16} className="text-amber-500" />
                    <span className="font-semibold text-slate-800">ยินดีต้อนรับ! 👋</span>
                </div>
                <p className="text-sm text-slate-600 mb-3">
                    พิมพ์ความคิดเห็นของคุณในช่องด้านล่าง แล้วกด Enter เพื่อส่ง
                </p>
                <ul className="text-xs text-slate-500 space-y-1 mb-3">
                    <li className="flex items-center gap-1.5">
                        <ChevronRight size={12} />
                        <span>สามารถส่งได้หลายครั้ง</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                        <ChevronRight size={12} />
                        <span>กดหัวใจเพื่อ Like ความคิดเห็นที่ชอบ</span>
                    </li>
                </ul>
                <button
                    onClick={onDismiss}
                    className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium hover:from-blue-600 hover:to-blue-700 transition-all"
                >
                    เข้าใจแล้ว!
                </button>
            </div>
        </div>
    );
};

const Column = ({ title, type, items, onAdd, onLike, likedItems }) => {
    const [inputValue, setInputValue] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);
    const [showFirstTimeTooltip, setShowFirstTimeTooltip] = useState(false);

    // Check if first-time user
    useEffect(() => {
        const hasSeenTooltip = localStorage.getItem('retro_seen_tooltip');
        if (!hasSeenTooltip) {
            // Show tooltip after a brief delay for better UX
            const timer = setTimeout(() => {
                setShowFirstTimeTooltip(true);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, []);

    const dismissTooltip = () => {
        setShowFirstTimeTooltip(false);
        localStorage.setItem('retro_seen_tooltip', 'true');
    };

    // Sort items by likes (descending)
    const sortedItems = [...items].sort((a, b) => (b.likes || 0) - (a.likes || 0));

    const handleSubmit = (e) => {
        e.preventDefault();
        if (inputValue.trim()) {
            onAdd(type, inputValue);
            setInputValue('');
        }
    };

    const getColumnConfig = () => {
        switch (type) {
            case 'good':
                return {
                    icon: <TrendingUp size={18} className="text-emerald-600" />,
                    accentColor: '#059669',
                    glassClass: 'glass-column glass-column-good',
                };
            case 'bad':
                return {
                    icon: <AlertTriangle size={18} className="text-rose-600" />,
                    accentColor: '#dc2626',
                    glassClass: 'glass-column glass-column-bad',
                };
            case 'feedback':
            default:
                return {
                    icon: <MessageCircle size={18} className="text-amber-600" />,
                    accentColor: '#d97706',
                    glassClass: 'glass-column glass-column-feedback',
                };
        }
    };

    const config = getColumnConfig();

    const renderContent = (isModal = false) => (
        <>
            {/* Header */}
            <div className="p-4 border-b border-black/5 flex items-center justify-between bg-white/30">
                <div className="flex items-center gap-3">
                    <div
                        className="p-2 rounded-xl"
                        style={{
                            background: `linear-gradient(135deg, ${config.accentColor}15, ${config.accentColor}08)`,
                            border: `1px solid ${config.accentColor}20`
                        }}
                    >
                        {config.icon}
                    </div>
                    <div>
                        <h2 className="font-semibold text-slate-800 text-sm">{title}</h2>
                        <span className="text-[10px] font-mono text-slate-400 tracking-wider">
                            {items.length} รายการ
                        </span>
                    </div>
                </div>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-black/5 transition-all"
                    title={isModal ? "ปิด" : "ขยาย"}
                >
                    {isModal ? <X size={18} /> : <Maximize2 size={16} />}
                </button>
            </div>

            {/* Items List */}
            <div className={`flex-1 p-4 overflow-y-auto space-y-3 ${isModal ? '' : 'min-h-[250px]'}`}>
                {sortedItems.map((item, index) => (
                    <div
                        key={item.id}
                        className="animate-slide-up"
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        <ItemCard
                            item={item}
                            onLike={onLike}
                            accentColor={config.accentColor}
                            isLiked={likedItems?.has(item.id)}
                        />
                    </div>
                ))}
                {items.length === 0 && (
                    <div className="text-center py-12">
                        <div
                            className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-3"
                            style={{
                                background: `${config.accentColor}08`,
                                border: `1px solid ${config.accentColor}15`
                            }}
                        >
                            {config.icon}
                        </div>
                        <p className="text-slate-400 text-sm">ยังไม่มีรายการ</p>
                        <p className="text-slate-300 text-xs mt-1">เพิ่มรายการแรกของคุณด้านล่าง</p>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-black/5 bg-white/30 relative">
                {/* First-time tooltip - only show on the first column (good) */}
                {!isModal && type === 'good' && showFirstTimeTooltip && (
                    <FirstTimeTooltip onDismiss={dismissTooltip} />
                )}
                <form onSubmit={handleSubmit} className="relative">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="พิมพ์แล้วกด Enter..."
                        className="glass-input w-full pl-4 pr-12 py-3 rounded-xl text-sm"
                    />
                    <button
                        type="submit"
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all"
                        style={{
                            background: inputValue.trim() ? config.accentColor : 'rgba(0,0,0,0.05)',
                            color: inputValue.trim() ? 'white' : 'rgba(0,0,0,0.3)'
                        }}
                    >
                        <Plus size={16} />
                    </button>
                </form>
            </div>
        </>
    );

    return (
        <>
            {/* Normal Column View */}
            <div className={`flex flex-col h-full rounded-2xl overflow-hidden animate-scale-in ${config.glassClass}`}>
                {renderContent(false)}
            </div>

            {/* Fullscreen Modal */}
            {isExpanded && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-fade-in"
                    style={{ background: 'rgba(0, 0, 0, 0.3)', backdropFilter: 'blur(8px)' }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setIsExpanded(false);
                    }}
                >
                    <div
                        className={`w-full max-w-3xl h-[85vh] flex flex-col rounded-2xl overflow-hidden animate-scale-in ${config.glassClass}`}
                        style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)', background: 'rgba(255,255,255,0.95)' }}
                    >
                        {renderContent(true)}
                    </div>
                </div>
            )}
        </>
    );
};

export default Column;
