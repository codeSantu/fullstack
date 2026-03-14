'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePujaData } from '@/hooks/usePujaData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Plus, Trash2, Layout, Users, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import { useRouter } from 'next/navigation';

export default function PujaDetailsPage() {
    const { user, authHeader, initializing } = useAuth();
    const { data: pujaData, loading: pujaLoading } = usePujaData();
    const { toast } = useToast();
    const router = useRouter();
    const [config, setConfig] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [allMembers, setAllMembers] = useState<any[]>([]);

    useEffect(() => {
        if (!initializing && user && user.role !== 'ADMIN') {
            router.push('/dashboard');
        }
    }, [user, initializing, router]);

    useEffect(() => {
        if (pujaData) {
            setConfig({
                title: pujaData.festivalTitle,
                subtitle: pujaData.festivalSubtitle,
                scheduleJson: pujaData.scheduleDays,
                committeeJson: pujaData.committeeSections,
                footerJson: pujaData.footer,
            });
        }
    }, [pujaData]);

    useEffect(() => {
        if (initializing) return;
        async function fetchMembers() {
            try {
                const base = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';
                const res = await fetch(`${base}/members`, { headers: authHeader });
                if (res.ok) {
                    const data = await res.json();
                    setAllMembers(data);
                }
            } catch (err) {
                console.error('Failed to fetch members', err);
            }
        }
        fetchMembers();
    }, [authHeader, initializing, user?.organizationId]);

    if (!config || pujaLoading) return <div>Loading...</div>;

    const festivalId = pujaData?._festival?.id;

    async function handleSave() {
        if (!festivalId) return;
        setIsSaving(true);
        try {
            const base = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';
            const res = await fetch(`${base}/festival-settings/${festivalId}`, {
                method: 'PATCH',
                headers: {
                    ...authHeader,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(config),
            });
            if (res.ok) {
                toast({ title: 'সাফল্য!', description: 'পূজার বিবরণ আপডেট করা হয়েছে।' });
            } else {
                throw new Error('Failed to update');
            }
        } catch (err) {
            toast({ title: 'ভুল হয়েছে', description: 'আপডেট করা সম্ভব হয়নি।', variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    }

    // Handlers for schedule and committee
    function addScheduleDay() {
        const newDay = {
            id: `day-${Date.now()}`,
            title: 'নতুন দিন',
            dateLabel: '',
            icon: '🌸',
            rituals: [],
        };
        setConfig({ ...config, scheduleJson: [...config.scheduleJson, newDay] });
    }

    function removeScheduleDay(id: string) {
        setConfig({ ...config, scheduleJson: config.scheduleJson.filter((d: any) => d.id !== id) });
    }

    // Committee Helpers
    function addCommitteeSection() {
        const newSection = {
            id: `section-${Date.now()}`,
            icon: '👥',
            title: 'নতুন বিভাগ',
            roles: []
        };
        setConfig({ ...config, committeeJson: [...config.committeeJson, newSection] });
    }

    function removeCommitteeSection(id: string) {
        setConfig({ ...config, committeeJson: config.committeeJson.filter((s: any) => s.id !== id) });
    }

    function addCommitteeRole(sectionIdx: number) {
        const next = [...config.committeeJson];
        const newRole = {
            id: `role-${Date.now()}`,
            label: 'নতুন পদবী',
            members: []
        };
        next[sectionIdx].roles.push(newRole);
        setConfig({ ...config, committeeJson: next });
    }

    function removeCommitteeRole(sectionIdx: number, roleId: string) {
        const next = [...config.committeeJson];
        next[sectionIdx].roles = next[sectionIdx].roles.filter((r: any) => r.id !== roleId);
        setConfig({ ...config, committeeJson: next });
    }

    function addCommitteeMember(sectionIdx: number, roleIdx: number) {
        const next = [...config.committeeJson];
        next[sectionIdx].roles[roleIdx].members.push('');
        setConfig({ ...config, committeeJson: next });
    }

    function removeCommitteeMember(sectionIdx: number, roleIdx: number, memberIdx: number) {
        const next = [...config.committeeJson];
        next[sectionIdx].roles[roleIdx].members.splice(memberIdx, 1);
        setConfig({ ...config, committeeJson: next });
    }

    function canDelete(titleOrLabel: string) {
        const protectedTerms = ['সভাপতি মণ্ডলী', 'সভাপতি', 'সহ সভাপতি'];
        return !protectedTerms.includes(titleOrLabel);
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative">
                {/* Neon Glow Behind Title */}
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>
                
                <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-fuchsia-400 to-indigo-400 drop-shadow-[0_0_10px_rgba(192,132,252,0.3)]">
                    পূজার সম্পূর্ণ বিবরণ <span className="text-white/50 text-xl font-normal tracking-wide">(CMS)</span>
                </h1>
                
                <Button 
                    onClick={handleSave} 
                    disabled={isSaving} 
                    className="w-full sm:w-auto relative group overflow-hidden bg-black/80 border border-purple-500/50 hover:border-purple-400 text-purple-200 hover:text-white transition-all duration-300 shadow-[0_0_15px_rgba(168,85,247,0.25)] hover:shadow-[0_0_25px_rgba(168,85,247,0.45)] h-12 px-6 rounded-xl"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-fuchsia-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <Save className="w-5 h-5 mr-2 relative z-10 group-hover:scale-110 transition-transform" />
                    <span className="relative z-10 font-medium">{isSaving ? 'সংরক্ষণ হচ্ছে...' : 'সব পরিবর্তন সংরক্ষণ করুন'}</span>
                </Button>
            </div>

            <Tabs defaultValue="general" className="w-full relative z-10">
                <TabsList className="flex flex-col sm:grid sm:grid-cols-3 w-full h-auto bg-black/40 backdrop-blur-xl border border-white/10 p-1.5 gap-2 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                    <TabsTrigger 
                        value="general" 
                        className="justify-start sm:justify-center py-3.5 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600/40 data-[state=active]:to-indigo-600/40 data-[state=active]:text-white data-[state=active]:shadow-[0_0_15px_rgba(139,92,246,0.3)] data-[state=active]:border-white/10 border border-transparent transition-all duration-300 text-gray-400 hover:text-gray-200 font-medium"
                    >
                        <Layout className="w-4 h-4 mr-2 text-purple-400" /> সাধারণ তথ্য
                    </TabsTrigger>
                    <TabsTrigger 
                        value="schedule" 
                        className="justify-start sm:justify-center py-3.5 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-600/40 data-[state=active]:to-rose-600/40 data-[state=active]:text-white data-[state=active]:shadow-[0_0_15px_rgba(236,72,153,0.3)] data-[state=active]:border-white/10 border border-transparent transition-all duration-300 text-gray-400 hover:text-gray-200 font-medium"
                    >
                        <Calendar className="w-4 h-4 mr-2 text-pink-400" /> দিনভিত্তিক বিবরণ
                    </TabsTrigger>
                    <TabsTrigger 
                        value="committee" 
                        className="justify-start sm:justify-center py-3.5 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600/40 data-[state=active]:to-blue-600/40 data-[state=active]:text-white data-[state=active]:shadow-[0_0_15px_rgba(6,182,212,0.3)] data-[state=active]:border-white/10 border border-transparent transition-all duration-300 text-gray-400 hover:text-gray-200 font-medium"
                    >
                        <Users className="w-4 h-4 mr-2 text-cyan-400" /> কমিটি সদস্য
                    </TabsTrigger>
                </TabsList>

                {/* General Info Tab */}
                <TabsContent value="general" className="mt-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <Card className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-[0_0_30px_rgba(139,92,246,0.15)] hover:shadow-[0_0_40px_rgba(139,92,246,0.25)] transition-all duration-500">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
                        
                        <CardHeader className="border-b border-white/5 pb-4">
                            <CardTitle className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-indigo-300">প্রাথমিক তথ্য</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6 relative z-10">
                            <div className="space-y-2 group">
                                <label className="text-sm font-medium text-purple-200/80 group-focus-within:text-purple-300 transition-colors">উৎসবের নাম</label>
                                <Input
                                    value={config.title}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig({ ...config, title: e.target.value })}
                                    className="bg-black/50 border-white/10 focus:border-purple-500/50 focus:ring-purple-500/20 focus:shadow-[0_0_15px_rgba(168,85,247,0.2)] text-white placeholder-white/20 transition-all rounded-xl h-12"
                                />
                            </div>
                            <div className="space-y-2 group">
                                <label className="text-sm font-medium text-purple-200/80 group-focus-within:text-purple-300 transition-colors">সাবটাইটেল (তারিখ/সময়)</label>
                                <Input
                                    value={config.subtitle}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig({ ...config, subtitle: e.target.value })}
                                    className="bg-black/50 border-white/10 focus:border-purple-500/50 focus:ring-purple-500/20 focus:shadow-[0_0_15px_rgba(168,85,247,0.2)] text-white placeholder-white/20 transition-all rounded-xl h-12"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Schedule Tab */}
                <TabsContent value="schedule" className="mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {config.scheduleJson.map((day: any, idx: number) => (
                        <Card key={day.id} className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-[0_0_30px_rgba(236,72,153,0.1)] hover:shadow-[0_0_40px_rgba(236,72,153,0.2)] transition-all duration-500 group">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-pink-500/10 rounded-full blur-3xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            
                            <CardContent className="pt-6 space-y-5 relative z-10">
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <Input
                                        value={day.title}
                                        placeholder="শিরোনাম (যেমন: ১. ষষ্ঠী)"
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                            const next = [...config.scheduleJson];
                                            next[idx].title = e.target.value;
                                            setConfig({ ...config, scheduleJson: next });
                                        }}
                                        className="flex-1 bg-black/50 border-white/10 focus:border-pink-500/50 focus:ring-pink-500/20 focus:shadow-[0_0_15px_rgba(236,72,153,0.2)] text-white rounded-xl h-12"
                                    />
                                    <div className="flex gap-4">
                                        <Input
                                            value={day.icon}
                                            className="w-16 text-center bg-black/50 border-white/10 focus:border-pink-500/50 focus:ring-pink-500/20 text-white rounded-xl h-12 text-xl"
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                const next = [...config.scheduleJson];
                                                next[idx].icon = e.target.value;
                                                setConfig({ ...config, scheduleJson: next });
                                            }}
                                        />
                                        <Button variant="destructive" onClick={() => removeScheduleDay(day.id)} className="h-12 w-12 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)] hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all">
                                            <Trash2 className="w-5 h-5" />
                                        </Button>
                                    </div>
                                </div>
                                <Input
                                    value={day.dateLabel}
                                    placeholder="তারিখ (যেমন: ২২ মার্চ ২০২৬)"
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                        const next = [...config.scheduleJson];
                                        next[idx].dateLabel = e.target.value;
                                        setConfig({ ...config, scheduleJson: next });
                                    }}
                                    className="bg-black/50 border-white/10 focus:border-pink-500/50 focus:ring-pink-500/20 focus:shadow-[0_0_15px_rgba(236,72,153,0.2)] text-white rounded-xl h-12"
                                />
                                <Textarea
                                    value={day.rituals.join('\n')}
                                    placeholder="পূজার আচার (প্রতি লাইনে একটি)"
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                                        const next = [...config.scheduleJson];
                                        next[idx].rituals = e.target.value.split('\n');
                                        setConfig({ ...config, scheduleJson: next });
                                    }}
                                    className="min-h-[120px] bg-black/50 border-white/10 focus:border-pink-500/50 focus:ring-pink-500/20 focus:shadow-[0_0_15px_rgba(236,72,153,0.2)] text-white rounded-xl resize-none p-4 leading-relaxed"
                                />
                            </CardContent>
                        </Card>
                    ))}
                    <Button 
                        onClick={addScheduleDay} 
                        className="w-full h-14 relative overflow-hidden bg-black/40 border border-pink-500/30 border-dashed text-pink-300 hover:text-white hover:border-pink-400 hover:bg-pink-500/10 rounded-2xl transition-all duration-300 group shadow-[0_0_10px_rgba(236,72,153,0.1)] hover:shadow-[0_0_20px_rgba(236,72,153,0.3)]"
                    >
                        <Plus className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" /> নতুন দিন যোগ করুন
                    </Button>
                </TabsContent>

                {/* Committee Tab */}
                <TabsContent value="committee" className="mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {config.committeeJson.map((section: any, sIdx: number) => (
                        <Card key={section.id} className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-[0_0_30px_rgba(6,182,212,0.1)] hover:shadow-[0_0_40px_rgba(6,182,212,0.2)] transition-all duration-500 group">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            
                            <CardHeader className="pb-4 border-b border-white/5 relative z-10">
                                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                                    <div className="flex gap-4 w-full sm:w-auto">
                                        <Input
                                            value={section.icon}
                                            className="w-16 h-12 text-center text-xl bg-black/50 border-cyan-500/30 focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(6,182,212,0.3)] rounded-xl"
                                            onChange={(e) => {
                                                const next = [...config.committeeJson];
                                                next[sIdx].icon = e.target.value;
                                                setConfig({ ...config, committeeJson: next });
                                            }}
                                        />
                                        <Input
                                            value={section.title}
                                            placeholder="বিভাগের নাম"
                                            className="flex-1 h-12 sm:w-64 bg-black/50 border-cyan-500/30 focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(6,182,212,0.3)] text-cyan-200 font-semibold text-lg rounded-xl"
                                            onChange={(e) => {
                                                const next = [...config.committeeJson];
                                                next[sIdx].title = e.target.value;
                                                setConfig({ ...config, committeeJson: next });
                                            }}
                                        />
                                    </div>
                                    {canDelete(section.title) && (
                                        <Button variant="destructive" onClick={() => removeCommitteeSection(section.id)} className="w-full sm:w-auto h-12 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 border border-red-500/20">
                                            <Trash2 className="w-4 h-4 mr-2 sm:mr-0" />
                                            <span className="sm:hidden">শাখা মুছুন</span>
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6 relative z-10">
                                {section.roles.map((role: any, rIdx: number) => (
                                    <div key={role.id} className="pl-4 sm:pl-6 border-l-2 border-cyan-500/30 space-y-4">
                                        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                                            <Input
                                                value={role.label}
                                                placeholder="পদবী (যেমন: সভাপতি)"
                                                className="flex-1 bg-black/30 border-white/10 focus:border-cyan-500/40 focus:shadow-[0_0_15px_rgba(6,182,212,0.2)] text-cyan-100 rounded-xl h-11"
                                                onChange={(e) => {
                                                    const next = [...config.committeeJson];
                                                    next[sIdx].roles[rIdx].label = e.target.value;
                                                    setConfig({ ...config, committeeJson: next });
                                                }}
                                            />
                                            {canDelete(role.label) && (
                                                <Button variant="ghost" onClick={() => removeCommitteeRole(sIdx, role.id)} className="w-full sm:w-auto h-11 text-red-400/80 hover:text-red-300 hover:bg-red-500/10 bg-red-500/5 sm:bg-transparent rounded-xl border border-red-500/20 sm:border-transparent">
                                                    <Trash2 className="w-4 h-4 mr-2 sm:mr-0" />
                                                    <span className="sm:hidden">পদবী মুছুন</span>
                                                </Button>
                                            )}
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-2 sm:pl-4">
                                            {role.members.map((member: string, mIdx: number) => (
                                                <div key={mIdx} className="flex gap-2 items-center bg-black/40 border border-white/5 p-1 rounded-xl focus-within:border-cyan-500/30 focus-within:shadow-[0_0_10px_rgba(6,182,212,0.15)] transition-all group/member">
                                                    <select
                                                        value={member}
                                                        className="flex-1 h-10 px-3 bg-transparent text-sm text-gray-200 outline-none appearance-none cursor-pointer"
                                                        onChange={(e) => {
                                                            const next = [...config.committeeJson];
                                                            next[sIdx].roles[rIdx].members[mIdx] = e.target.value;
                                                            setConfig({ ...config, committeeJson: next });
                                                        }}
                                                    >
                                                        <option value="" className="bg-zinc-900 text-gray-400">সদস্য নির্বাচন করুন</option>
                                                        {allMembers.map((m: any) => (
                                                            <option key={m.id} value={m.name} className="bg-zinc-900">{m.name}</option>
                                                        ))}
                                                    </select>
                                                    <Button variant="ghost" size="icon" onClick={() => removeCommitteeMember(sIdx, rIdx, mIdx)} className="h-9 w-9 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg opacity-100 sm:opacity-50 group-hover/member:opacity-100 transition-opacity">
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                            <Button 
                                                variant="ghost" 
                                                onClick={() => addCommitteeMember(sIdx, rIdx)}
                                                className="h-12 border-dashed border border-cyan-500/20 hover:border-cyan-400/50 hover:bg-cyan-500/10 text-cyan-400/80 hover:text-cyan-300 text-sm rounded-xl transition-all"
                                            >
                                                <Plus className="w-4 h-4 mr-1.5" /> সদস্য যোগ করুন
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                <Button 
                                    variant="outline" 
                                    onClick={() => addCommitteeRole(sIdx)}
                                    className="w-full h-11 border-dashed border-cyan-500/30 bg-black/20 hover:bg-cyan-500/10 text-cyan-300 hover:text-cyan-200 hover:border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.05)] hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] rounded-xl transition-all mt-4"
                                >
                                    <Plus className="w-4 h-4 mr-2" /> নতুন পদবী যোগ করুন
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                    <Button onClick={addCommitteeSection} className="w-full h-14 relative overflow-hidden bg-black/40 border-2 border-cyan-500/30 border-dashed text-cyan-300 hover:text-white hover:border-cyan-400 hover:bg-cyan-500/10 rounded-2xl transition-all duration-300 group shadow-[0_0_15px_rgba(6,182,212,0.1)] hover:shadow-[0_0_25px_rgba(6,182,212,0.25)]">
                        <Plus className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" /> নতুন কমিটি বিভাগ যোগ করুন
                    </Button>
                </TabsContent>
            </Tabs>
        </div>
    );
}
