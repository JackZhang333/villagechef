'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { ImagePlus, Loader2, X, Camera } from 'lucide-react'
import COS from 'cos-js-sdk-v5'
import { toast } from 'sonner'

interface ImageUploadProps {
    value?: string | null
    onChange: (url: string) => void
    onRemove: () => void
    className?: string
}

export function ImageUpload({
    value,
    onChange,
    onRemove,
    className = ''
}: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('请选择图片文件')
            return
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('图片大小不能超过 5MB')
            return
        }

        try {
            setIsUploading(true)
            setUploadProgress(0)

            // 1. Get credentials AND config (bucket/region) from backend
            const response = await fetch('/api/cos/sts')
            const data = await response.json()

            if (data.error) {
                throw new Error(`${data.error}: ${data.details || ''}`)
            }

            const { bucket, region, credentials, startTime, expiredTime } = data

            // 2. Initialize COS client
            const cos = new COS({
                getAuthorization: (options, callback) => {
                    callback({
                        TmpSecretId: credentials.tmpSecretId,
                        TmpSecretKey: credentials.tmpSecretKey,
                        SecurityToken: credentials.sessionToken,
                        StartTime: startTime,
                        ExpiredTime: expiredTime,
                    })
                },
            })

            const fileName = `${Date.now()}-${file.name}`
            const key = `dishes/${fileName}`

            // 3. Perform upload
            cos.putObject({
                Bucket: bucket,
                Region: region,
                Key: key,
                Body: file,
                onProgress: (progressData) => {
                    setUploadProgress(Math.round(progressData.percent * 100))
                },
            }, (err, uploadData) => {
                setIsUploading(false)
                if (err) {
                    console.error('COS Upload Error:', err)
                    toast.error(`上传失败: ${err.message || '未知错误'}`)
                    return
                }

                const url = `https://${uploadData.Location}`
                onChange(url)
                toast.success('上传成功')
            })

        } catch (error: any) {
            console.error('Upload error:', error)
            setIsUploading(false)
            toast.error(error.message || '上传出错')
        }
    }

    const triggerUpload = () => {
        fileInputRef.current?.click()
    }

    return (
        <div className={`space-y-4 w-full ${className}`}>
            <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleUpload}
            />

            {value ? (
                <div className="relative group aspect-square w-full max-w-[200px] mx-auto rounded-[32px] overflow-hidden border-2 border-zinc-100 shadow-sm transition-all hover:shadow-md">
                    <img
                        src={value}
                        alt="Upload"
                        className="object-cover w-full h-full"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="rounded-full bg-white/20 border-white/40 hover:bg-white/40 text-white"
                            onClick={triggerUpload}
                        >
                            <Camera className="w-4 h-4" />
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="rounded-full"
                            onClick={onRemove}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={triggerUpload}
                    disabled={isUploading}
                    className="w-full max-w-[200px] mx-auto aspect-square flex flex-col items-center justify-center gap-4 rounded-[32px] border-2 border-dashed border-zinc-200 bg-zinc-50 hover:bg-zinc-100 hover:border-zinc-300 transition-all group disabled:opacity-50"
                >
                    {isUploading ? (
                        <div className="flex flex-col items-center gap-2">
                            <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
                            <span className="text-sm font-bold text-zinc-400">{uploadProgress}%</span>
                        </div>
                    ) : (
                        <>
                            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-zinc-400 group-hover:scale-110 transition-transform">
                                <ImagePlus className="w-6 h-6" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-bold text-zinc-500">上传菜品图片</p>
                                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-1">支持 JPG/PNG, 5MB以内</p>
                            </div>
                        </>
                    )}
                </button>
            )}
        </div>
    )
}
