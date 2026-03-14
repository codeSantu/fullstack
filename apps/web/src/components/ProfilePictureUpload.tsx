'use client';

import { useState, useEffect } from 'react';
import { Camera } from 'lucide-react';

interface ProfilePictureUploadProps {
    onUploadSuccess?: (url: string) => void;
}

export function ProfilePictureUpload({ onUploadSuccess }: ProfilePictureUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [profileUrl, setProfileUrl] = useState<string | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const extension = file.name.split('.').pop();
            const filename = `profile-${Date.now()}.${extension}`;
            
            const base = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';
            const uploadUrl = `${base}/uploads/${filename}`;

            const res = await fetch(uploadUrl, {
                method: 'PUT',
                body: file,
                headers: {
                    'Content-Type': file.type
                }
            });

            if (!res.ok) throw new Error('Upload failed');
            
            const data = await res.json();
            setProfileUrl(data.url);
            onUploadSuccess?.(data.url);
        } catch (err) {
            console.error('Upload failed', err);
            alert('ছবি আপলোড করতে সমস্যা হয়েছে');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="relative group">
            <label 
                htmlFor="picture-upload" 
                className={cn(
                    "cursor-pointer flex items-center justify-center w-10 h-10 rounded-2xl bg-indigo-600 text-white shadow-xl hover:bg-indigo-500 transition-all active:scale-95",
                    uploading && "opacity-50 cursor-not-allowed animate-pulse"
                )}
                title="Change Profile Picture"
            >
                <Camera className="w-5 h-5" />
            </label>
            <input
                id="picture-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                disabled={uploading}
            />
        </div>
    );
}

// Simple cn utility if not globally available here
function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}
