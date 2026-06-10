'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, ShieldCheck, FileText } from 'lucide-react';

export default function PrivacyPage() {
    const router = useRouter();
    const lastUpdated = "April 26, 2026";

    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
            <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl px-6 h-16 flex items-center gap-4 border-b border-border/10">
                <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-secondary transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="font-display font-bold text-lg">Privacy Policy</h1>
            </header>

            <main className="pt-24 px-6 max-w-2xl mx-auto space-y-8">
                <div className="flex items-center gap-4 p-6 rounded-2xl bg-primary/5 border border-primary/10">
                    <ShieldCheck className="w-10 h-10 text-primary" />
                    <div>
                        <h2 className="font-display font-bold text-xl">Your Data is Protected</h2>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Last Updated: {lastUpdated}</p>
                    </div>
                </div>

                <section className="space-y-4">
                    <h3 className="font-display font-bold text-xl text-primary">1. What We Collect</h3>
                    <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
                        <p><strong>For Explorers:</strong> We collect your name, email address, phone number, and real-time GPS location to help you discover local vendors.</p>
                        <p><strong>For Vendors:</strong> We collect your business name, physical address, contact details, and service categories for marketplace listing and verification.</p>
                    </div>
                </section>

                <section className="space-y-4">
                    <h3 className="font-display font-bold text-xl text-primary">2. How We Use Your Data</h3>
                    <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                        <li><strong>Service Provision:</strong> To provide a real-time marketplace showing vendor locations.</li>
                        <li><strong>Authentication:</strong> To manage secure access to your account.</li>
                        <li><strong>Communication:</strong> To facilitate contact between customers and vendors.</li>
                        <li><strong>AI Chat & Model Training:</strong> Any queries, questions, or interactions you have with the AI Discovery tool are securely logged and stored in our database. We use this anonymized conversation history exclusively to improve the AI's accuracy and to fine-tune our own internal machine learning models to better serve the Rwandan marketplace.</li>
                    </ul>
                </section>

                <section className="space-y-4">
                    <h3 className="font-display font-bold text-xl text-primary">3. Data Storage & International Transfer</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                        To ensure high availability, your data is stored on secure cloud infrastructure (Supabase/AWS) located in the <strong>United States and Germany</strong>. We use industry-standard encryption (AES-256) and Row Level Security (RLS) to protect your information at all times.
                    </p> section
                </section>

                <section className="space-y-4 p-6 rounded-2xl bg-secondary/30 border border-border/50">
                    <h3 className="font-display font-bold text-xl">4. Your Rights</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                        Under Rwanda&apos;s Law Nº 058/2021, you have the right to access your personal data, request corrections for inaccuracies, and request the deletion of your account and related information.
                    </p>
                </section>

                <div className="text-center pt-10 pb-20">
                    <p className="text-xs text-muted-foreground">© 2026 SynchroSphere Ltd. All rights reserved.</p>
                </div>
            </main>
        </div>
    );
}
