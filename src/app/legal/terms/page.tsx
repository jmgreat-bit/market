'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Scale } from 'lucide-react';

export default function TermsPage() {
    const router = useRouter();
    const lastUpdated = "June 29, 2026";

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
                        <h2 className="font-display font-bold text-xl">Terms of Service</h2>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Last Updated: {lastUpdated}</p>
                    </div>
                </div>

                <section className="space-y-4">
                    <h3 className="font-display font-bold text-xl text-accent">1. Introduction</h3>
                    <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                        <p>
                            These Terms of Service (&quot;Terms&quot;) govern your access to and use of MarketPLC (also known as GeoPulse), a digital marketplace platform operated by <strong className="text-foreground">SynchroSphere Ltd</strong>, a company registered in Rwanda (TIN: 156004518).
                        </p>
                        <p>
                            By creating an account or using the platform, you agree to be bound by these Terms, our <Link href="/legal/privacy" className="text-primary hover:underline font-medium">Privacy Policy</Link>, and all applicable laws, including <strong className="text-foreground">Law Nº 058/2021</strong> of 13/10/2021 relating to the protection of personal data and privacy in Rwanda.
                        </p>
                    </div>
                </section>

                <section className="space-y-4">
                    <h3 className="font-display font-bold text-xl text-accent">2. User Roles</h3>
                    <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                        <p><strong className="text-foreground">Explorers (Consumers):</strong> Users who browse the platform to discover local businesses, products, and services. Explorers may view vendor listings, search for businesses, leave comments, and interact with posts.</p>
                        <p><strong className="text-foreground">Vendors (Traders):</strong> Business owners who register their physical shops on the platform. Vendors may create posts, list their products and services, and interact with Explorers. Vendors agree to provide accurate, truthful business information including location, operating hours, and contact details.</p>
                    </div>
                </section>

                <section className="space-y-4">
                    <h3 className="font-display font-bold text-xl text-accent">3. Account Registration & Security</h3>
                    <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                        <p>You must provide a valid email address and create a secure password (minimum 8 characters, including at least one letter and one number) to register.</p>
                        <p>You are solely responsible for maintaining the confidentiality of your login credentials. We strongly recommend enabling <strong className="text-foreground">Multi-Factor Authentication (MFA)</strong> via the Security settings in your account to add an additional layer of protection.</p>
                        <p>SynchroSphere Ltd is not liable for any unauthorized access to your account resulting from your failure to secure your credentials.</p>
                    </div>
                </section>

                <section className="space-y-4">
                    <h3 className="font-display font-bold text-xl text-accent">4. Acceptable Use</h3>
                    <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                        <li>You shall not use the platform for any unlawful, fraudulent, or harmful purpose.</li>
                        <li>You shall not impersonate another person or misrepresent your identity or business.</li>
                        <li>You shall not post content that is defamatory, obscene, threatening, or violates any third-party rights.</li>
                        <li>You shall not attempt to gain unauthorized access to any part of the platform, other user accounts, or our systems.</li>
                        <li>Vendors shall not provide false or misleading business information.</li>
                    </ul>
                </section>

                <section className="space-y-4">
                    <h3 className="font-display font-bold text-xl text-accent">5. Data Processing & Privacy</h3>
                    <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                        <p>
                            Your personal data is processed in accordance with our <Link href="/legal/privacy" className="text-primary hover:underline font-medium">Privacy Policy</Link> and Rwandan data protection law. By using MarketPLC, you consent to the collection and processing of your data as described in our Privacy Policy.
                        </p>
                        <p>
                            Your data is stored on secure cloud infrastructure (Supabase/AWS) located in the <strong className="text-foreground">United States and Germany</strong>. All data transfers are protected by Standard Contractual Clauses and industry-standard encryption.
                        </p>
                        <p>
                            You have the right to access, correct, or delete your personal data at any time. For full details, see our <Link href="/legal/rights" className="text-primary hover:underline font-medium">Data Subject Rights</Link> page.
                        </p>
                    </div>
                </section>

                <section className="space-y-4">
                    <h3 className="font-display font-bold text-xl text-accent">6. Intellectual Property</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                        All platform content, design, code, and branding are the intellectual property of SynchroSphere Ltd. Users retain ownership of their own user-generated content (posts, comments, images) but grant SynchroSphere Ltd a non-exclusive, royalty-free license to display and distribute that content within the platform.
                    </p>
                </section>

                <section className="space-y-4">
                    <h3 className="font-display font-bold text-xl text-accent">7. Limitation of Liability</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground italic">
                        MarketPLC is a marketplace discovery platform. While we verify vendor registration, SynchroSphere Ltd is not responsible for the quality, safety, legality, or accuracy of goods and services offered by independent vendors listed on the platform. All transactions between Explorers and Vendors are conducted at the parties&apos; own risk.
                    </p>
                </section>

                <section className="space-y-4">
                    <h3 className="font-display font-bold text-xl text-accent">8. Account Termination</h3>
                    <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                        <p>You may delete your account at any time through Menu → Delete Account. Upon deletion, all your personal data will be permanently removed from our systems.</p>
                        <p>We reserve the right to suspend or terminate accounts that violate these Terms, engage in fraudulent activity, or provide false business information, without prior notice.</p>
                    </div>
                </section>

                <section className="space-y-4">
                    <h3 className="font-display font-bold text-xl text-accent">9. Governing Law & Dispute Resolution</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                        These Terms are governed by the laws of the Republic of Rwanda. Any disputes arising from the use of this platform shall be resolved through negotiation in good faith, and if unresolved, through the competent courts of Rwanda.
                    </p>
                </section>

                <section className="space-y-4 p-6 rounded-2xl bg-secondary/30 border border-border/50">
                    <h3 className="font-display font-bold text-xl">10. Contact Us</h3>
                    <div className="text-sm leading-relaxed text-muted-foreground space-y-1">
                        <p><strong className="text-foreground">SynchroSphere Ltd</strong></p>
                        <p>Data Protection Officer: James Uwingeneye</p>
                        <p>Email: synchrosphere@proton.me</p>
                        <p>TIN: 156004518</p>
                    </div>
                </section>

                <div className="text-center pt-10 pb-20">
                    <p className="text-xs text-muted-foreground">© 2026 SynchroSphere Ltd. All rights reserved.</p>
                </div>
            </main>
        </div>
    );
}
