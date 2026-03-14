'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    CalendarDays,
    Users,
    BarChart3,
    Settings,
    UserCog,
    Menu,
    LogOut,
    MessageSquare,
    Image as ImageIcon,
    CheckSquare,
    FileText,
    User,
    CreditCard,
    Home
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useState, useEffect } from 'react';
import { OrganizationSwitcher } from './OrganizationSwitcher';
import { ThemeToggle } from './ThemeToggle';
import { clearAuth, getStoredUser, AuthUser } from '@/lib/auth';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const navItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Donations', href: '/dashboard/donations', icon: CreditCard },
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Festivals', href: '/dashboard/festivals', icon: CalendarDays },
    { name: 'Gallery', href: '/dashboard/gallery', icon: ImageIcon },
    { name: 'Chat', href: '/dashboard/chat', icon: MessageSquare },
    { name: 'Tasks', href: '/dashboard/tasks', icon: CheckSquare },
    { name: 'Team', href: '/dashboard/team', icon: Users },
    { name: 'Profile', href: '/dashboard/profile', icon: User },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
];

const adminItems = [
    { name: 'Puja Details', href: '/dashboard/puja-details', icon: FileText },
    // { name: 'System Settings', href: '/dashboard/settings', icon: Settings },
    // { name: 'User Management', href: '/dashboard/users', icon: UserCog },
];

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [collapsed, setCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [user, setUser] = useState<AuthUser | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        setUser(getStoredUser());
    }, []);

    // Close mobile sidebar on route change
    useEffect(() => {
        setIsMobileOpen(false);
    }, [pathname]);

    function handleSignOut() {
        clearAuth();
        router.push('/');
    }

    const isAdmin = user?.role === 'ADMIN';

    if (!mounted) return null;

    return (
        <>
            {/* Mobile Header Bar */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#0a0a0f]/80 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-6 z-[900]">
                <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center font-bold text-white text-xs">
                        DDD
                    </div>
                    <span className="font-bold text-white text-sm">সংগঠন</span>
                </div>
                <button
                    onClick={() => setIsMobileOpen(true)}
                    className="p-2 text-white/70 hover:text-white"
                >
                    <Menu className="w-6 h-6" />
                </button>
            </div>

            {/* Mobile Backdrop */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[950] lg:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            <div className={cn(
                "dashboard-sidebar",
                collapsed && "collapsed",
                isMobileOpen && "mobile-open"
            )}>
                <div className="sidebar-header flex justify-between items-center pr-4">
                    {!collapsed && (
                        <div className="flex items-center space-x-2">
                            <div className="sidebar-logo flex items-center justify-center">
                                <span className="text-white font-bold text-sm">DDD</span>
                            </div>
                            <span className="font-bold text-white">সংগঠন</span>
                        </div>
                    )}
                    {collapsed && (
                        <div className="sidebar-logo flex items-center justify-center">
                            <span className="text-white font-bold text-sm">E</span>
                        </div>
                    )}

                    {/* Close button for mobile inside sidebar */}
                    <button
                        onClick={() => setIsMobileOpen(false)}
                        className="lg:hidden p-2 text-white/50 hover:text-white"
                    >
                        ✕
                    </button>
                </div>

                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="absolute -right-3 top-20 bg-[#18181b] border border-white/10 rounded-full p-1.5 shadow-sm hover:bg-gray-800 transition-colors z-50 hidden lg:block"
                    aria-label="Toggle Sidebar"
                >
                    <Menu className="w-4 h-4 text-gray-300" />
                </button>

                <div className="sidebar-nav">
                    {!collapsed && isAdmin && (
                        <div className="px-1 mt-2">
                            <OrganizationSwitcher />
                        </div>
                    )}

                    <nav className={cn("space-y-1 mt-4", collapsed && "mt-8")}>
                        {navItems
                            .filter(item => {
                                return ['Home', 'Team', 'Chat', 'Tasks', 'Donations', 'Profile'].includes(item.name);
                            })
                            .map((item) => {
                                const isActive = pathname === item.href || (item.href !== '/dashboard/donations' && pathname?.startsWith(item.href));
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.name === 'Home' ? '/dashboard/donations' : item.href}
                                        className={cn("nav-item", isActive && "active")}
                                        title={collapsed ? item.name : undefined}
                                        onClick={() => setIsMobileOpen(false)}
                                    >
                                        <item.icon className="nav-icon" />
                                        {!collapsed && <span className="nav-text">{item.name}</span>}
                                    </Link>
                                );
                            })}

                        <div className={cn("pt-4", !mounted || !isAdmin ? "h-0 overflow-hidden" : "")}>
                            {!collapsed && (
                                <div className="px-3 mb-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Administration
                                </div>
                            )}
                            {collapsed && <div className="border-t border-white/10 my-4 mx-3" />}
                            <div className="space-y-1">
                                {adminItems.map((item) => {
                                    const isActive = pathname === item.href || pathname?.startsWith(item.href);
                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            className={cn("nav-item", isActive && "active")}
                                            title={collapsed ? item.name : undefined}
                                            onClick={() => setIsMobileOpen(false)}
                                        >
                                            <item.icon className="nav-icon" />
                                            {!collapsed && <span className="nav-text">{item.name}</span>}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    </nav>
                </div>

                <div className="sidebar-footer flex items-center justify-between">
                    <ThemeToggle />
                    {!collapsed && (
                        <div className="flex flex-col items-end gap-1">
                            {mounted && user && (
                                <span className="text-xs text-gray-500 truncate max-w-[120px]">
                                    {user.email}
                                </span>
                            )}
                            <button
                                onClick={handleSignOut}
                                className="flex items-center text-sm font-medium text-gray-400 hover:text-white transition-colors"
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Sign Out
                            </button>
                        </div>
                    )}
                    {collapsed && (
                        <button
                            onClick={handleSignOut}
                            className="text-gray-400 hover:text-white"
                            title="Sign Out"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>
        </>
    );
}
