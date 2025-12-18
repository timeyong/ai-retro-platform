import React from 'react';
import { ThumbsUp } from 'lucide-react';

const ItemCard = ({ item, onLike, accentColor, isLiked }) => {
    return (
        <div className="group relative glass-card p-4 rounded-xl">
            {/* Accent line */}
            <div
                className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full"
                style={{ background: accentColor }}
            />

            {/* Content */}
            <p className="text-slate-700 text-sm leading-relaxed pl-3 pr-16">
                {item.content}
            </p>

            {/* Like button */}
            <button
                onClick={() => onLike(item.id)}
                className={`absolute top-2 right-2 z-10 flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-all ${isLiked
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50 opacity-0 group-hover:opacity-100'
                    }`}
                title={isLiked ? "ยกเลิกถูกใจ" : "ถูกใจ"}
            >
                <ThumbsUp size={14} className={isLiked ? 'fill-current' : ''} />
                {item.likes > 0 && (
                    <span className="text-xs font-medium">{item.likes}</span>
                )}
            </button>

            {/* Show likes count when not hovering (if has likes and not liked by user) */}
            {item.likes > 0 && !isLiked && (
                <div className="absolute top-3 right-3 flex items-center gap-1 text-slate-400 group-hover:opacity-0 pointer-events-none transition-all">
                    <ThumbsUp size={12} />
                    <span className="text-xs font-medium">{item.likes}</span>
                </div>
            )}

            {/* Timestamp */}
            <div className="mt-3 pl-3">
                <span className="text-[10px] text-slate-400 font-mono tracking-wide">
                    {new Date(item.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </span>
            </div>
        </div>
    );
};

export default ItemCard;
