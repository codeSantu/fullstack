'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Users, User, Search, Loader2, MessageSquare, PlusCircle } from 'lucide-react';
import { getSocket, disconnectSocket } from '@/lib/socket';
import { cn } from '@/lib/utils';

export default function ChatPage() {
    const { user, authHeader } = useAuth();
    const [groups, setGroups] = useState<any[]>([]);
    const [activeGroup, setActiveGroup] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(true);
    const [isNewChatOpen, setIsNewChatOpen] = useState(false);
    const [allMembers, setAllMembers] = useState<any[]>([]);
    const [searchChat, setSearchChat] = useState('');
    const [memberSearchTerm, setMemberSearchTerm] = useState('');
    
    const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
    
    // Helper to strip legacy "Chat with " prefix for display
    const cleanName = (name: string) => name?.replace(/^Chat with\s+/i, '') || '';

    const getSenderName = (msg: any) => {
        if (msg.sender?.name) return msg.sender.name;
        const member = allMembers.find(m => m.userId === msg.senderId);
        if (member?.name) return member.name;
        if (!activeGroup?.isGroup) return cleanName(activeGroup?.name) || 'MEMBER';
        return 'MEMBER';
    };

    const scrollRef = useRef<HTMLDivElement>(null);
    const socketRef = useRef<any>(null);

    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

    useEffect(() => {
        if (!user) return;

        async function fetchGroups() {
            try {
                const res = await fetch(`${apiBase}/chats/user/${user?.id}/groups`, {
                    headers: authHeader
                });
                const data = await res.json();
                setGroups(Array.isArray(data) ? data : []);
                // On mobile, don't auto-set active group if it forces a view switch unexpectedly
                if (Array.isArray(data) && data.length > 0 && !activeGroup) {
                    setActiveGroup(data[0]);
                }
            } catch (err) {
                console.error('Failed to fetch groups', err);
            } finally {
                setLoading(false);
            }
        }
        
        async function fetchAllMembers() {
            try {
                const res = await fetch(`${apiBase}/members`, {
                    headers: authHeader
                });
                const data = await res.json();
                // ONLY show members who have a userId (can actually log in and chat)
                if (Array.isArray(data)) {
                    setAllMembers(data.filter((m: any) => m.userId && m.userId !== user?.id));
                }
            } catch (err) {
                console.error('Failed to fetch members', err);
            }
        }

        fetchGroups();
        fetchAllMembers();

        // Initialize Socket
        const socket = getSocket();
        socketRef.current = socket;

        socket.on('msgToClient', (message: any) => {
            setMessages((prev) => {
                if (prev.find(m => m.id === message.id)) return prev;
                // Double check activeGroup?.id is valid and not "undefined"
                if (activeGroup?.id && message.groupId === activeGroup.id) {
                    return [...prev, message];
                }
                return prev;
            });
            // Update group list preview
            setGroups(prev => prev.map(g => 
                g.id === message.groupId ? { ...g, lastMessage: message } : g
            ));
        });

        return () => {
            disconnectSocket();
        };
    }, [user, activeGroup?.id]);

    useEffect(() => {
        if (activeGroup?.id && activeGroup.id !== 'undefined') {
            fetchMessages(activeGroup.id);
            socketRef.current?.emit('joinRoom', activeGroup.id);
        }
    }, [activeGroup?.id]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages]);

    async function fetchMessages(groupId: string) {
        if (!groupId || groupId === 'undefined') return;
        try {
            const res = await fetch(`${apiBase}/chats/groups/${groupId}/messages`, {
                headers: authHeader
            });
            const data = await res.json();
            setMessages(Array.isArray(data) ? data.reverse() : []);
        } catch (err) {
            console.error('Failed to fetch messages', err);
        }
    }

    async function handleSendMessage() {
        if (!inputValue.trim() || !activeGroup?.id || activeGroup.id === 'undefined' || !user) return;

        const payload = {
            senderId: user.id,
            groupId: activeGroup.id,
            content: inputValue,
        };

        // Emit via socket
        socketRef.current?.emit('msgToServer', payload);
        setInputValue('');
    }

    const startPrivateChat = async (targetMember: any) => {
        if (!targetMember.userId) {
            alert('This member does not have a user account yet.');
            return;
        }

        try {
            // Check if chat already exists
            const existing = groups.find(g => !g.isGroup && g.members?.some((m: any) => m.id === targetMember.userId));
            if (existing) {
                setActiveGroup(existing);
                setMobileView('chat');
                setIsNewChatOpen(false);
                return;
            }

            const res = await fetch(`${apiBase}/chats/groups`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeader
                },
                body: JSON.stringify({
                    organizationId: user?.organizationId,
                    isGroup: false,
                    memberIds: [user?.id, targetMember.userId], // Use USER ID, not Member ID
                    name: targetMember.name
                })
            });
            
            if (!res.ok) throw new Error('Failed to create chat');
            
            const newGroup = await res.json();
            if (newGroup && newGroup.id) {
                setGroups(prev => [newGroup, ...prev]);
                setActiveGroup(newGroup);
                setMobileView('chat');
                setIsNewChatOpen(false);
            }
        } catch (err) {
            console.error('Failed to start chat', err);
            alert('চ্যাট শুরু করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।');
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
    );

    const filteredGroups = groups.filter(g => 
        (g.name || '').toLowerCase().includes(searchChat.toLowerCase())
    );

    const filteredMembersForChat = allMembers.filter(m => 
        m.name?.toLowerCase().includes(memberSearchTerm.toLowerCase())
    );

    return (
        <div className="flex h-[calc(100dvh-64px)] lg:h-[calc(100vh-32px)] mt-[64px] lg:mt-4 gap-0 lg:gap-4 p-0 lg:px-4 lg:pb-4 relative w-full overflow-hidden">
            {/* Sidebar / Contact List */}
            <Card className={cn(
                "w-full lg:w-80 flex flex-col glass-card border-white/20 shadow-[0_0_20px_rgba(0,245,255,0.1)] overflow-hidden text-neutral-200 !rounded-none lg:!rounded-xl",
                mobileView === 'chat' ? 'hidden lg:flex' : 'flex'
            )}>
                <CardHeader className="p-4 border-b-0 space-y-5 rounded-none">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-xl font-bold text-white flex items-center gap-3">
                             <MessageSquare className="w-6 h-6" /> চ্যাট
                        </h2>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setIsNewChatOpen(true)}
                            className="rounded-full hover:bg-white/10 h-8 w-8 text-white border border-white/20"
                            title="নতুন চ্যাট"
                        >
                            <PlusCircle className="w-4 h-4" />
                        </Button>
                    </div>
                    <div className="relative px-2">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                        <Input 
                            value={searchChat}
                            onChange={(e) => setSearchChat(e.target.value)}
                            placeholder="খুঁজুন..." 
                            className="pl-12 premium-input bg-transparent border-white/10 text-white h-11 text-sm rounded-[20px] focus:border-white/30 focus:shadow-none transition-colors" 
                        />
                    </div>
                    <div className="mx-2 mt-4 border-b border-white/10"></div>
                </CardHeader>
                <CardContent className="p-0 flex-1 overflow-y-auto custom-scrollbar">
                    <div className="p-0 pt-0">
                        {filteredGroups.length === 0 && (
                            <p className="text-center text-white/50 py-10 text-sm">কোন চ্যাট পাওয়া যায়নি</p>
                        )}
                        {filteredGroups.map((group) => (
                            <div 
                                key={group.id} 
                                onClick={() => {
                                    setActiveGroup(group);
                                    setMobileView('chat');
                                }}
                                className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-all duration-300 group ${
                                    activeGroup?.id === group.id 
                                    ? 'bg-white/10 shadow-[inset_4px_0_0_0_rgba(0,245,255,1),_0_0_15px_rgba(0,245,255,0.2)]' 
                                    : 'bg-transparent hover:bg-white/5 hover:shadow-[0_0_10px_rgba(255,255,255,0.05)]'
                                } border-b border-white/5 last:border-b-0 backdrop-blur-sm`}
                            >
                                <div className="w-10 h-10 flex-shrink-0 rounded-full bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center text-white font-bold text-base group-hover:border-[var(--neon-blue)] group-hover:shadow-[0_0_10px_rgba(0,245,255,0.5)] transition-all shadow-inner">
                                    {group.isGroup ? <Users className="w-5 h-5 opacity-90" /> : (group.name?.[0] || <User className="w-5 h-5 opacity-90" />)}
                                </div>
                                <div className="flex-1 min-w-0 pr-1">
                                    <div className="flex justify-between items-baseline mb-0">
                                        <p className="text-[15px] font-semibold truncate text-white/95">{cleanName(group.name) || (group.isGroup ? 'Unnamed Group' : 'Private Chat')}</p>
                                        <span className="text-[10px] text-[var(--neon-green)] whitespace-nowrap ml-2 font-medium drop-shadow-[0_0_5px_rgba(0,255,136,0.3)]">
                                            {group.lastMessage?.createdAt ? new Date(group.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                        </span>
                                    </div>
                                    <p className="text-[12px] text-white/60 truncate leading-tight">
                                        {group.lastMessage?.content || 'কথোপকথন শুরু করুন...'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Main Chat Area */}
            <Card className={cn(
                "flex-1 flex flex-col glass-card overflow-hidden text-neutral-200 !rounded-none lg:!rounded-xl border-0 lg:border-white/10",
                mobileView === 'list' ? 'hidden lg:flex' : 'flex'
            )}>
                <CardHeader className="p-4 border-b border-white/10 flex flex-row items-center justify-between text-white bg-transparent rounded-none">
                    <div className="flex items-center gap-3 sm:gap-4 w-full">
                         <div 
                            onClick={() => setMobileView('list')}
                            className="lg:hidden cursor-pointer flex-shrink-0"
                         >
                            <span className="text-2xl text-white/80 hover:text-white transition-colors">←</span>
                         </div>
                         <div className="w-11 h-11 rounded-full bg-white/5 border border-white/10 flex flex-shrink-0 items-center justify-center text-white/80 text-xl font-medium">
                             {activeGroup?.isGroup ? <Users className="w-5 h-5" /> : (cleanName(activeGroup?.name)?.[0] || <User className="w-5 h-5" />)}
                         </div>
                         <div className="min-w-0 flex flex-col justify-center flex-1">
                            <CardTitle className="text-base sm:text-lg font-black uppercase tracking-widest truncate text-white" title={cleanName(activeGroup?.name)}>{cleanName(activeGroup?.name) || 'চ্যাট'}</CardTitle>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="w-2 h-2 flex-shrink-0 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                                <p className="text-[12px] text-white/50 font-medium tracking-wide truncate">{activeGroup?.isGroup ? `${activeGroup.members?.length || 0} জন মেম্বার` : 'সরাসরি মেসেজ'}</p>
                            </div>
                         </div>
                    </div>
                </CardHeader>
                <CardContent 
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 custom-scrollbar bg-transparent"
                >
                    {messages.map((msg, i) => {
                        const isMe = msg.senderId === user?.id;
                        const prevMsg = i > 0 ? messages[i-1] : null;
                        const isSameSender = prevMsg?.senderId === msg.senderId;

                        return (
                            <div key={msg.id || i} className={`flex flex-col ${isMe ? 'items-end ml-auto' : 'items-start'} max-w-[85%] sm:max-w-[75%] ${isSameSender ? 'mt-1' : 'mt-3'}`}>
                                {!isMe && !isSameSender && activeGroup?.isGroup && (
                                    <span className="text-[10px] text-[var(--neon-green)] font-bold uppercase tracking-widest px-1 mb-0.5 drop-shadow-[0_0_5px_rgba(0,255,136,0.3)]">
                                        {getSenderName(msg)}
                                    </span>
                                )}
                                <div className={cn(
                                    "px-3.5 py-2 sm:px-4 sm:py-2.5 text-[14px] transition-all relative group break-words min-w-[60px]",
                                    isMe 
                                        ? "rounded-[18px] rounded-tr-[3px] bg-gradient-to-br from-[#00f5ff]/10 to-[#bf00ff]/10 border border-[#00f5ff]/30 shadow-[0_0_10px_rgba(0,245,255,0.2),inset_0_0_10px_rgba(0,245,255,0.1)] text-white backdrop-blur-md" 
                                        : "rounded-[18px] rounded-tl-[3px] bg-white/5 border border-white/10 shadow-[0_0_10px_rgba(255,255,255,0.02),inset_0_0_10px_rgba(255,255,255,0.02)] text-white/95 backdrop-blur-md hover:border-white/20"
                                )}>
                                    <p className="leading-snug">{msg.content}</p>
                                </div>
                                <span className={cn(
                                    "text-[9px] text-[#00f5ff]/60 font-medium tracking-wide mt-1",
                                    isMe ? "mr-1 text-right" : "ml-2"
                                )}>
                                    {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'সবে মাত্র'}
                                </span>
                            </div>
                        );
                    })}
                    {messages.length === 0 && !loading && (
                        <div className="flex flex-col items-center justify-center h-full text-white/30 space-y-3">
                             <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center animate-pulse border border-white/10 shadow-[inset_0_0_10px_rgba(255,255,255,0.05)]">
                                <MessageSquare className="w-5 h-5 opacity-40" />
                             </div>
                             <p className="text-[10px] font-medium tracking-widest uppercase">কথোপকথন শুরু করুন</p>
                        </div>
                    )}
                </CardContent>
                <div className="p-3 lg:p-4 bg-transparent pb-4 sm:pb-6 flex items-center justify-center">
                    <form 
                        onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                        className="flex gap-2 sm:gap-4 items-center w-full max-w-4xl px-1 sm:px-2"
                    >
                        <div className="flex-1 relative">
                            <Input 
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="মেসেজ লিখুন..." 
                                className="w-full bg-[#111116] border border-white/10 text-white/90 h-11 sm:h-13 rounded-full text-sm sm:text-[15px] px-4 sm:px-6 transition-all shadow-[inset_0_2px_15px_rgba(0,0,0,0.5)] placeholder:text-white/40 font-medium tracking-wide focus-visible:ring-1 focus-visible:ring-white/20 focus-visible:border-white/20" 
                            />
                        </div>
                        <Button 
                            type="submit" 
                            size="icon" 
                            variant="ghost"
                            disabled={!inputValue.trim()}
                            className="h-11 w-11 sm:h-12 sm:w-12 rounded-full bg-transparent hover:bg-white/5 transition-all active:scale-95 disabled:opacity-30 disabled:scale-100 p-0 text-white/70 hover:text-white flex-shrink-0"
                        >
                            <Send className="h-5 w-5 sm:h-6 sm:w-6 transform -rotate-45" strokeWidth={1.5} />
                        </Button>
                    </form>
                </div>
            </Card>

            {/* New Chat Modal */}
            {isNewChatOpen && (
                <div className="fixed lg:absolute inset-0 z-[1100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <Card className="w-full max-w-md glass-card border-primary/20 shadow-2xl overflow-hidden scale-100 animate-popover">
                        <CardHeader className="p-4 border-b border-white/10 flex flex-row items-center justify-between bg-primary/10">
                            <CardTitle className="text-base font-black text-white flex items-center gap-2">
                                <PlusCircle className="w-5 h-5 text-primary" /> চ্যাট শুরু করুন
                            </CardTitle>
                            <Button variant="ghost" size="icon" onClick={() => setIsNewChatOpen(false)} className="text-white/60 hover:text-white">
                                <span className="text-xl">×</span>
                            </Button>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                             <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                                <Input 
                                    placeholder="মেম্বার খুঁজুন..." 
                                    className="pl-9 premium-input bg-white/5 border-white/10 h-10 text-sm" 
                                    value={memberSearchTerm}
                                    onChange={(e) => setMemberSearchTerm(e.target.value)}
                                    autoFocus
                                />
                             </div>
                             <div className="max-h-64 sm:max-h-80 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                                 {filteredMembersForChat.map(member => (
                                     <div 
                                        key={member.id} 
                                        onClick={() => startPrivateChat(member)}
                                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-primary/20 border border-transparent hover:border-primary/30 cursor-pointer transition-all"
                                     >
                                         <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                                             {member.name?.[0] || 'M'}
                                         </div>
                                         <div className="flex-1">
                                             <p className="text-sm font-bold text-white">{member.name}</p>
                                             <p className="text-[10px] text-white/50">{member.designation || 'Member'}</p>
                                         </div>
                                     </div>
                                 ))}
                                 {filteredMembersForChat.length === 0 && (
                                     <p className="text-center text-white/40 py-10 text-xs">কোন মেম্বার পাওয়া যায়নি</p>
                                 )}
                             </div>
                             <Button 
                                variant="outline" 
                                className="w-full border-white/10 text-white hover:bg-white/5 mt-4"
                                onClick={() => setIsNewChatOpen(false)}
                            >
                                বাতিল
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
