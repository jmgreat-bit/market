'use client';

import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { 
    X, 
    Download, 
    Printer, 
    Share2, 
    Check, 
    Store, 
    Smartphone
} from 'lucide-react';
import TraderBadge from '@/components/ui/TraderBadge';

interface ProfileQrModalProps {
    isOpen: boolean;
    onClose: () => void;
    profile: {
        id?: string;
        full_name?: string | null;
        username?: string | null;
        avatar_url?: string | null;
        trader_tier?: string | null;
        role?: string;
        bio?: string | null;
    };
    businessName?: string | null;
    category?: string | null;
    address?: string | null;
}

export default function ProfileQrModal({
    isOpen,
    onClose,
    profile,
    businessName,
    category,
    address,
}: ProfileQrModalProps) {
    const [qrDataUrl, setQrDataUrl] = useState<string>('');
    const [isCopied, setIsCopied] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    const displayName = businessName || profile.full_name || `@${profile.username || 'unknown'}`;
    const isTrader = profile.role === 'trader';
    const usernameStr = profile.username ? profile.username.toLowerCase() : 'unknown';

    // Generate permanent URL
    const getProfileUrl = () => {
        if (typeof window !== 'undefined') {
            const host = window.location.origin.includes('localhost') 
                ? window.location.origin 
                : 'https://www.synchromarket.com';
            return `${host}/u/${usernameStr}`;
        }
        return `https://www.synchromarket.com/u/${usernameStr}`;
    };

    const shareUrl = getProfileUrl();

    useEffect(() => {
        if (isOpen && usernameStr) {
            QRCode.toDataURL(shareUrl, {
                width: 480,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF',
                },
                errorCorrectionLevel: 'H'
            })
            .then((url: string) => setQrDataUrl(url))
            .catch((err: Error) => console.error('Failed to generate QR code:', err));
        }
    }, [isOpen, usernameStr, shareUrl]);

    if (!isOpen) return null;

    const handleCopy = async () => {
        await navigator.clipboard.writeText(shareUrl);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${displayName} on SynchroMarket`,
                    text: `Visit ${displayName} on SynchroMarket to explore live deals and updates!`,
                    url: shareUrl,
                });
            } catch (e) {
                console.log('Share cancelled or failed:', e);
            }
        } else {
            handleCopy();
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleDownload = async () => {
        if (!qrDataUrl) return;
        setIsDownloading(true);

        try {
            // Draw a high-res canvas poster (1200 x 1600) for downloading
            const canvas = document.createElement('canvas');
            canvas.width = 1200;
            canvas.height = 1600;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Background gradient (#0a0a0f to #111827)
            const bgGrad = ctx.createLinearGradient(0, 0, 0, 1600);
            bgGrad.addColorStop(0, '#0a0a0f');
            bgGrad.addColorStop(1, '#0f172a');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, 1200, 1600);

            // Subtle neon glow circle
            const glowGrad = ctx.createRadialGradient(600, 400, 50, 600, 400, 500);
            glowGrad.addColorStop(0, 'rgba(6, 182, 212, 0.15)');
            glowGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
            ctx.fillStyle = glowGrad;
            ctx.fillRect(0, 0, 1200, 800);

            // Top Header: Logo + SynchroMarket
            ctx.fillStyle = '#ffffff';
            ctx.font = '900 48px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('SYNCHROMARKET', 600, 140);

            ctx.fillStyle = '#06b6d4';
            ctx.font = '600 24px Inter, sans-serif';
            ctx.fillText('DISCOVER LOCAL PULSES', 600, 180);

            // Card Container (White card for maximum QR contrast)
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.roundRect(150, 240, 900, 1150, 40);
            ctx.fill();

            // Store Name inside Card
            ctx.fillStyle = '#0f172a';
            ctx.font = '800 52px Inter, sans-serif';
            ctx.fillText(displayName.substring(0, 26), 600, 360);

            // Category & Handle
            ctx.fillStyle = '#64748b';
            ctx.font = '600 28px Inter, sans-serif';
            const subtext = `${isTrader && category ? `${category} • ` : ''}@${usernameStr}`;
            ctx.fillText(subtext, 600, 410);

            // QR Code Image
            const qrImg = new Image();
            qrImg.crossOrigin = 'anonymous';
            qrImg.src = qrDataUrl;
            await new Promise((res) => { qrImg.onload = res; });
            ctx.drawImage(qrImg, 260, 470, 680, 680);

            // Scan instruction inside card
            ctx.fillStyle = '#0f172a';
            ctx.font = '700 32px Inter, sans-serif';
            ctx.fillText('Scan with camera to visit shop', 600, 1220);

            ctx.fillStyle = '#06b6d4';
            ctx.font = '600 26px Inter, sans-serif';
            ctx.fillText(`synchromarket.com/u/${usernameStr}`, 600, 1270);

            // Footer at bottom of poster
            ctx.fillStyle = '#94a3b8';
            ctx.font = '500 24px Inter, sans-serif';
            ctx.fillText('Powered by SynchroMarket • Live Local Deals', 600, 1480);

            // Download Trigger
            const link = document.createElement('a');
            link.download = `${usernameStr}-synchromarket-qr.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) {
            console.error('Download card error:', err);
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
            {/* Modal Box */}
            <div className="relative w-full max-w-md bg-card/95 border border-border/40 rounded-3xl p-6 shadow-2xl overflow-hidden text-foreground">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-9 h-9 rounded-full bg-secondary/80 hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors z-20 cursor-pointer"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Printable Section */}
                <div ref={cardRef} className="print-qr-section flex flex-col items-center text-center pt-2">
                    {/* Brand Banner */}
                    <div className="flex items-center gap-2 mb-4">
                        <img src="/logo.png" alt="SynchroMarket" className="w-6 h-6 object-contain" />
                        <span className="font-display font-black tracking-tight text-lg text-foreground">
                            Synchro<span className="text-primary">Market</span>
                        </span>
                    </div>

                    {/* QR Code Card Wrapper */}
                    <div className="w-full bg-white text-slate-900 rounded-2xl p-6 shadow-lg border border-slate-200 flex flex-col items-center">
                        {/* Avatar / Business Icon */}
                        <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-100 border-2 border-primary flex items-center justify-center mb-3 shadow-sm">
                            {profile.avatar_url ? (
                                <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                            ) : (
                                <Store className="w-7 h-7 text-primary" />
                            )}
                        </div>

                        {/* Title & Info */}
                        <h2 className="font-display font-bold text-xl text-slate-900 tracking-tight flex items-center gap-1.5 line-clamp-1">
                            {displayName}
                            {isTrader && <TraderBadge tier={(profile.trader_tier as any) || 'free'} />}
                        </h2>
                        <p className="text-xs font-semibold text-slate-500 mt-0.5">
                            @{usernameStr} {isTrader && category ? `• ${category}` : ''}
                        </p>
                        {address && (
                            <p className="text-[11px] text-slate-400 mt-1 max-w-[240px] truncate">
                                📍 {address}
                            </p>
                        )}

                        {/* QR Code Container */}
                        <div className="my-4 p-2 bg-white rounded-xl shadow-inner border border-slate-100">
                            {qrDataUrl ? (
                                <img
                                    src={qrDataUrl}
                                    alt={`QR Code for ${displayName}`}
                                    className="w-56 h-56 object-contain"
                                />
                            ) : (
                                <div className="w-56 h-56 flex items-center justify-center text-xs text-slate-400">
                                    Generating QR...
                                </div>
                            )}
                        </div>

                        {/* Instruction */}
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                            <Smartphone className="w-4 h-4 text-cyan-600" />
                            <span>Scan with any camera to visit shop</span>
                        </div>
                        <span className="text-[10px] font-mono text-cyan-600 mt-1">
                            synchromarket.com/u/{usernameStr}
                        </span>
                    </div>
                </div>

                {/* Action Buttons Toolbar */}
                <div className="grid grid-cols-3 gap-2 mt-5 no-print">
                    {/* Download */}
                    <button
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-secondary/80 hover:bg-secondary text-foreground text-xs font-bold border border-border/30 hover:border-primary/50 transition-all cursor-pointer"
                    >
                        <Download className="w-4 h-4 text-primary" />
                        <span>{isDownloading ? 'Saving...' : 'Download'}</span>
                    </button>

                    {/* Print Stand */}
                    <button
                        onClick={handlePrint}
                        className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-secondary/80 hover:bg-secondary text-foreground text-xs font-bold border border-border/30 hover:border-primary/50 transition-all cursor-pointer"
                    >
                        <Printer className="w-4 h-4 text-primary" />
                        <span>Print Stand</span>
                    </button>

                    {/* Share / Copy */}
                    <button
                        onClick={handleShare}
                        className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-primary text-primary-foreground text-xs font-bold shadow-geo-glow hover:opacity-95 transition-all cursor-pointer"
                    >
                        {isCopied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                        <span>{isCopied ? 'Copied!' : 'Share'}</span>
                    </button>
                </div>

                {/* Print Styles for physical printing */}
                <style jsx global>{`
                    @media print {
                        body * {
                            visibility: hidden;
                        }
                        .print-qr-section, .print-qr-section * {
                            visibility: visible;
                        }
                        .print-qr-section {
                            position: absolute;
                            left: 50%;
                            top: 50%;
                            transform: translate(-50%, -50%);
                            width: 100%;
                            max-width: 500px;
                            padding: 20px;
                        }
                        .no-print {
                            display: none !important;
                        }
                    }
                `}</style>
            </div>
        </div>
    );
}
