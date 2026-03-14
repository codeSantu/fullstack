'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authHeader, clearAuth } from '@/lib/auth';

interface Props {
    onUploadSuccess: (url: string) => void;
}

export function FestivalBannerUpload({ onUploadSuccess }: Props) {
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const router = useRouter();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);

        setIsUploading(true);
        setError(null);

        try {
            // 1. Get Presigned URL from our NestJS Backend
            const base = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';
            const presignedRes = await fetch(`${base}/festivals/upload-url`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeader(),
                },
                body: JSON.stringify({
                    filename: `${Date.now()}-${file.name}`,
                    contentType: file.type,
                }),
            });

            if (presignedRes.status === 401) {
                clearAuth();
                router.push('/');
                throw new Error('Authentication required to upload banner.');
            }

            if (!presignedRes.ok) throw new Error('Failed to get upload URL');
            const { url } = await presignedRes.json();

            // 2. Upload file securely & directly (Works for BOTH real S3 and Virtual S3 Provider)
            const uploadRes = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': file.type,
                },
                body: file,
            });

            if (!uploadRes.ok) throw new Error('Failed to upload file');

            // 3. Inform parent component
            const finalUrl = url.split('?')[0];
            onUploadSuccess(finalUrl);

        } catch (err: any) {
            console.error('Upload Error:', err);
            setError(err.message || 'Error occurred during upload');
        } finally {
            setIsUploading(false);
        }
    };

    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    return (
        <div className="w-full">
            <label className="block text-sm font-medium text-neutral-300 mb-2">Festival Banner</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-white/20 border-dashed rounded-xl hover:border-fuchsia-500 hover:bg-white/5 transition-colors group cursor-pointer">
                <div className="space-y-1 text-center">
                    <svg className="mx-auto h-12 w-12 text-neutral-400 group-hover:text-fuchsia-400 transition-colors" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="flex text-sm text-neutral-400 justify-center">
                        <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-fuchsia-500 hover:text-fuchsia-400 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-fuchsia-500">
                            <span>Upload a file</span>
                            <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} disabled={isUploading} accept="image/*" />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-neutral-500">PNG, JPG, GIF up to 10MB</p>
                </div>
            </div>
            {previewUrl && (
                <div className="mt-3">
                    <p className="text-xs font-medium text-neutral-300 mb-1">Live preview</p>
                    <div className="inline-block overflow-hidden rounded-lg border border-white/15 bg-black/20">
                        <img
                            src={previewUrl}
                            alt="Selected banner preview"
                            className="h-32 w-full max-w-sm object-cover"
                        />
                    </div>
                </div>
            )}
            {isUploading && <p className="mt-2 text-sm text-fuchsia-400 animate-pulse">Uploading securely to S3...</p>}
            {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        </div>
    );
}
