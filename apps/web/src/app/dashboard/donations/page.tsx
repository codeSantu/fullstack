'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreditCard, Search, CheckCircle2, Clock, User, Filter, MessageSquare, Smartphone } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

export default function DonationsStatusPage() {
    const { user, authHeader } = useAuth();
    const queryClient = useQueryClient();
    const isAdmin = user?.role === 'ADMIN';
    const [searchTerm, setSearchTerm] = useState('');
    const [mounted, setMounted] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isBulkUpdating, setIsBulkUpdating] = useState(false);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [selectedRole, setSelectedRole] = useState<string>('');

    useEffect(() => {
        setMounted(true);
    }, []);

    // Fetch all members with their donation status
    const { data: members, isLoading } = useQuery({
        queryKey: ['members-donations'],
        queryFn: async () => {
            const res = await fetch(`${API}/members`, {
                headers: authHeader
            });
            if (!res.ok) throw new Error('Failed to fetch members');
            return res.json();
        }
    });

    // Auto-select removed as per user request

    const bulkNoticeMutation = useMutation({
        mutationFn: async ({ memberIds }: { memberIds: string[] }) => {
            const res = await fetch(`${API}/members/bulk-notice`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeader
                },
                body: JSON.stringify({ memberIds })
            });
            if (!res.ok) throw new Error('Failed to record notices');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['members-donations'] });
        }
    });

    const broadcastMutation = useMutation({
        mutationFn: async ({ content, recipientIds }: { content: string, recipientIds: string[] }) => {
            const res = await fetch(`${API}/chats/broadcast`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeader
                },
                body: JSON.stringify({
                    content,
                    senderId: user?.id,
                    organizationId: user?.organizationId || 'default',
                    recipientIds
                })
            });
            if (!res.ok) throw new Error('Failed to send broadcast');
            return res.json();
        },
        onSuccess: (_, variables) => {
            alert('সফলভাবে মেসেজ পাঠানো হয়েছে।');
            setSelectedIds([]);
            
            // Re-find the member IDs corresponding to the requested user IDs to track notice sent
            const sentMemberIds = members
                ?.filter((m: any) => variables.recipientIds.includes(m.userId))
                ?.map((m: any) => m.id);
            
            if (sentMemberIds && sentMemberIds.length > 0) {
                bulkNoticeMutation.mutate({ memberIds: sentMemberIds });
            }
        }
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ memberId, status }: { memberId: string, status: string }) => {
            const res = await fetch(`${API}/members/${memberId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeader
                },
                body: JSON.stringify({ fixedDonationStatus: status })
            });
            if (!res.ok) throw new Error('Failed to update status');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['members-donations'] });
        }
    });

    const bulkUpdateMutation = useMutation({
        mutationFn: async ({ memberIds, status }: { memberIds: string[], status: string }) => {
            const res = await fetch(`${API}/members/bulk-donation-status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeader
                },
                body: JSON.stringify({ memberIds, status })
            });
            if (!res.ok) throw new Error('Failed to bulk update');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['members-donations'] });
            setSelectedIds([]);
            setIsBulkUpdating(false);
        }
    });

    const toggleStatus = (member: any) => {
        if (!isAdmin) return;
        const nextStatus = member.fixedDonationStatus === 'SUCCESS' ? 'PENDING' : 'SUCCESS';
        updateStatusMutation.mutate({ memberId: member.id, status: nextStatus });
    };

    const toggleSelection = (id: string) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredMembers.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredMembers.map((m: any) => m.id));
        }
    };

    const filteredMembers = members?.filter((m: any) => {
        const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.phone?.includes(searchTerm);
        const memberRole = m.designation || 'সাধারণ সদস্য';
        const isGeneralRole = selectedRole === 'সদস্যবৃন্দ' || selectedRole === 'সাধারণ সদস্য';
        const matchesRole = selectedRole 
            ? (isGeneralRole ? (memberRole === 'সদস্যবৃন্দ' || memberRole === 'সাধারণ সদস্য') : memberRole === selectedRole) 
            : true;
        return matchesSearch && matchesRole;
    }).sort((a: any, b: any) => {
        const comparison = a.name.localeCompare(b.name, 'bn-IN');
        return sortOrder === 'asc' ? comparison : -comparison;
    }) || [];

    const rawRoles = members?.map((m: any) => m.designation).filter(Boolean) || [];
    const availableRoles = Array.from(new Set([...rawRoles, 'সাধারণ সদস্য'])).sort() as string[];

    const handleBulkWhatsApp = () => {
        const selectedMembers = members?.filter((m: any) => selectedIds.includes(m.id)) || [];
        const pendingMembers = selectedMembers.filter((m: any) => m.fixedDonationStatus !== 'SUCCESS');
        
        if (pendingMembers.length === 0) {
            alert('নির্বাচিত সদস্যদের মধ্যে কারো পেমেন্ট বাকি নেই।');
            return;
        }

        if (confirm(`${pendingMembers.length} জন সদস্যের জন্য WhatsApp রিমাইন্ডার উইন্ডো খোলা হবে। আপনার ব্রাউজার পপ-আপ ব্লক করলে দয়া করে তা Allow করুন। চালিয়ে যেতে চান?`)) {
            pendingMembers.forEach((member: any, index: number) => {
                if (!member.phone) return;
                
                const message = `নমস্কার ${member.name}, আপনার ২০২৬ শ্রী শ্রী বাসন্তী দুর্গাপূজার ২,০০০ টাকা দানটি এখনো বাকি দেখাচ্ছে। দয়া করে শীঘ্রই জমা দেওয়ার অনুরোধ রইল। ধন্যবাদ।`;
                const encodedMsg = encodeURIComponent(message);
                const phone = member.phone.replace(/\D/g, '');
                const formattedPhone = phone.startsWith('91') ? phone : `91${phone}`;
                
                setTimeout(() => {
                    window.open(`https://wa.me/${formattedPhone}?text=${encodedMsg}`, '_blank');
                }, index * 1200);
            });
            
            bulkNoticeMutation.mutate({ memberIds: pendingMembers.map((m: any) => m.id) });
        }
    };

    const handleBulkInternalChat = () => {
        const selectedRecipients = members
            ?.filter((m: any) => selectedIds.includes(m.id) && m.userId)
            .map((m: any) => m.userId);

        if (!selectedRecipients || selectedRecipients.length === 0) {
            alert('নির্বাচিত সদস্যদের মধ্যে কারো ইউজার অ্যাকাউন্ট পাওয়া যায়নি।');
            return;
        }

        const content = prompt(`${selectedRecipients.length} জন সদস্যকে পাঠাতে আপনার মেসেজ লিখুন:`, 'নমস্কার, আপনার ২০২৬ বাসন্তী দুর্গাপূজার দানটি শীঘ্রই দেওয়ার অনুরোধ জানানো হচ্ছে।');
        
        if (content && content.trim()) {
            broadcastMutation.mutate({ content, recipientIds: selectedRecipients });
        }
    };

    if (!mounted || isLoading) return <div className="p-12 text-center text-neutral-500">লোড হচ্ছে...</div>;

    const totalMembers = members?.length || 0;
    const paidMembers = members?.filter((m: any) => m.fixedDonationStatus === 'SUCCESS').length || 0;
    const pendingMembers = totalMembers - paidMembers;
    const totalAmount = totalMembers * 2000;
    const collectedAmount = paidMembers * 2000;

    const currentMemberRecord = members?.find((m: any) => m.userId === user?.id);
    const hasPendingNotice = currentMemberRecord?.fixedDonationStatus !== 'SUCCESS' && currentMemberRecord?.noticeSentCount > 0;

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-8 space-y-8 pb-24">
            {hasPendingNotice && !isAdmin && (
                <div className="relative mt-16 sm:mt-4 mb-8">
                    {/* Animated glowing background */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl blur opacity-25 animate-pulse"></div>
                    
                    {/* Main card */}
                    <div className="relative bg-[#111] backdrop-blur-xl border border-amber-500/30 p-5 sm:p-8 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-5 shadow-2xl">
                        {/* Status Icon */}
                        <div className="relative flex-shrink-0">
                            <div className="absolute -inset-2 bg-amber-500/20 rounded-full blur animate-ping" style={{ animationDuration: '3s' }}></div>
                            <div className="relative bg-gradient-to-br from-amber-400 to-orange-600 p-3 sm:p-4 rounded-full shadow-lg border border-amber-300/30">
                                <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-black fill-black/10" />
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400 font-extrabold text-xl sm:text-2xl tracking-wide">
                                    জরুরী বিজ্ঞপ্তি
                                </h3>
                                <span className="flex h-2 w-2 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                </span>
                            </div>
                            <p className="text-amber-100/80 text-sm sm:text-base leading-relaxed font-medium">
                                নমস্কার <span className="text-white font-bold">{currentMemberRecord?.name}</span>, 
                                আপনার ২০২৬ শ্রী শ্রী বাসন্তী দুর্গাপূজার ধার্য্যকৃত 
                                <span className="text-amber-400 font-bold mx-1 px-1 bg-amber-500/10 rounded">২,০০০ টাকা</span> 
                                দানটি এখনো বাকি দেখাচ্ছে। দয়া করে শীঘ্রই তা জমা দেওয়ার অনুরোধ রইল। ধন্যবাদ।
                            </p>
                        </div>
                    </div>
                </div>
            )}
            
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/5 pb-8">
                <div>
                    <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-indigo-600">
                        সদস্য দান স্ট্যাটাস
                    </h1>
                    <p className="text-neutral-500 mt-1">কমিটির সকল সদস্যদের ধার্য্যকৃত ২,০০০ টাকা দানের হিসাব</p>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full md:w-auto">
                    <StatCard label="মোট সদস্য" value={totalMembers} color="indigo" />
                    <StatCard label="প্রদান করেছেন" value={paidMembers} color="emerald" />
                    <StatCard label="বাকি আছে" value={pendingMembers} color="amber" />
                    <StatCard label="মোট সংগৃহীত" value={`₹${collectedAmount.toLocaleString()}`} color="indigo" highlight />
                </div>
            </header>

            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6">
                <div className="relative w-full max-w-md group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 group-focus-within:text-emerald-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="সদস্যের নাম বা ফোন নম্বর খুঁজুন..."
                        className="premium-input pl-12"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex flex-wrap gap-4 items-center w-full sm:w-auto">
                    <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all font-medium text-sm appearance-none outline-none focus:border-emerald-500/50 cursor-pointer min-w-[140px]"
                    >
                        <option value="">সকল পদবী</option>
                        {availableRoles.map(role => (
                            <option key={role} value={role}>{role}</option>
                        ))}
                    </select>
                    <button 
                        onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all font-medium text-sm"
                        title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                    >
                        <Filter className="w-4 h-4 text-emerald-500" />
                        ক্রম: {sortOrder === 'asc' ? 'অ থেকে হ' : 'হ থেকে অ'}
                    </button>
                    {isAdmin && (
                        <div className="flex flex-col items-end hidden sm:flex">
                            <p className="text-xs text-neutral-500 italic text-right">
                                * অ্যাডমিন হিসেবে আপনি স্ট্যাটাসে ক্লিক করে তা পরিবর্তন করতে পারেন
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Bulk Actions Bar - Sticky at Top */}
            {selectedIds.length > 0 && mounted && (
                <div className="sticky top-[64px] sm:top-8 w-full bg-gradient-to-r from-neutral-900/95 to-neutral-800/95 backdrop-blur-xl border border-white/20 p-4 rounded-2xl shadow-2xl flex flex-wrap items-center justify-between gap-4 z-[100] mb-6">
                    <div className="flex items-center gap-4">
                        <div className="text-sm font-bold text-white whitespace-nowrap">
                            {selectedIds.length} জন নির্বাচিত
                        </div>
                        <button 
                            onClick={toggleSelectAll}
                            className="text-[10px] uppercase tracking-wider bg-white/5 hover:bg-white/10 text-white/70 hover:text-white px-2 py-1 rounded border border-white/10 transition-colors"
                        >
                            {selectedIds.length === filteredMembers.length ? "Deselect All" : "Select All"}
                        </button>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                        <button 
                            onClick={() => bulkUpdateMutation.mutate({ memberIds: selectedIds, status: 'SUCCESS' })}
                            disabled={bulkUpdateMutation.isPending}
                            className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-black text-xs font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                        >
                            <CheckCircle2 className="w-3.5 h-3.5" /> পেমেন্ট সফল
                        </button>
                        <button 
                            onClick={() => bulkUpdateMutation.mutate({ memberIds: selectedIds, status: 'PENDING' })}
                            disabled={bulkUpdateMutation.isPending}
                            className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-black text-xs font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                        >
                            <Clock className="w-3.5 h-3.5" /> পেমেন্ট বাকি
                        </button>
                        <button 
                            onClick={handleBulkInternalChat}
                            disabled={broadcastMutation.isPending}
                            className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-indigo-500/20"
                        >
                            <MessageSquare className="w-3.5 h-3.5" /> মেসেজ পাঠান
                        </button>
                        <button 
                            onClick={handleBulkWhatsApp}
                            className="bg-[#25D366] hover:bg-[#128C7E] text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-green-500/20"
                        >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                            </svg> ওয়াটসঅ্যাপ
                        </button>
                        <button 
                            onClick={() => setSelectedIds([])}
                            className="bg-white/5 hover:bg-white/10 text-white/50 hover:text-white text-xs px-3 rounded-lg border border-white/5 transition-colors"
                        >
                            বাতিল
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    <div className="col-span-full p-12 text-center text-neutral-500">লোড হচ্ছে...</div>
                ) : filteredMembers.length === 0 ? (
                    <div className="col-span-full p-12 text-center text-neutral-500">কোন সদস্য পাওয়া যায়নি</div>
                ) : (
                    filteredMembers.map((member: any) => (
                        <div 
                            key={member.id} 
                            className={cn(
                                "group bg-[#111115] border rounded-2xl p-5 flex flex-col gap-4 relative transition-all duration-300",
                                selectedIds.includes(member.id) 
                                    ? "border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.15)] bg-emerald-500/[0.02]" 
                                    : "border-white/5 shadow-xl hover:border-white/10 hover:bg-white/[0.02]"
                            )}
                        >
                            {/* Header / Profile Info */}
                            <div className="flex items-start gap-4 pb-4 border-b border-white/5 relative">
                                {isAdmin && (
                                    <div className="flex flex-col items-center gap-1.5 pt-1">
                                        <span className="text-[10px] uppercase font-bold text-neutral-600 tracking-wider">নির্বাচন</span>
                                        <input 
                                            type="checkbox" 
                                            className="w-4 h-4 rounded border-white/10 bg-white/5 accent-emerald-500 cursor-pointer"
                                            checked={selectedIds.includes(member.id)}
                                            onChange={() => toggleSelection(member.id)}
                                        />
                                    </div>
                                )}
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-inner flex-shrink-0">
                                        {member.avatarUrl ? (
                                            <img src={member.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            <User className="w-6 h-6 text-emerald-500" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-white text-lg leading-tight truncate tracking-wide">{member.name}</div>
                                        <div className="text-[10px] text-neutral-500 uppercase tracking-widest mt-1">
                                            {member.designation || 'জেনারেল মেম্বার'} • {member.userId ? 'অ্যাকাউন্ট যুক্ত' : 'প্রোফাইল মাত্র'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Status & Amount Row */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 rounded-xl p-3 flex flex-col justify-center border border-white/5">
                                    <span className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">ধার্য্যকৃত পরিমাণ</span>
                                    <span className="font-mono text-white font-bold text-lg">₹{member.fixedDonationAmount || 2000}</span>
                                </div>
                                <div className="bg-white/5 rounded-xl p-3 flex flex-col justify-center border border-white/5 items-start">
                                    <span className="text-[10px] text-neutral-500 uppercase tracking-wider mb-2">স্ট্যাটাস</span>
                                    <button 
                                        onClick={() => toggleStatus(member)}
                                        disabled={!isAdmin || updateStatusMutation.isPending}
                                        className={cn(
                                            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all duration-300 w-full justify-center max-w-[120px]",
                                            member.fixedDonationStatus === 'SUCCESS' 
                                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]" 
                                                : "bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]",
                                            isAdmin && "hover:scale-105 active:scale-95 cursor-pointer"
                                        )}
                                    >
                                        {member.fixedDonationStatus === 'SUCCESS' ? (
                                            <><CheckCircle2 className="w-3.5 h-3.5" /> সফল</>
                                        ) : (
                                            <><Clock className="w-3.5 h-3.5" /> বাকি</>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Additional Info */}
                            <div className="flex flex-col gap-2 mt-1">
                                {member.phone && (
                                    <a href={`tel:${member.phone}`} className="flex items-center gap-3 text-sm text-neutral-400 px-1 hover:text-emerald-400 transition-colors w-fit">
                                        <Smartphone className="w-4 h-4 text-emerald-500/70 flex-shrink-0" />
                                        <span className="font-medium tracking-wider">{member.phone}</span>
                                    </a>
                                )}
                                <div className="flex items-center justify-between text-[10px] text-neutral-500 bg-black/20 rounded-lg px-3 py-2 mt-2">
                                    <span>আপডেট: {new Date(member.updatedAt).toLocaleDateString('bn-IN')}</span>
                                    {member.noticeSentCount > 0 && (
                                        <div className="flex items-center gap-1 text-emerald-400">
                                            <MessageSquare className="w-3 h-3" />
                                            <span>{member.noticeSentCount}x রিমাইন্ডার</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Actions (Admin) */}
                            {isAdmin && (
                                <div className="flex justify-end gap-2 pt-4 border-t border-white/5 mt-auto">
                                    {member.userId && (
                                        <button 
                                            onClick={() => window.location.href = `/dashboard/chat?userId=${member.userId}`}
                                            className="p-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-xl transition-all shadow-sm flex items-center gap-2"
                                            title="চ্যাট করুন"
                                        >
                                            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/>
                                            </svg>
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => {
                                            const message = `নমস্কার ${member.name}, আপনার ২০২৬ শ্রী শ্রী বাসন্তী দুর্গাপূজার ২,০০০ টাকা দানটি এখনো বাকি দেখাচ্ছে। দয়া করে শীঘ্রই জমা দেওয়ার অনুরোধ রইল। ধন্যবাদ।`;
                                            const phone = member.phone?.replace(/\D/g, '');
                                            if (phone) {
                                                const formattedPhone = phone.startsWith('91') ? phone : `91${phone}`;
                                                window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
                                                bulkNoticeMutation.mutate({ memberIds: [member.id] });
                                            } else {
                                                alert('ফোন নম্বর পাওয়া যায়নি।');
                                            }
                                        }}
                                        className="py-2.5 px-4 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] rounded-xl transition-all shadow-sm flex items-center gap-2 font-bold text-[11px] uppercase tracking-wider ml-auto"
                                    >
                                        <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                                        </svg>
                                        রিমাইন্ডার
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Bulk Actions Bar moved to top */}
        </div>
    );
}

function StatCard({ label, value, color, highlight = false }: { label: string, value: any, color: string, highlight?: boolean }) {
    const colors: any = {
        emerald: "from-emerald-500/20 to-transparent text-emerald-400 border-emerald-500/20",
        amber: "from-amber-500/20 to-transparent text-amber-400 border-amber-500/20",
        indigo: "from-indigo-500/20 to-transparent text-indigo-400 border-indigo-500/20",
    };

    return (
        <div className={cn(
            "glass-card p-4 flex flex-col justify-center border bg-gradient-to-tr transition-transform hover:scale-105",
            colors[color],
            highlight && "border-white/20 shadow-lg shadow-white/5"
        )}>
            <div className="text-[10px] uppercase tracking-widest opacity-60 mb-1">{label}</div>
            <div className="text-2xl font-black">{value}</div>
        </div>
    );
}
