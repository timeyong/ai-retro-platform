import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import Column from './Column';
import AIPanel from './AIPanel';

// Connect to backend - use env var for production, localhost for dev
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
const socket = io(BACKEND_URL);

// Generate or retrieve unique user ID
const getUserId = () => {
    let userId = localStorage.getItem('retro_user_id');
    if (!userId) {
        userId = 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
        localStorage.setItem('retro_user_id', userId);
    }
    return userId;
};

const userId = getUserId();

const RetroBoard = () => {
    const [items, setItems] = useState([]);
    const [isConnected, setIsConnected] = useState(socket.connected);
    const [aiData, setAiData] = useState(null);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [likedItems, setLikedItems] = useState(new Set());

    useEffect(() => {
        function onConnect() {
            setIsConnected(true);
            // Request user's liked items on connect
            socket.emit('get-user-likes', userId);
        }

        function onDisconnect() {
            setIsConnected(false);
        }

        function onInitialItems(initialItems) {
            setItems(initialItems);
        }

        function onItemAdded(newItem) {
            setItems((prev) => [newItem, ...prev]);
        }

        function onItemLiked(data) {
            const { item, likedBy, unlikedBy } = data;

            // Update item in list
            setItems((prev) => prev.map(i =>
                i.id === item.id ? { ...i, likes: item.likes } : i
            ));

            // Update current user's liked items set
            if (likedBy === userId) {
                setLikedItems(prev => new Set([...prev, item.id]));
            } else if (unlikedBy === userId) {
                setLikedItems(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(item.id);
                    return newSet;
                });
            }
        }

        function onUserLikes(itemIds) {
            setLikedItems(new Set(itemIds));
        }

        function onAiUpdate(data) {
            setAiData(data);
            setIsAiLoading(false);
        }

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('initial-items', onInitialItems);
        socket.on('item-added', onItemAdded);
        socket.on('item-liked', onItemLiked);
        socket.on('user-likes', onUserLikes);
        socket.on('ai-update', onAiUpdate);

        // Request likes if already connected
        if (socket.connected) {
            socket.emit('get-user-likes', userId);
        }

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off('initial-items', onInitialItems);
            socket.off('item-added', onItemAdded);
            socket.off('item-liked', onItemLiked);
            socket.off('user-likes', onUserLikes);
            socket.off('ai-update', onAiUpdate);
        };
    }, []);

    const handleAddItem = (type, content) => {
        if (!content.trim()) return;
        socket.emit('new-item', { type, content });
    };

    const handleLikeItem = (id) => {
        socket.emit('like-item', { itemId: id, userId });
    };

    const handleRefreshAI = () => {
        setIsAiLoading(true);
        socket.emit('trigger-ai');
    };

    const goodItems = items.filter(i => i.type === 'good');
    const badItems = items.filter(i => i.type === 'bad');
    const feedbackItems = items.filter(i => i.type === 'feedback');

    // Determine theme class based on sentiment
    const sentimentTheme = aiData?.sentiment?.overall
        ? `theme-${aiData.sentiment.overall}`
        : 'theme-neutral';

    return (
        <div className={`min-h-screen p-6 lg:p-8 ${sentimentTheme}`}>
            {/* Header */}
            <header className="mb-8 flex justify-between items-center animate-fade-in">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                        AI Day Retrospective
                    </h1>
                    <p className="text-sm font-medium mt-1" style={{ color: 'var(--accent-primary)' }}>
                        Real Time Collab Platform
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="glass-panel rounded-full px-4 py-2 flex items-center gap-2">
                        <div className="relative">
                            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 status-live' : 'bg-rose-500'}`}></div>
                        </div>
                        <span className={`text-xs font-medium tracking-wide ${isConnected ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {isConnected ? 'เชื่อมต่อแล้ว' : 'ออฟไลน์'}
                        </span>
                    </div>
                </div>
            </header>

            {/* AI Panel */}
            <AIPanel
                aiData={aiData}
                isLoading={isAiLoading}
            />

            {/* Columns Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 h-[calc(100vh-300px)] min-h-[400px]">
                <Column
                    title="สิ่งที่ดี"
                    type="good"
                    items={goodItems}
                    onAdd={handleAddItem}
                    onLike={handleLikeItem}
                    likedItems={likedItems}
                />
                <Column
                    title="สิ่งที่ต้องปรับปรุง"
                    type="bad"
                    items={badItems}
                    onAdd={handleAddItem}
                    onLike={handleLikeItem}
                    likedItems={likedItems}
                />
                <Column
                    title="ข้อเสนอแนะ"
                    type="feedback"
                    items={feedbackItems}
                    onAdd={handleAddItem}
                    onLike={handleLikeItem}
                    likedItems={likedItems}
                />
            </div>
        </div>
    );
};

export default RetroBoard;
