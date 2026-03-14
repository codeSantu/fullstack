'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { User, Phone, MapPin, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';

import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProfilePictureUpload } from '@/components/ProfilePictureUpload';

const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

export default function ProfilePage() {
    const { user, authHeader, initializing } = useAuth();
    const queryClient = useQueryClient();
    const [mounted, setMounted] = useState(false);
    
    // Local form state
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [bio, setBio] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');

    useEffect(() => {
        setMounted(true);
    }, []);

    // Fetch member profile
    const { data: member, isLoading } = useQuery({
        queryKey: ['member', user?.id],
        queryFn: async () => {
            const res = await fetch(`${API}/members/user/${user?.id}`, {
                headers: authHeader
            });
            if (!res.ok) throw new Error('Failed to fetch profile');
            const data = await res.json();
            return data;
        },
        enabled: !!user?.id && !initializing
    });

    // Sync local state when member data is loaded
    useEffect(() => {
        if (member) {
            setName(member.name || '');
            setPhone(member.phone || '');
            setAddress(member.address || '');
            setBio(member.bio || '');
            setAvatarUrl(member.avatarUrl || '');
        }
    }, [member]);

    const updateMutation = useMutation({
        mutationFn: async (updatedData: any) => {
            const res = await fetch(`${API}/members/${member?.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeader
                },
                body: JSON.stringify(updatedData)
            });
            if (!res.ok) throw new Error('Failed to update profile');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['member', user?.id] });
            alert('প্রোফাইল সফলভাবে আপডেট করা হয়েছে!');
        },
        onError: (err: any) => {
            alert('ত্রুটি: ' + err.message);
        }
    });

    const handleUpdate = () => {
        updateMutation.mutate({
            name,
            phone,
            address,
            bio,
            avatarUrl
        });
    };

    if (!mounted || isLoading) return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-6">
            <div className="relative w-20 h-20">
                <div className="absolute inset-0 border-4 border-neon-blue/20 rounded-full" />
                <div className="absolute inset-0 border-4 border-t-neon-blue rounded-full animate-spin" />
            </div>
            <p className="text-neon-blue font-black uppercase tracking-[0.3em] animate-pulse">প্রোফাইল লোড হচ্ছে...</p>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 sm:px-10 sm:py-12 space-y-10 animate-fade-in mb-20">
            {/* Glossy Header Section */}
            <header className="relative overflow-hidden rounded-[2.5rem] p-8 sm:p-12 text-center border border-white/10 glass-card bg-black/40 shadow-2xl">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-neon-blue/10 blur-[100px] rounded-full" />
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-neon-purple/10 blur-[100px] rounded-full" />
                
                <h1 className="relative text-4xl sm:text-7xl font-black bg-clip-text text-transparent bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink drop-shadow-[0_0_15px_rgba(191,0,255,0.4)] leading-tight mb-6">
                    আমার প্রোফাইল
                </h1>
                <p className="relative text-neutral-400 max-w-2xl mx-auto text-base sm:text-xl font-medium tracking-wide leading-relaxed">
                    আপনার ব্যক্তিগত তথ্য এবং প্রোফাইল ছবি আধুনিক শৃঙ্খলায় পরিচালনা করুন
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:items-start">
                {/* Profile Photo Section - Sidebar on Desktop, Top on Mobile */}
                <aside className="lg:col-span-4 space-y-8">
                    <div className="glass-card flex flex-col items-center p-8 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.3)] bg-black/50 backdrop-blur-2xl rounded-[3rem]">
                        <div className="relative group p-1 [perspective:1000px]">
                            {/* Neon Glow Ring */}
                            <div className="absolute inset-0 rounded-[3rem] bg-gradient-to-tr from-neon-blue via-neon-purple to-neon-pink opacity-40 blur-md group-hover:opacity-100 transition-opacity duration-700 animate-pulse-slow" />
                            
                            <div className="relative w-48 h-48 sm:w-64 sm:h-64 rounded-[2.8rem] bg-[#0a0a0f] flex items-center justify-center border border-white/10 overflow-hidden transition-all duration-700 group-hover:scale-[1.02] shadow-2xl">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="bg-gradient-to-tr from-white/5 to-white/10 w-full h-full flex items-center justify-center">
                                        <User className="w-24 h-24 text-white/10" />
                                    </div>
                                )}
                                
                                {/* Inner Gloss Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none opacity-50" />
                            </div>
                            
                            <div className="absolute -bottom-2 -right-2 scale-125 z-10 drop-shadow-neon">
                                <ProfilePictureUpload 
                                    onUploadSuccess={(url) => setAvatarUrl(url)} 
                                />
                            </div>
                        </div>

                        <div className="mt-10 text-center space-y-2">
                            <h2 className="text-3xl font-bold text-white tracking-tight">{name || user?.name}</h2>
                            <p className="text-neutral-500 font-medium tracking-wide">{user?.email}</p>
                        </div>

                        <div className="mt-6">
                            <Badge className="px-6 py-2 bg-neon-blue/10 text-neon-blue border border-neon-blue/20 rounded-full font-bold tracking-[0.2em] text-[10px] uppercase shadow-[0_0_15px_rgba(0,245,255,0.2)]">
                                {user?.role || 'USER'}
                            </Badge>
                        </div>
                        
                        <div className="w-full mt-10 p-1 grid grid-cols-2 gap-4">
                            <div className="text-center p-5 rounded-3xl bg-white/[0.03] border border-white/5 group hover:border-neon-blue/30 transition-all duration-500">
                                <div className="text-2xl font-black text-white group-hover:text-neon-blue transition-colors">₹{member?.fixedDonationAmount || 2000}</div>
                                <div className="text-[10px] text-neutral-500 uppercase font-black tracking-widest mt-2 opacity-60">Donation</div>
                            </div>
                            <div className="text-center p-5 rounded-3xl bg-white/[0.03] border border-white/5 group hover:border-neon-purple/30 transition-all duration-500">
                                <div className={cn(
                                    "text-sm font-black uppercase tracking-widest transition-colors",
                                    member?.fixedDonationStatus === 'SUCCESS' ? "text-emerald-400 group-hover:text-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.3)]" : "text-neon-orange group-hover:text-orange-400 shadow-[0_0_10px_rgba(255,107,0,0.3)]"
                                )}>
                                    {member?.fixedDonationStatus || 'PENDING'}
                                </div>
                                <div className="text-[10px] text-neutral-500 uppercase font-black tracking-widest mt-2 opacity-60">Status</div>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Profile Form Section */}
                <main className="lg:col-span-8">
                    <div className="glass-card p-6 sm:p-12 border border-white/10 bg-black/40 backdrop-blur-3xl rounded-[3rem] relative overflow-hidden group">
                        {/* Decorative background glow */}
                        <div className="absolute -top-32 -right-32 w-80 h-80 bg-neon-pink/5 blur-[100px] rounded-full group-hover:bg-neon-pink/10 transition-colors duration-1000" />
                        
                        <h3 className="text-2xl font-bold text-white mb-10 flex items-center gap-5 relative">
                            <div className="p-3.5 bg-neon-blue/10 rounded-2xl border border-neon-blue/20 shadow-[0_0_20px_rgba(0,245,255,0.1)]">
                                <User className="w-6 h-6 text-neon-blue drop-shadow-[0_0_8px_rgba(0,245,255,0.6)]" />
                            </div>
                            ব্যক্তিগত তথ্য
                        </h3>
                        
                        <div className="space-y-10 relative">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <label className="text-[11px] font-black text-neutral-500 uppercase tracking-[0.25em] flex items-center gap-2 px-1">
                                        পুরো নাম <span className="text-neon-pink animate-pulse">●</span>
                                    </label>
                                    <div className="group/input relative">
                                        <Input 
                                            className="premium-input bg-black/60 border-white/10 h-16 pl-14 rounded-2xl focus:border-neon-blue/50 focus:ring-4 focus:ring-neon-blue/5 transition-all duration-500 hover:border-white/20 text-lg font-medium" 
                                            value={name} 
                                            onChange={(e) => setName(e.target.value)} 
                                        />
                                        <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-600 group-focus-within/input:text-neon-blue transition-colors duration-500" />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[11px] font-black text-neutral-500 uppercase tracking-[0.25em] px-1 italic opacity-60">ইমেইল ঠিকানা</label>
                                    <Input className="premium-input bg-white/[0.02] border-white/5 text-neutral-600 h-16 rounded-2xl cursor-not-allowed italic font-medium opacity-50" value={user?.email} disabled />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[11px] font-black text-neutral-500 uppercase tracking-[0.25em] px-1">ফোন নম্বর</label>
                                <div className="relative group/input">
                                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                        <Phone className="w-5 h-5 text-neutral-600 group-focus-within/input:text-neon-blue transition-colors duration-500" />
                                    </div>
                                    <Input 
                                        className="premium-input bg-black/60 border-white/10 h-16 pl-14 rounded-2xl focus:border-neon-blue/50 focus:ring-4 focus:ring-neon-blue/5 transition-all duration-500 hover:border-white/20 text-lg font-medium tracking-wider" 
                                        placeholder="+৮৮০ ১..." 
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[11px] font-black text-neutral-500 uppercase tracking-[0.25em] px-1">ঠিকানা</label>
                                <div className="relative group/input">
                                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                        <MapPin className="w-5 h-5 text-neutral-600 group-focus-within/input:text-neon-blue transition-colors duration-500" />
                                    </div>
                                    <Input 
                                        className="premium-input bg-black/60 border-white/10 h-16 pl-14 rounded-2xl focus:border-neon-blue/50 focus:ring-4 focus:ring-neon-blue/5 transition-all duration-500 hover:border-white/20 text-lg font-medium" 
                                        placeholder="আপনার সঠিক ঠিকানা দিন" 
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[11px] font-black text-neutral-500 uppercase tracking-[0.25em] px-1">আপনার সম্পর্কে কিছু (Bio)</label>
                                <Textarea 
                                    className="premium-input bg-black/60 border-white/10 min-h-[160px] px-8 py-6 rounded-3xl focus:border-neon-purple/50 focus:ring-4 focus:ring-neon-purple/5 transition-all duration-500 hover:border-white/20 resize-none leading-relaxed text-lg" 
                                    placeholder="আপনার জীবনের লক্ষ্য বা এই পূজা সম্পর্কে আপনার ভাবনা..." 
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                />
                            </div>

                            <div className="pt-10">
                                <Button 
                                    onClick={handleUpdate}
                                    disabled={updateMutation.isPending}
                                    className="w-full relative h-16 rounded-2xl border-none p-0 overflow-hidden transition-all duration-500 shadow-[0_0_30px_rgba(191,0,255,0.2)] hover:shadow-[0_0_50px_rgba(191,0,255,0.4)] hover:scale-[1.01] active:scale-95"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink animate-pulse-slow" />
                                    <span className="relative z-10 text-white font-black text-xl tracking-[0.2em] uppercase flex items-center justify-center gap-4">
                                        {updateMutation.isPending ? (
                                            <>
                                                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                                আপডেট হচ্ছে...
                                            </>
                                        ) : (
                                            <>তথ্য আপডেট করুন</>
                                        )}
                                    </span>
                                </Button>
                                <div className="flex items-center justify-center gap-4 mt-8 opacity-40 group-hover:opacity-100 transition-opacity duration-1000">
                                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/20" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400 whitespace-nowrap">
                                        Secure Encrypted Profile Data
                                    </p>
                                    <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/20" />
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

