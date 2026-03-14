'use client';

import { Building2, ChevronDown } from 'lucide-react';

export function OrganizationSwitcher() {
    return (
        <div className="flex items-center space-x-2 p-2 rounded-lg border border-white/10 hover:bg-white/5 transition-colors cursor-pointer">
            <div className="p-1 rounded bg-indigo-500/10">
                <Building2 className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="flex-1 text-left truncate">
                <span className="block text-sm font-semibold text-white truncate">জয় মা কালী সংঘ</span>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-500" />
        </div>
    );
}
