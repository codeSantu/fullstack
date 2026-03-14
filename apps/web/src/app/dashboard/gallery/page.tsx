'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ImageIcon, Plus } from 'lucide-react';

export default function GalleryPage() {
    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">গ্যালারি (Gallery)</h1>
                    <p className="text-muted-foreground">উৎসব এবং পূজার বিশেষ মুহূর্তগুলো দেখুন</p>
                </div>
                <Button className="gap-2">
                    <Plus className="w-4 h-4" /> ছবি আপলোড করুন
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* Mock gallery items for now */}
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card key={i} className="overflow-hidden group cursor-pointer hover:border-primary transition-all">
                        <div className="aspect-video bg-muted flex items-center justify-center relative">
                            <ImageIcon className="w-8 h-8 opacity-20" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-white text-sm font-medium">বিস্তারিত দেখুন</span>
                            </div>
                        </div>
                        <CardContent className="p-3">
                            <p className="text-sm font-medium truncate">চিত্রপট {i}</p>
                            <p className="text-xs text-muted-foreground">১৪ মার্চ ২০২৬</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
