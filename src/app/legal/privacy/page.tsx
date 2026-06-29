'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, ShieldCheck, FileText } from 'lucide-react';

export default function PrivacyPage() {
    const router = useRouter();
    const lastUpdated = "June 29, 2026";

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
                    <ShieldCheck className="w-10 h-10 text-primary flex-shrink-0" />
                    <div>
                        <h2 className="font-display font-bold text-xl">Privacy Notice</h2>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Last Updated: {lastUpdated}</p>
                    </div>
                </div>

                {/* 1. Introduction */}
                <section className="space-y-4">
                    <h3 className="font-display font-bold text-xl text-primary">1. Introduction</h3>
                    <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                        <p>
                            Welcome to <strong>MarketPLC</strong>, a location-based marketplace platform operated by <strong>SynchroSphere Ltd</strong> (TIN: 156004518), a company registered under the laws of the Republic of Rwanda.
                        </p>
                        <p>
                            This Privacy Notice explains how we collect, use, store, share, and protect your personal data when you use the MarketPLC application and related services. It applies to all users, including <strong>Explorers</strong> (consumers who browse and discover local shops) and <strong>Vendors</strong> (traders who register and manage their shops on the platform).
                        </p>
                        <p>
                            This notice is issued in compliance with <strong>Law Nº 058/2021 of 13/10/2021</strong> relating to the protection of personal data and privacy in Rwanda, and all applicable regulations thereunder.
                        </p>
                        <p>
                            By creating an account or using MarketPLC, you acknowledge that you have read, understood, and agree to this Privacy Notice.
                        </p>
                    </div>
                </section>

                {/* 2. Data Controller */}
                <section className="space-y-4 p-6 rounded-2xl bg-secondary/30 border border-border/50">
                    <h3 className="font-display font-bold text-xl">2. Data Controller &amp; Data Protection Officer</h3>
                    <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                        <p>The data controller responsible for your personal data is:</p>
                        <div className="pl-4 border-l-2 border-primary/30 space-y-1">
                            <p><strong>SynchroSphere Ltd</strong></p>
                            <p>TIN: 156004518</p>
                            <p>Kigali, Rwanda</p>
                        </div>
                        <p>Our designated Data Protection Officer (DPO) is:</p>
                        <div className="pl-4 border-l-2 border-primary/30 space-y-1">
                            <p><strong>James Uwingeneye</strong> — Managing Director</p>
                            <p>Email: <a href="mailto:synchrosphere@proton.me" className="text-primary underline">synchrosphere@proton.me</a></p>
                        </div>
                        <p>
                            You may contact our DPO at any time regarding questions about this notice, data processing activities, or to exercise your data protection rights.
                        </p>
                    </div>
                </section>

                {/* 3. What Data We Collect */}
                <section className="space-y-4">
                    <h3 className="font-display font-bold text-xl text-primary">3. What Personal Data We Collect</h3>
                    <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
                        <p>We collect and process the following categories of personal data depending on your user type and interaction with the platform:</p>

                        <div className="space-y-1">
                            <p className="font-bold text-foreground">a) Authentication Data</p>
                            <ul className="list-disc list-inside space-y-1 pl-2">
                                <li>Email address (used as your unique identifier)</li>
                                <li>Password (stored as a bcrypt hash — we never store or have access to your plain-text password)</li>
                            </ul>
                        </div>

                        <div className="space-y-1">
                            <p className="font-bold text-foreground">b) Profile Data</p>
                            <ul className="list-disc list-inside space-y-1 pl-2">
                                <li>Display name</li>
                                <li>Profile avatar/photo</li>
                                <li>User type (Explorer or Vendor)</li>
                            </ul>
                        </div>

                        <div className="space-y-1">
                            <p className="font-bold text-foreground">c) Business Data (Vendors Only)</p>
                            <ul className="list-disc list-inside space-y-1 pl-2">
                                <li>Business/shop name</li>
                                <li>Phone number</li>
                                <li>Physical business address</li>
                                <li>GPS coordinates (permanent — used to display your shop on the map)</li>
                                <li>Social media links (optional)</li>
                                <li>Business categories and descriptions</li>
                            </ul>
                        </div>

                        <div className="space-y-1">
                            <p className="font-bold text-foreground">d) Geolocation Data</p>
                            <ul className="list-disc list-inside space-y-1 pl-2">
                                <li><strong>Vendors:</strong> GPS coordinates are stored permanently as part of your shop listing to enable map-based discovery.</li>
                                <li><strong>Explorers:</strong> GPS location is accessed temporarily in real-time to display nearby shops. It is <strong>never stored</strong> in our database and is discarded once the session ends.</li>
                            </ul>
                        </div>

                        <div className="space-y-1">
                            <p className="font-bold text-foreground">e) User-Generated Content</p>
                            <ul className="list-disc list-inside space-y-1 pl-2">
                                <li>Posts and community contributions</li>
                                <li>Comments and replies</li>
                                <li>Uploaded images associated with posts</li>
                            </ul>
                        </div>

                        <div className="space-y-1">
                            <p className="font-bold text-foreground">f) Application Analytics</p>
                            <ul className="list-disc list-inside space-y-1 pl-2">
                                <li>Search queries (aggregated and anonymized for service improvement)</li>
                                <li>Page/shop view counts (aggregated, not linked to individual users)</li>
                            </ul>
                        </div>

                        <div className="space-y-1">
                            <p className="font-bold text-foreground">g) AI Interaction Data</p>
                            <ul className="list-disc list-inside space-y-1 pl-2">
                                <li>Queries submitted to the AI Discovery chat feature are stored to improve the quality, relevance, and accuracy of responses.</li>
                                <li>This data may be used in anonymized form for internal model training and fine-tuning.</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* 4. Legal Basis for Processing */}
                <section className="space-y-4">
                    <h3 className="font-display font-bold text-xl text-primary">4. Legal Basis for Processing</h3>
                    <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                        <p>In accordance with Law Nº 058/2021, we process your personal data based on the following legal grounds:</p>
                        <ul className="list-disc list-inside space-y-2 pl-2">
                            <li><strong>Consent (Article 34):</strong> You provide consent when creating your account and agreeing to this Privacy Notice. For Explorers, location access is granted through explicit browser/device permission. You may withdraw consent at any time.</li>
                            <li><strong>Contractual Necessity:</strong> Processing is necessary to perform our contract with you — i.e., to provide the MarketPLC service, display your shop listing (Vendors), or enable marketplace discovery (Explorers).</li>
                            <li><strong>Legitimate Interest:</strong> We process certain data for legitimate interests such as platform security, fraud prevention, service improvement, and analytics — provided these interests do not override your fundamental rights.</li>
                            <li><strong>Legal Obligation:</strong> We may retain certain data (e.g., financial and transaction records) to comply with Rwandan tax law and other regulatory requirements.</li>
                        </ul>
                    </div>
                </section>

                {/* 5. International Data Transfers */}
                <section className="space-y-4 p-6 rounded-2xl bg-secondary/30 border border-border/50">
                    <h3 className="font-display font-bold text-xl">5. International Data Transfers</h3>
                    <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                        <p>
                            Your personal data is stored on secure cloud infrastructure provided by <strong>Supabase</strong> (powered by Amazon Web Services) with servers located in the <strong>United States</strong> and <strong>Germany</strong>.
                        </p>
                        <p>We use the following third-party service providers who may process your data outside Rwanda:</p>
                        <ul className="list-disc list-inside space-y-2 pl-2">
                            <li><strong>Supabase</strong> — Database hosting, authentication, and file storage (SOC 2 Type II certified)</li>
                            <li><strong>Vercel</strong> — Application hosting and edge deployment (SOC 2 Type II certified)</li>
                            <li><strong>GitHub</strong> — Source code hosting and CI/CD (SOC 2 Type II, ISO 27001 certified)</li>
                            <li><strong>Google Workspace</strong> — Business communications (SOC 2/3, ISO 27001 certified)</li>
                        </ul>
                        <p>
                            All international transfers are conducted with appropriate safeguards, including <strong>Standard Contractual Clauses (SCCs)</strong> approved by relevant data protection authorities. Each provider maintains industry-recognized security certifications and undergoes regular independent audits.
                        </p>
                        <p>
                            In accordance with Article 50 of Law Nº 058/2021, we ensure that these transfers do not diminish the level of protection afforded to your personal data under Rwandan law.
                        </p>
                    </div>
                </section>

                {/* 6. Data Retention */}
                <section className="space-y-4">
                    <h3 className="font-display font-bold text-xl text-primary">6. Data Retention</h3>
                    <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                        <p>We retain your personal data only for as long as necessary to fulfill the purposes outlined in this notice:</p>
                        <ul className="list-disc list-inside space-y-2 pl-2">
                            <li><strong>Active Accounts:</strong> Your data is retained for as long as your account remains active and you continue to use the service.</li>
                            <li><strong>Account Deletion:</strong> When you delete your account, all associated personal data — including profile information, posts, comments, and business listings — is <strong>permanently and irreversibly removed</strong> through cascading deletion. This process is automated and cannot be undone.</li>
                            <li><strong>Financial Records:</strong> Any financial or tax-related records are retained for a minimum of <strong>5 years</strong> as required by Rwandan tax legislation, after which they are securely destroyed.</li>
                            <li><strong>Anonymized Data:</strong> Aggregated, anonymized analytics data that cannot be linked back to any individual may be retained indefinitely for service improvement purposes.</li>
                        </ul>
                    </div>
                </section>

                {/* 7. Your Rights Under Rwandan Law */}
                <section className="space-y-4">
                    <h3 className="font-display font-bold text-xl text-primary">7. Your Rights Under Rwandan Law</h3>
                    <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                        <p>Under Law Nº 058/2021, you have the following rights regarding your personal data:</p>
                        <ul className="list-disc list-inside space-y-2 pl-2">
                            <li><strong>Right to Be Informed:</strong> You have the right to know what personal data we collect, why we collect it, and how it is used. This Privacy Notice fulfills that obligation.</li>
                            <li><strong>Right of Access:</strong> You may request a copy of all personal data we hold about you.</li>
                            <li><strong>Right to Rectification:</strong> You may request correction of any inaccurate or incomplete personal data. You can also update most data directly via your profile settings in the app.</li>
                            <li><strong>Right to Erasure:</strong> You may request the deletion of your personal data. You can delete your account at any time via <strong>Menu → Delete Account</strong>, which triggers permanent cascading deletion of all your data.</li>
                            <li><strong>Right to Restrict Processing:</strong> You may request that we limit the processing of your data under certain circumstances.</li>
                            <li><strong>Right to Data Portability:</strong> You may request to receive your personal data in a structured, commonly used, machine-readable format (JSON or CSV).</li>
                            <li><strong>Right to Object:</strong> You may object to the processing of your data for purposes based on legitimate interest, including profiling and direct marketing.</li>
                        </ul>

                        <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/10">
                            <p className="font-bold text-foreground mb-2">How to Exercise Your Rights</p>
                            <ul className="list-disc list-inside space-y-1 pl-2">
                                <li><strong>In the App:</strong> Edit your profile, manage your data, or delete your account directly through your account settings.</li>
                                <li><strong>Via Email:</strong> Send a request to <a href="mailto:synchrosphere@proton.me" className="text-primary underline">synchrosphere@proton.me</a> with the subject line &quot;Data Rights Request&quot;. Include your full name, registered email address, and a description of your request.</li>
                            </ul>
                            <p className="mt-2">We will acknowledge your request within <strong>5 business days</strong> and fulfill it within <strong>30 calendar days</strong>, as required by law.</p>
                        </div>
                    </div>
                </section>

                {/* 8. Data Security Measures */}
                <section className="space-y-4 p-6 rounded-2xl bg-secondary/30 border border-border/50">
                    <h3 className="font-display font-bold text-xl">8. Data Security Measures</h3>
                    <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                        <p>We implement robust technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction:</p>
                        <ul className="list-disc list-inside space-y-2 pl-2">
                            <li><strong>Encryption in Transit:</strong> All data transmitted between your device and our servers is encrypted using TLS 1.2/1.3 protocols.</li>
                            <li><strong>Encryption at Rest:</strong> All stored data is encrypted using AES-256 encryption.</li>
                            <li><strong>Password Security:</strong> User passwords are hashed using the bcrypt algorithm with salting. We never store or transmit plain-text passwords.</li>
                            <li><strong>Row Level Security (RLS):</strong> Our database enforces row-level security policies, ensuring users can only access their own data.</li>
                            <li><strong>Session Management:</strong> Authenticated sessions are managed using secure JSON Web Tokens (JWT) with expiration controls.</li>
                            <li><strong>Multi-Factor Authentication (MFA):</strong> Users are encouraged to enable MFA for an additional layer of account protection.</li>
                            <li><strong>Access Control:</strong> Internal access to personal data is restricted to authorized personnel on a need-to-know basis.</li>
                            <li><strong>Regular Audits:</strong> Our infrastructure providers undergo regular security audits and maintain SOC 2 and ISO 27001 certifications.</li>
                        </ul>
                    </div>
                </section>

                {/* 9. Children's Privacy */}
                <section className="space-y-4">
                    <h3 className="font-display font-bold text-xl text-primary">9. Children&apos;s Privacy</h3>
                    <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                        <p>
                            MarketPLC is not intended for use by individuals under the age of <strong>16</strong>. We do not knowingly collect personal data from children under 16 years of age.
                        </p>
                        <p>
                            If we become aware that we have inadvertently collected personal data from a child under 16, we will take immediate steps to delete such data from our systems. If you believe a child has provided us with personal data, please contact our DPO at <a href="mailto:synchrosphere@proton.me" className="text-primary underline">synchrosphere@proton.me</a>.
                        </p>
                    </div>
                </section>

                {/* 10. Changes to This Policy */}
                <section className="space-y-4">
                    <h3 className="font-display font-bold text-xl text-primary">10. Changes to This Privacy Notice</h3>
                    <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                        <p>
                            We may update this Privacy Notice from time to time to reflect changes in our practices, technology, legal requirements, or other factors. When we make material changes, we will:
                        </p>
                        <ul className="list-disc list-inside space-y-1 pl-2">
                            <li>Update the &quot;Last Updated&quot; date at the top of this notice</li>
                            <li>Notify users through in-app notifications or email</li>
                            <li>Where required by law, seek your renewed consent</li>
                        </ul>
                        <p>
                            We encourage you to review this notice periodically to stay informed about how we protect your data.
                        </p>
                    </div>
                </section>

                {/* 11. Contact & Complaints */}
                <section className="space-y-4 p-6 rounded-2xl bg-secondary/30 border border-border/50">
                    <h3 className="font-display font-bold text-xl">11. Contact &amp; Complaints</h3>
                    <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                        <p>If you have any questions, concerns, or complaints about this Privacy Notice or our data processing practices, please contact our Data Protection Officer:</p>
                        <div className="pl-4 border-l-2 border-primary/30 space-y-1">
                            <p><strong>James Uwingeneye</strong> — Data Protection Officer</p>
                            <p>SynchroSphere Ltd (TIN: 156004518)</p>
                            <p>Email: <a href="mailto:synchrosphere@proton.me" className="text-primary underline">synchrosphere@proton.me</a></p>
                        </div>
                        <p>
                            If you are not satisfied with our response, or believe we are processing your personal data unlawfully, you have the right to lodge a complaint with the <strong>National Cyber Security Authority (NCSA)</strong> of Rwanda, the supervisory authority responsible for data protection under Law Nº 058/2021.
                        </p>
                        <div className="pl-4 border-l-2 border-primary/30 space-y-1">
                            <p><strong>National Cyber Security Authority (NCSA)</strong></p>
                            <p>Website: <a href="https://cyber.gov.rw" target="_blank" rel="noopener noreferrer" className="text-primary underline">cyber.gov.rw</a></p>
                        </div>
                    </div>
                </section>

                <div className="text-center pt-10 pb-20">
                    <p className="text-xs text-muted-foreground">© 2026 SynchroSphere Ltd. All rights reserved.</p>
                </div>
            </main>
        </div>
    );
}
