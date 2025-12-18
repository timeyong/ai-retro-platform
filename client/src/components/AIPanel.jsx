import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Sparkles, ImageIcon, TrendingUp, AlertOctagon, HelpCircle, Minus } from 'lucide-react';

const AIPanel = ({ aiData, isLoading }) => {
    const hasData = aiData?.summary || aiData?.vibeImage;

    const getSentimentIcon = (sentiment) => {
        switch (sentiment) {
            case 'positive': return <TrendingUp size={14} />;
            case 'negative': return <AlertOctagon size={14} />;
            case 'mixed': return <HelpCircle size={14} />;
            default: return <Minus size={14} />;
        }
    };

    const sentimentLabel = {
        positive: 'Positive',
        negative: 'Negative',
        mixed: 'Mixed',
        neutral: 'Neutral'
    };

    return (
        <div className="glass-panel rounded-2xl p-6 mb-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div
                        className="p-2 rounded-xl"
                        style={{
                            background: 'var(--accent-glow)',
                            border: '1px solid rgba(37, 99, 235, 0.15)'
                        }}
                    >
                        <Sparkles className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                    </div>
                    <div>
                        <h2 className="text-base font-semibold text-slate-800">AI Analytic</h2>
                        <p className="text-xs text-slate-400">Powered By Our Team</p>
                    </div>

                    {aiData?.sentiment && (
                        <span className={`ml-4 sentiment-badge sentiment-${aiData.sentiment.overall}`}>
                            {getSentimentIcon(aiData.sentiment.overall)}
                            <span>{sentimentLabel[aiData.sentiment.overall]}</span>
                            <span className="opacity-60 ml-1">
                                {Math.round(aiData.sentiment.positiveRatio * 100)}%
                            </span>
                        </span>
                    )}
                </div>

                {isLoading && (
                    <span className="text-xs text-slate-400 flex items-center gap-2">
                        <span className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></span>
                        กำลังวิเคราะห์...
                    </span>
                )}
            </div>

            {/* Empty State */}
            {!hasData && !isLoading && (
                <div className="text-center py-10 border border-black/5 rounded-xl bg-white/40">
                    <div
                        className="w-14 h-14 mx-auto rounded-xl flex items-center justify-center mb-4"
                        style={{
                            background: 'var(--accent-glow)',
                            border: '1px solid rgba(37, 99, 235, 0.1)'
                        }}
                    >
                        <Sparkles className="w-7 h-7" style={{ color: 'var(--accent-primary)', opacity: 0.5 }} />
                    </div>
                    <p className="text-slate-500 text-sm font-medium">ผลวิเคราะห์ AI จะปรากฏที่นี่</p>
                    <p className="text-slate-400 text-xs mt-1.5">อัปเดตอัตโนมัติทุก 30 นาที</p>
                </div>
            )}

            {/* Content Grid */}
            {(aiData?.vibeImage || aiData?.summary) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Vibe Image */}
                    {aiData?.vibeImage && (
                        <div className="glass-card rounded-xl overflow-hidden">
                            <div className="flex items-center gap-2 p-3 border-b border-black/5 bg-white/30">
                                <ImageIcon className="w-4 h-4 text-slate-400" />
                                <span className="text-xs font-medium text-slate-500">บรรยากาศทีม</span>
                            </div>
                            <div className="p-3">
                                <img
                                    src={`data:image/png;base64,${aiData.vibeImage}`}
                                    alt="Team Vibe"
                                    className="w-full aspect-video object-cover rounded-lg"
                                />
                            </div>
                        </div>
                    )}

                    {/* Summary */}
                    {aiData?.summary && (
                        <div className="glass-card rounded-xl overflow-hidden">
                            <div className="flex items-center gap-2 p-3 border-b border-black/5 bg-white/30">
                                <Sparkles className="w-4 h-4 text-slate-400" />
                                <span className="text-xs font-medium text-slate-500">สรุป</span>
                            </div>
                            <div className="p-4 prose prose-sm prose-slate max-w-none">
                                <ReactMarkdown
                                    components={{
                                        p: ({ children }) => <p className="text-sm text-slate-600 leading-relaxed mb-3 last:mb-0">{children}</p>,
                                        strong: ({ children }) => <strong className="font-semibold text-slate-700">{children}</strong>,
                                        ul: ({ children }) => <ul className="text-sm text-slate-600 space-y-1.5 list-disc pl-4 mb-3">{children}</ul>,
                                        ol: ({ children }) => <ol className="text-sm text-slate-600 space-y-1.5 list-decimal pl-4 mb-3">{children}</ol>,
                                        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                                        h1: ({ children }) => <h1 className="text-base font-semibold text-slate-800 mb-2">{children}</h1>,
                                        h2: ({ children }) => <h2 className="text-sm font-semibold text-slate-800 mb-2">{children}</h2>,
                                        h3: ({ children }) => <h3 className="text-sm font-medium text-slate-700 mb-1">{children}</h3>,
                                    }}
                                >
                                    {aiData.summary}
                                </ReactMarkdown>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Last Updated */}
            {aiData?.lastUpdated && (
                <p className="text-[10px] text-slate-400 mt-4 text-right font-mono tracking-wide">
                    อัปเดตล่าสุด: {new Date(aiData.lastUpdated).toLocaleString('th-TH')}
                </p>
            )}
        </div>
    );
};

export default AIPanel;
