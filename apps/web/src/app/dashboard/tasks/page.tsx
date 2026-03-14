'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import {
    CheckCircle2, Circle, Clock, Plus,
    Shield, MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

export default function TasksPage() {
    const { user, authHeader } = useAuth();
    const queryClient = useQueryClient();
    const isAdmin = user?.role === 'ADMIN';
    const [mounted, setMounted] = useState(false);

    // Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'MEDIUM',
        dueDate: '',
        assigneeId: ''
    });
    const [formError, setFormError] = useState('');

    useEffect(() => {
        setMounted(true);
    }, []);

    // Body scroll lock for modal
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

    // Fetch tasks
    const { data: tasks, isLoading } = useQuery({
        queryKey: ['tasks', user?.id],
        queryFn: async () => {
            const endpoint = isAdmin
                ? `${API}/tasks/organization/${user?.organizationId}`
                : `${API}/tasks/assignee/${user?.id}`;
            const res = await fetch(endpoint, {
                headers: authHeader
            });
            if (!res.ok) throw new Error('Failed to fetch tasks');
            return res.json();
        },
        enabled: !!user
    });

    // Fetch Members for Assignee Selection (Admin only)
    const { data: members, isLoading: isLoadingMembers } = useQuery<any[]>({
        queryKey: ['members'],
        queryFn: async () => {
            const res = await fetch(`${API}/members`, {
                headers: authHeader
            });
            if (!res.ok) throw new Error('Failed to fetch members');
            return res.json();
        },
        enabled: isAdmin && isAddModalOpen // Only fetch when admin opens modal
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string, data: any }) => {
            const res = await fetch(`${API}/tasks/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeader
                },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error('Failed to update task');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] });
        }
    });

    // Create Task Mutation
    const addTaskMutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            const payload = {
                ...data,
                organizationId: user?.organizationId,
                creatorId: user?.id,
                dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined
            };

            const res = await fetch(`${API}/tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeader
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || 'টাস্ক তৈরি করতে ব্যর্থ হয়েছে');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] });
            setIsAddModalOpen(false);
            setFormData({ title: '', description: '', priority: 'MEDIUM', dueDate: '', assigneeId: '' });
            setFormError('');
        },
        onError: (err: any) => {
            setFormError(err.message);
        }
    });

    const handleToggleComplete = (task: any) => {
        // If it's pending, mark as COMPLETED. If it's COMPLETED, revert to PENDING
        const nextStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
        updateMutation.mutate({ id: task.id, data: { status: nextStatus } });
    };

    const handleApproveTask = (task: any) => {
        if (!isAdmin) return;
        updateMutation.mutate({ id: task.id, data: { status: 'APPROVED' } });
    };

    const handleUpdateRemarks = (task: any, type: 'admin' | 'assignee') => {
        const title = type === 'admin' ? 'অ্যাডমিন রিমার্ক (Admin Remarks):' : 'অ্যাসাইনী রিমার্ক (Assignee Remarks):';
        const currentValue = type === 'admin' ? task.adminRemarks : task.assigneeRemarks;
        const remarks = window.prompt(title, currentValue || '');
        if (remarks !== null) {
            updateMutation.mutate({
                id: task.id,
                data: type === 'admin' ? { adminRemarks: remarks } : { assigneeRemarks: remarks }
            });
        }
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title) {
            setFormError('টাস্কের শিরোনাম আবশ্যক');
            return;
        }
        addTaskMutation.mutate(formData);
    };

    const openAddModal = () => {
        setFormData({ title: '', description: '', priority: 'MEDIUM', dueDate: '', assigneeId: '' });
        setFormError('');
        setIsAddModalOpen(true);
    };

    if (!mounted || isLoading) return <div className="p-12 text-center text-neutral-500">লোড হচ্ছে...</div>;

    const activeTasks = tasks?.filter((t: any) => t.status !== 'APPROVED') || [];
    const historyTasks = tasks?.filter((t: any) => t.status === 'APPROVED') || [];
    const displayedTasks = activeTab === 'active' ? activeTasks : historyTasks;

    return (
        <div className="max-w-6xl mx-auto p-4 sm:p-8 space-y-8 animate-fade-in">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-8">
                <div>
                    <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-600">
                        কাজসমূহ (Tasks)
                    </h1>
                    <p className="text-neutral-500 mt-1">আপনার দায়িত্বপ্রাপ্ত টাস্ক এবং কাজের অগ্রগতি পরিচালনা করুন</p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto mt-4 sm:mt-0">
                    <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 w-full sm:w-auto">
                        <button
                            onClick={() => setActiveTab('active')}
                            className={cn(
                                "flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all",
                                activeTab === 'active'
                                    ? "bg-white/10 text-white shadow-sm"
                                    : "text-neutral-500 hover:text-white hover:bg-white/5"
                            )}
                        >
                            অ্যাক্টিভ কাজ
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={cn(
                                "flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all",
                                activeTab === 'history'
                                    ? "bg-white/10 text-white shadow-sm"
                                    : "text-neutral-500 hover:text-white hover:bg-white/5"
                            )}
                        >
                            কাজের হিস্ট্রি
                        </button>
                    </div>
                    {isAdmin && (
                        <Button onClick={openAddModal} className="premium-button gap-2 w-full sm:w-auto whitespace-nowrap">
                            <Plus className="w-4 h-4" /> নতুন কাজ যোগ করুন
                        </Button>
                    )}
                </div>
            </header>

            <div className="grid gap-6">
                {/* Empty State */}
                {displayedTasks?.length === 0 && (
                    <div className="glass-card p-12 text-center text-neutral-500">
                        <Clock className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        কোন কাজ খুঁজে পাওয়া যায়নি
                    </div>
                )}

                {/* Corrected Mapping Function */}
                {displayedTasks?.map((task: any) => (
                    <div
                        key={task.id}
                        className={cn(
                            "ultra-task-card p-6 border transition-all duration-300 rounded-2xl",
                            task.status === 'COMPLETED' ? "border-emerald-500/20 bg-emerald-500/[0.03] ultra-glow-emerald" : "hover:border-amber-500/30",
                            task.status === 'APPROVED' && "opacity-60 grayscale-[0.5]"
                        )}
                    >
                        <div className="flex flex-col sm:flex-row items-start gap-6">
                            {/* Status Toggle Button */}
                            <button
                                onClick={() => task.status !== 'APPROVED' && handleToggleComplete(task)}
                                disabled={task.status === 'APPROVED'}
                                className={cn(
                                    "mt-1 transition-all active:scale-90",
                                    task.status === 'APPROVED' ? "text-emerald-500 cursor-default" :
                                        task.status === 'COMPLETED' ? "text-amber-500" : "text-neutral-600 hover:text-amber-500"
                                )}
                            >
                                {task.status === 'APPROVED' ? (
                                    <CheckCircle2 className="w-8 h-8" />
                                ) : task.status === 'COMPLETED' ? (
                                    <CheckCircle2 className="w-8 h-8 opacity-50" />
                                ) : (
                                    <Circle className="w-8 h-8" />
                                )}
                            </button>

                            {/* Content Area */}
                            <div className="flex-1 space-y-3">
                                <div className="flex items-center gap-3">
                                    <h3 className={cn(
                                        "text-xl font-bold transition-all",
                                        task.status === 'APPROVED' ? "text-neutral-500 line-through" : "text-white"
                                    )}>
                                        {task.title}
                                    </h3>
                                    {/* Priority Badge */}
                                    <Badge variant={task.priority === 'URGENT' ? 'destructive' : 'secondary'} className="text-[10px] uppercase">
                                        {task.priority || 'NORMAL'}
                                    </Badge>

                                    {/* Status Badges */}
                                    {task.status === 'COMPLETED' && (
                                        <Badge variant="outline" className="border-amber-500/50 text-amber-500 text-[10px] uppercase">
                                            Pending Approval
                                        </Badge>
                                    )}
                                </div>

                                <p className="text-neutral-400 text-sm leading-relaxed">
                                    {task.description || 'কোন বর্ণনা নেই'}
                                </p>

                                {/* Metadata Section */}
                                <div className="flex flex-wrap items-center gap-4 pt-2">
                                    <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                                        <Clock className="w-3.5 h-3.5" /> অবধি: {task.dueDate ? new Date(task.dueDate).toLocaleDateString('bn-IN') : 'নির্ধারিত নয়'}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                                        <Shield className="w-3.5 h-3.5" /> অ্যাসাইনী: {task.assignee?.name || 'অজ্ঞাত'}
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons Column */}
                            <div className="flex sm:flex-col gap-2 w-full sm:w-auto mt-4 sm:mt-0">
                                {isAdmin && task.status === 'COMPLETED' && (
                                    <Button
                                        variant="default"
                                        size="sm"
                                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                                        onClick={() => handleApproveTask(task)}
                                    >
                                        অনুমোদন করুন
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Premium Add Task Modal */}
            {isAddModalOpen && (
                <div
                    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
                    onClick={() => setIsAddModalOpen(false)}
                >
                    <div
                        className="relative w-full max-w-xl glass-card p-8 animate-fade-in-up border-white/10 my-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setIsAddModalOpen(false)}
                            className="absolute right-6 top-6 text-neutral-500 hover:text-white transition-colors"
                        >
                            ✕
                        </button>
                        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-fuchsia-400 mb-6 font-orbitron">
                            নতুন কাজ যোগ করুন (Add Task)
                        </h2>

                        <form onSubmit={handleFormSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">শিরোনাম (Title) *</label>
                                <input
                                    type="text"
                                    className="premium-input"
                                    placeholder="কাজের শিরোনাম লিখুন"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">বর্ণনা (Description)</label>
                                <textarea
                                    className="premium-input min-h-[80px] resize-none"
                                    placeholder="কাজের বিস্তারিত বিবরণ"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">অগ্রাধিকার (Priority)</label>
                                    <select
                                        className="premium-input bg-[#09090b]"
                                        value={formData.priority}
                                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                    >
                                        <option value="LOW">Low (নিম্ন)</option>
                                        <option value="MEDIUM">Medium (মাঝারি)</option>
                                        <option value="HIGH">High (উচ্চ)</option>
                                        <option value="URGENT">Urgent (জরুরী)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">অ্যাসাইনী (Assignee)</label>
                                    <select
                                        className="premium-input bg-[#09090b]"
                                        value={formData.assigneeId}
                                        onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })}
                                    >
                                        <option value="">নির্বাচন করুন (ঐচ্ছিক)</option>
                                        {members?.map((member: any) => (
                                            <option key={member.id} value={member.userId || member.id}>
                                                {member.name} {member.designation ? `(${member.designation})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">নির্ধারিত সময় (Due Date)</label>
                                <input
                                    type="date"
                                    className="premium-input [color-scheme:dark]"
                                    value={formData.dueDate}
                                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                />
                            </div>

                            {formError && <p className="text-red-400 text-xs bg-red-400/10 p-3 rounded-lg border border-red-400/20">{formError}</p>}

                            <div className="flex justify-end gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="px-6 py-3 rounded-xl hover:bg-white/5 text-neutral-400 hover:text-white transition-all font-bold"
                                >
                                    বাতিল
                                </button>
                                <button
                                    type="submit"
                                    disabled={addTaskMutation.isPending}
                                    className="premium-button"
                                >
                                    {addTaskMutation.isPending ? 'যোগ হচ্ছে...' : 'যুক্ত করুন'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
