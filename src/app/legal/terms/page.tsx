'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, FileText, Scale } from 'lucide-react';

export default function TermsPage() {
    const router = useRouter();
    const lastUpdated = "April 26, 2026";

    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
            <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl px-6 h-16 flex items-center gap-4 border-b border-border/10">
                <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-secondary transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="font-display font-bold text-lg">Terms of Service</h1>
            </header>

            <main className="pt-24 px-6 max-w-2xl mx-auto space-y-8">
                <div className="flex items-center gap-4 p-6 rounded-2xl bg-accent/5 border border-accent/10">
                    <Scale className="w-10 h-10 text-accent" />
                    <div>
                        <h2 className="font-display font-bold text-xl">Usage Rules</h2>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Last Updated: {lastUpdated}</p>
                    </div>
                </div>

                <section className="space-y-4">
                    <h3 className="font-display font-bold text-xl text-accent">1. Account Responsibility</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                        Users are responsible for maintaining the confidentiality of their login credentials. <strong>SynchroSphere Ltd</strong> is not liable for any loss resulting from unauthorized access to your account.
                    </p>
                </section>

                <section className="space-y-4">
                    <h3 className="font-display font-bold text-xl text-accent">2. Marketplace Conduct</h3>
                    <div className="space-y-3 text-sm text-muted-foreground">
                        <p><strong>Vendors:</strong> You agree to provide accurate and up-to-date business information, including location and operating hours.</p>
                        <p><strong>Explorers:</strong> You agree to use the platform for its intended purpose of discovering and contacting local services.</p>
                    </div>
                </section>

                <section className="space-y-4">
                    <h3 className="font-display font-bold text-xl text-accent">3. Limitation of Liability</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground italic">
                        SynchroSphere is an R&D marketplace platform. While we verify vendor registration via TIN, we are not responsible for the quality of services or goods provided by independent vendors listed on the platform.
                    </p>
                </section>

                <section className="space-y-4">
                    <h3 className="font-display font-bold text-xl text-accent">4. Termination</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                        We reserve the right to suspend or terminate accounts that violate these terms or provide fraudulent information.
                    </p>
                </section>

                <div className="text-center pt-10 pb-20">
                    <p className="text-xs text-muted-foreground">© 2026 SynchroSphere Ltd. All rights reserved.</p>
                </div>
            </main>
        </div>
    );
}
