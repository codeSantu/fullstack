'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Search, Edit2, Trash2, Smartphone, Mail, MapPin, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth'; // Added useAuth import
import { usePujaData } from '@/hooks/usePujaData';
import { cn } from '@/lib/utils';

const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

export default function AdminMembersPage() {
    const { authHeader, user } = useAuth(); // Added useAuth hook
    const isAdmin = user?.role === 'ADMIN'; // Added isAdmin check
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState(''); // Renamed searchQuery to searchTerm
    const [selectedRole, setSelectedRole] = useState<string>('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        designation: '',
        phone: '',
        address: '',
        bio: '',
        role: 'USER'
    });
    const [formError, setFormError] = useState('');
    const [editingMember, setEditingMember] = useState<any>(null);

    // Dynamic Roles from CMS
    const { data: pujaData } = usePujaData();
    const availableRoles = Array.from(new Set(
        pujaData?.committeeSections?.flatMap(section => 
            section.roles.map(role => role.label)
        ) || []
    )).sort();

    // Body scroll lock
    useEffect(() => {
        if (isAddModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isAddModalOpen]);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Fetch Members
    const { data: members, isLoading } = useQuery<any[]>({
        queryKey: ['members'],
        queryFn: async () => {
            const res = await fetch(`${API}/members`, {
                headers: authHeader
            });
            if (!res.ok) throw new Error('Failed to fetch members');
            return res.json();
        }
    });

    // Create Member Mutation
    const addMemberMutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            const res = await fetch(`${API}/members`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeader
                },
                body: JSON.stringify(data)
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || 'সদস্য যোগ করতে ব্যর্থ হয়েছে');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['members'] });
            setIsAddModalOpen(false);
            setFormData({ name: '', email: '', password: '', designation: '', phone: '', address: '', bio: '', role: 'USER' });
            setFormError('');
        },
    });
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Update Member Mutation
    const updateMemberMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch(`${API}/members/${editingMember.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeader
                },
                body: JSON.stringify(data)
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || 'সদস্য আপডেট করতে ব্যর্থ হয়েছে');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['members'] });
            setIsAddModalOpen(false);
            setEditingMember(null);
            setFormData({ name: '', email: '', password: '', designation: '', phone: '', address: '', bio: '', role: 'USER' });
            setFormError('');
        },
        onError: (err: any) => {
            setFormError(err.message);
        }
    });

    // Delete Member Mutation
    const deleteMemberMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`${API}/members/${id}`, {
                method: 'DELETE',
                headers: authHeader
            });
            if (!res.ok) throw new Error('সদস্য মুছতে ব্যর্থ হয়েছে');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['members'] });
        }
    });

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) {
            setFormError('সদস্যের নাম আবশ্যক');
            return;
        }

        if (editingMember) {
            // Remove password if empty on update
            const updateData = { ...formData };
            if (!updateData.password) delete (updateData as any).password;
            updateMemberMutation.mutate(updateData);
        } else {
            addMemberMutation.mutate(formData);
        }
    };

    const openEditModal = (member: any) => {
        setEditingMember(member);
        setFormData({
            name: member.name,
            email: member.email || '',
            password: '',
            designation: member.designation || '',
            phone: member.phone || '',
            address: member.address || '',
            bio: member.bio || '',
            role: member.user?.role || 'USER'
        });
        setIsAddModalOpen(true);
    };

    const openAddModal = () => {
        setEditingMember(null);
        setFormData({ name: '', email: '', password: '', designation: '', phone: '', address: '', bio: '', role: 'USER' });
        setIsAddModalOpen(true);
    };

    const filteredMembers = members?.filter(m => {
        const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              m.designation?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              m.phone?.includes(searchTerm);
        const memberRole = m.designation || 'সাধারণ সদস্য';
        const isGeneralRole = selectedRole === 'সদস্যবৃন্দ' || selectedRole === 'সাধারণ সদস্য';
        const matchesRole = selectedRole 
            ? (isGeneralRole ? (memberRole === 'সদস্যবৃন্দ' || memberRole === 'সাধারণ সদস্য') : memberRole === selectedRole) 
            : true;
        return matchesSearch && matchesRole;
    }) || [];

    if (!mounted) return null;

    return (
        <div className="relative min-h-full w-full p-4 sm:p-8">
            {/* Dynamic Background Gradients */}
            <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
            <div className="absolute top-0 -right-4 w-72 h-72 bg-fuchsia-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>

            <div className="relative max-w-7xl mx-auto">
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-8 mb-8 border-b border-white/5">
                    <div>
                        <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-fuchsia-600">সদস্য ব্যবস্থাপনা</h1>
                        <p className="text-neutral-500 mt-1">কমিটির সকল সদস্য এবং তাদের তথ্য পরিচালনা করুন</p>
                    </div>
                    {isAdmin && (
                        <button
                            onClick={openAddModal}
                            className="premium-button w-full sm:w-auto gap-2 whitespace-nowrap flex justify-center items-center"
                        >
                            <UserPlus className="w-5 h-5 flex-shrink-0" />
                            <span>নতুন সদস্য যোগ করুন</span>
                        </button>
                    )}
                </header>

                <div className="flex flex-col sm:flex-row gap-4 mb-8 items-stretch sm:items-center justify-between">
                    <div className="relative w-full sm:max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                        <input
                            type="text"
                            placeholder="সদস্য বা ফোন নম্বর খুঁজুন..."
                            className="premium-input pl-16"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all font-medium text-sm appearance-none outline-none focus:border-indigo-500/50 cursor-pointer min-w-[140px] w-full sm:w-auto"
                    >
                        <option value="">সকল পদবী</option>
                        {availableRoles.map(role => (
                            <option key={role} value={role}>{role}</option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {isLoading ? (
                        <div className="col-span-full p-12 text-center text-neutral-500">লোডিং হচ্ছে...</div>
                    ) : filteredMembers.length === 0 ? (
                        <div className="col-span-full p-12 text-center text-neutral-500">কোন সদস্য পাওয়া যায়নি</div>
                    ) : (
                        filteredMembers.map((member) => (
                            <div key={member.id} className="bg-[#111115] border border-white/5 rounded-2xl p-5 flex flex-col gap-4 relative group hover:border-white/10 hover:bg-white/[0.02] shadow-xl hover:shadow-[0_0_20px_rgba(255,255,255,0.03)] transition-all duration-300">
                                {/* Card Header */}
                                <div className="flex items-start gap-4 pb-4 border-b border-white/5">
                                    {isAdmin && (
                                        <div className="flex flex-col items-center gap-1.5 pt-1">
                                            <span className="text-[10px] uppercase font-bold text-neutral-600 tracking-wider">নির্বাচন</span>
                                            <input 
                                                type="checkbox" 
                                                className="w-4 h-4 rounded border-white/10 bg-white/5 accent-indigo-500 cursor-pointer"
                                            />
                                        </div>
                                    )}
                                    <div className="flex items-start gap-4 flex-1 min-w-0">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center font-bold text-indigo-400 border border-indigo-500/30 text-xl shadow-inner flex-shrink-0 sm:w-12 sm:h-12 w-10 h-10">
                                            {member.avatarUrl ? (
                                                <img src={member.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                                            ) : (
                                                member.name.charAt(0)
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-white text-base sm:text-lg leading-tight truncate tracking-wide flex items-center gap-2 flex-wrap">
                                                <span className="truncate">{member.name}</span>
                                                {member.user?.role === 'ADMIN' && (
                                                    <span className="flex items-center justify-center bg-indigo-500/20 text-indigo-400 p-1 rounded border border-indigo-500/50 shadow-[0_0_10px_rgba(99,102,241,0.5)]" title="সিস্টেম অ্যাডমিন">
                                                        <Shield className="w-3.5 h-3.5" />
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-[11px] text-neutral-500 uppercase tracking-widest mt-1">{member.userId ? 'অ্যাকাউন্ট যুক্ত' : 'প্রোফাইল মাত্র'}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Designations */}
                                <div className="flex items-center justify-between px-1">
                                    <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">পদবী</span>
                                    <span className="px-3 py-1 text-[11px] font-bold uppercase tracking-tight bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20 rounded-full shadow-sm">
                                        {member.designation || 'জেনারেল মেম্বার'}
                                    </span>
                                </div>

                                {/* Contact Details */}
                                <div className="bg-white/5 rounded-xl p-3 mt-1 flex flex-col gap-2.5 relative overflow-hidden group-hover:bg-white/10 transition-colors border border-white/5">
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500/50 to-fuchsia-500/50"></div>
                                    
                                    {member.phone && (
                                        <a href={`tel:${member.phone}`} className="flex items-center gap-3 text-sm text-neutral-300 ml-1 hover:text-indigo-400 transition-colors w-fit">
                                            <Smartphone className="w-4 h-4 text-indigo-400 flex-shrink-0" /> 
                                            <span className="font-medium tracking-wider">{member.phone}</span>
                                        </a>
                                    )}
                                    {member.address && (
                                        <div className="flex items-center gap-3 text-[11px] text-neutral-500 italic ml-1 mt-1">
                                            <MapPin className="w-4 h-4 text-fuchsia-400 flex-shrink-0" /> 
                                            <span className="line-clamp-2">{member.address}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Admin Actions */}
                                {isAdmin && (
                                    <div className="flex justify-end gap-2 pt-4 border-t border-white/5 mt-auto">
                                        {member.userId && (
                                            <button 
                                                onClick={() => {
                                                    window.location.href = `/dashboard/chat?userId=${member.userId}`;
                                                }}
                                                className="p-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-xl text-indigo-400 transition-all shadow-sm flex items-center justify-center flex-shrink-0"
                                                title="চ্যাট করুন"
                                            >
                                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/>
                                                </svg>
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => openEditModal(member)}
                                            className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-neutral-400 hover:text-white transition-all shadow-sm flex items-center justify-center flex-shrink-0"
                                            title="এডিট করুন"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => {
                                                if (confirm('আপনি কি এই সদস্যকে মুছে ফেলতে চান?')) {
                                                    deleteMemberMutation.mutate(member.id);
                                                }
                                            }}
                                            className="p-2.5 bg-red-500/10 hover:bg-red-500/20 rounded-xl text-red-500 hover:text-red-400 transition-all shadow-sm flex items-center justify-center flex-shrink-0 ml-auto"
                                            title="ডিলিট করুন"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Premium Add Member Modal */}
            {isAddModalOpen && (
                <div 
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
                    onClick={() => setIsAddModalOpen(false)}
                >
                    <div 
                        className="relative w-full max-w-xl p-5 sm:p-8 animate-fade-in-up my-auto max-h-[90vh] overflow-y-auto no-scrollbar rounded-2xl bg-[#0a0a0f]/90 backdrop-blur-xl border border-indigo-500/30 shadow-[0_0_30px_-5px_var(--tw-shadow-color)] shadow-indigo-500/20"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Neon Glossy Gradients */}
                        <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>
                        <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-fuchsia-500 to-transparent"></div>
                        <div className="absolute inset-y-0 -left-px w-px bg-gradient-to-b from-transparent via-indigo-500/50 to-transparent"></div>
                        <div className="absolute inset-y-0 -right-px w-px bg-gradient-to-b from-transparent via-fuchsia-500/50 to-transparent"></div>

                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-fuchsia-500/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>

                        <button 
                            onClick={() => setIsAddModalOpen(false)}
                            className="absolute right-5 top-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white hover:rotate-90 transition-all border border-white/10"
                        >
                            ✕
                        </button>
                        <h2 className="text-2xl font-black mb-8 font-orbitron text-center relative w-fit mx-auto">
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-fuchsia-400 drop-shadow-[0_0_10px_rgba(167,139,250,0.5)]">
                                {editingMember ? 'সদস্যের তথ্য আপডেট করুন' : 'নতুন সদস্য যোগ করুন'}
                            </span>
                            <div className="absolute -bottom-2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
                        </h2>

                        <form onSubmit={handleFormSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">সদস্যের নাম *</label>
                                <input
                                    type="text"
                                    className="premium-input"
                                    placeholder="পুর্ণ নাম লিখুন"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">ইমেইল (লগইন এর জন্য)</label>
                                    <input
                                        type="email"
                                        className="premium-input"
                                        placeholder="example@mail.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">পাসওয়ার্ড</label>
                                    <input
                                        type="password"
                                        className="premium-input"
                                        placeholder="******"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">সিস্টেম রোল (Role)</label>
                                    <div className="relative group">
                                        <select
                                            className="premium-input bg-[#09090b] disabled:opacity-50 disabled:cursor-not-allowed"
                                            value={formData.role}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                            disabled={editingMember && !editingMember.userId}
                                        >
                                            <option value="USER">সাধারণ ব্যবহারকারী (USER)</option>
                                            <option value="ADMIN">অ্যাডমিন (ADMIN)</option>
                                        </select>
                                        {editingMember && !editingMember.userId && (
                                            <div className="opacity-0 invisible group-hover:opacity-100 group-hover:visible absolute z-10 bottom-full left-0 mb-2 w-full p-2 bg-neutral-900 border border-white/10 text-xs text-neutral-300 rounded shadow-xl transition-all">
                                                রোল পরিবর্তন করতে হলে আগে অ্যাকাউন্ট যুক্ত করতে হবে
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">পদবী (Designation)</label>
                                    <select
                                        className="premium-input bg-[#09090b]"
                                        value={formData.designation}
                                        onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                                    >
                                        <option value="">পদবী নির্বাচন করুন</option>
                                        <option value="সাধারণ সদস্য">সাধারণ সদস্য</option>
                                        {availableRoles.map(role => (
                                            <option key={role} value={role}>{role}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">ফোন নম্বর</label>
                                    <input
                                        type="tel"
                                        className="premium-input"
                                        placeholder="91XXXXXXXX"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">ঠিকানা</label>
                                <input
                                    type="text"
                                    className="premium-input"
                                    placeholder="ঠিকানা লিখুন"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">বায়ো (Bio)</label>
                                <textarea
                                    className="premium-input min-h-[80px] resize-none"
                                    placeholder="সদস্য সম্পর্কে কিছু লিখুন"
                                    value={formData.bio}
                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                />
                            </div>

                            {formError && <p className="text-red-400 text-xs bg-red-400/10 p-3 rounded-lg border border-red-400/20">{formError}</p>}

                            <div className="flex justify-end gap-3 sm:gap-4 pt-4 mt-4 border-t border-white/5">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl hover:bg-white/5 text-neutral-400 hover:text-white transition-all font-bold w-full sm:w-auto"
                                >
                                    বাতিল
                                </button>
                                <button
                                    type="submit"
                                    disabled={addMemberMutation.isPending}
                                    className="premium-button w-full sm:w-auto flex justify-center"
                                >
                                    {addMemberMutation.isPending ? 'প্রসেসিং হচ্ছে...' : 'সংরক্ষণ করুন'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
