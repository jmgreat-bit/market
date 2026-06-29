'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, ShieldCheck, UserCheck, Mail, Clock, Download, AlertTriangle } from 'lucide-react';

export default function RightsPage() {
    const router = useRouter();
    const lastUpdated = "June 29, 2026";

    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
            <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl px-6 h-16 flex items-center gap-4 border-b border-border/10">
                <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-secondary transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="font-display font-bold text-lg">Your Data Rights</h1>
            </header>

            <main className="pt-24 px-6 max-w-2xl mx-auto space-y-8">
                <div className="flex items-center gap-4 p-6 rounded-2xl bg-primary/5 border border-primary/10">
                    <ShieldCheck className="w-10 h-10 text-primary flex-shrink-0" />
                    <div>
                        <h2 className="font-display font-bold text-xl">Data Subject Rights</h2>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Last Updated: {lastUpdated}</p>
                    </div>
                </div>

                {/* Introduction */}
                <section className="space-y-4">
                    <div className="text-sm leading-relaxed text-muted-foreground space-y-3">
                        <p>
                            Under <strong>Law Nº 058/2021 of 13/10/2021</strong> relating to the protection of personal data and privacy in Rwanda, you have specific rights regarding your personal data. This page explains each right and provides clear guidance on how to exercise them.
                        </p>
                        <p>
                            <strong>SynchroSphere Ltd</strong> (TIN: 156004518), the operator of MarketPLC, is committed to upholding your data protection rights and making it easy for you to control your personal information.
                        </p>
                    </div>
                </section>

                {/* 1. Your Rights */}
                <section className="space-y-4">
                    <h3 className="font-display font-bold text-xl text-primary flex items-center gap-2">
                        <UserCheck className="w-5 h-5" />
                        1. Your Rights Under the Law
                    </h3>
                    <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
                        <div className="p-4 rounded-xl bg-secondary/30 border border-border/50 space-y-2">
                            <p className="font-bold text-foreground">① Right to Be Informed</p>
                            <p>You have the right to know what personal data we collect about you, why we collect it, how we use it, who we share it with, and how long we keep it. Our <a href="/legal/privacy" className="text-primary underline">Privacy Notice</a> provides this information in full.</p>
                        </div>

                        <div className="p-4 rounded-xl bg-secondary/30 border border-border/50 space-y-2">
                            <p className="font-bold text-foreground">② Right of Access</p>
                            <p>You can request a complete copy of all personal data we hold about you. We will provide this in a clear, readable format within 30 days of your request.</p>
                        </div>

                        <div className="p-4 rounded-xl bg-secondary/30 border border-border/50 space-y-2">
                            <p className="font-bold text-foreground">③ Right to Rectification</p>
                            <p>If any of your personal data is inaccurate, incomplete, or outdated, you have the right to have it corrected. You can update most information directly in the app through your profile settings.</p>
                        </div>

                        <div className="p-4 rounded-xl bg-secondary/30 border border-border/50 space-y-2">
                            <p className="font-bold text-foreground">④ Right to Erasure (Right to Be Forgotten)</p>
                            <p>You can request the complete deletion of your personal data. When you delete your MarketPLC account, all your data — profile, posts, comments, and business listings — is permanently and irreversibly removed through cascading deletion.</p>
                        </div>

                        <div className="p-4 rounded-xl bg-secondary/30 border border-border/50 space-y-2">
                            <p className="font-bold text-foreground">⑤ Right to Restrict Processing</p>
                            <p>You can request that we temporarily stop processing your personal data in certain situations — for example, while we verify the accuracy of your data after you contest it, or if you object to processing based on legitimate interest.</p>
                        </div>

                        <div className="p-4 rounded-xl bg-secondary/30 border border-border/50 space-y-2">
                            <p className="font-bold text-foreground">⑥ Right to Data Portability</p>
                            <p>You can request to receive all your personal data in a structured, commonly used, and machine-readable format (JSON or CSV) so you can transfer it to another service if you wish.</p>
                        </div>

                        <div className="p-4 rounded-xl bg-secondary/30 border border-border/50 space-y-2">
                            <p className="font-bold text-foreground">⑦ Right to Object</p>
                            <p>You have the right to object to the processing of your personal data when it is based on legitimate interest or used for direct marketing purposes. Once you object, we will stop processing your data unless we can demonstrate compelling legitimate grounds.</p>
                        </div>
                    </div>
                </section>

                {/* 2. How to Exercise Your Rights */}
                <section className="space-y-4">
                    <h3 className="font-display font-bold text-xl text-primary">2. How to Exercise Your Rights</h3>
                    <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
                        <p>You can exercise your rights through two methods:</p>

                        <div className="p-5 rounded-xl bg-primary/5 border border-primary/10 space-y-3">
                            <p className="font-bold text-foreground text-base">Option A: In the App</p>
                            <p>Many rights can be exercised directly within MarketPLC without needing to contact us:</p>
                            <ul className="list-disc list-inside space-y-2 pl-2">
                                <li><strong>Edit Your Profile:</strong> Update your name, avatar, business details, and other information through your profile settings at any time.</li>
                                <li><strong>Delete Your Account:</strong> Navigate to <strong>Menu → Delete Account</strong> to permanently delete your account and all associated data. This action is immediate and irreversible — all your personal data, posts, comments, and business listings will be permanently erased through cascading deletion.</li>
                                <li><strong>Manage Location:</strong> Control location permissions through your browser or device settings at any time.</li>
                            </ul>
                        </div>

                        <div className="p-5 rounded-xl bg-primary/5 border border-primary/10 space-y-3">
                            <div className="flex items-center gap-2">
                                <Mail className="w-5 h-5 text-primary flex-shrink-0" />
                                <p className="font-bold text-foreground text-base">Option B: Via Email</p>
                            </div>
                            <p>For rights that cannot be exercised in the app (such as data access, portability, restriction, or objection), send an email to our Data Protection Officer:</p>
                            <div className="pl-4 border-l-2 border-primary/30 space-y-2">
                                <p><strong>Email:</strong> <a href="mailto:synchrosphere@proton.me" className="text-primary underline">synchrosphere@proton.me</a></p>
                                <p><strong>Subject Line:</strong> &quot;Data Rights Request&quot;</p>
                                <p><strong>Include in your email:</strong></p>
                                <ul className="list-disc list-inside space-y-1 pl-2">
                                    <li>Your full name</li>
                                    <li>The email address registered with your MarketPLC account</li>
                                    <li>A clear description of the right you wish to exercise</li>
                                    <li>Any relevant details to help us locate and process your request</li>
                                </ul>
                            </div>
                            <p className="text-xs italic">
                                We may need to verify your identity before processing your request to protect your data from unauthorized access.
                            </p>
                        </div>
                    </div>
                </section>

                {/* 3. Response Timeline */}
                <section className="space-y-4 p-6 rounded-2xl bg-secondary/30 border border-border/50">
                    <h3 className="font-display font-bold text-xl flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        3. Response Timeline
                    </h3>
                    <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                        <p>We take your rights seriously and respond promptly to all requests:</p>
                        <ul className="list-disc list-inside space-y-2 pl-2">
                            <li><strong>Acknowledgment:</strong> We will confirm receipt of your request within <strong>5 business days</strong>.</li>
                            <li><strong>Fulfillment:</strong> Your request will be fully processed and completed within <strong>30 calendar days</strong> from the date of receipt, as required by Law Nº 058/2021.</li>
                            <li><strong>Complex Requests:</strong> In exceptional cases where a request is particularly complex or involves a large volume of data, we may extend the response period by an additional 30 days. We will notify you of any extension and the reasons for it.</li>
                        </ul>
                        <p>All rights requests are processed <strong>free of charge</strong>. However, if requests are manifestly unfounded or excessive (e.g., repeated identical requests), we may charge a reasonable administrative fee or refuse the request, providing clear reasons for doing so.</p>
                    </div>
                </section>

                {/* 4. Data Export */}
                <section className="space-y-4">
                    <h3 className="font-display font-bold text-xl text-primary flex items-center gap-2">
                        <Download className="w-5 h-5" />
                        4. Data Export
                    </h3>
                    <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                        <p>
                            You have the right to request a copy of all personal data we hold about you in a portable, machine-readable format. We support the following export formats:
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-4 rounded-xl bg-secondary/30 border border-border/50 text-center">
                                <p className="font-bold text-foreground text-lg">JSON</p>
                                <p className="text-xs">Structured data format, ideal for developers or transferring to other services</p>
                            </div>
                            <div className="p-4 rounded-xl bg-secondary/30 border border-border/50 text-center">
                                <p className="font-bold text-foreground text-lg">CSV</p>
                                <p className="text-xs">Spreadsheet-compatible format, easy to open in Excel or Google Sheets</p>
                            </div>
                        </div>
                        <p>Your data export will include:</p>
                        <ul className="list-disc list-inside space-y-1 pl-2">
                            <li>Profile information (name, email, avatar)</li>
                            <li>Business details (for Vendors)</li>
                            <li>Posts and comments</li>
                            <li>Account activity and preferences</li>
                        </ul>
                        <p>
                            To request a data export, email <a href="mailto:synchrosphere@proton.me" className="text-primary underline">synchrosphere@proton.me</a> with the subject &quot;Data Export Request&quot; and specify your preferred format.
                        </p>
                    </div>
                </section>

                {/* 5. Complaints */}
                <section className="space-y-4 p-6 rounded-2xl bg-secondary/30 border border-border/50">
                    <h3 className="font-display font-bold text-xl flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        5. Complaints
                    </h3>
                    <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                        <p>
                            We strive to resolve every data protection concern directly. If you are not satisfied with how we handle your request, or if you believe your data protection rights have been violated, you may:
                        </p>
                        <ul className="list-disc list-inside space-y-2 pl-2">
                            <li><strong>Step 1:</strong> Contact our Data Protection Officer at <a href="mailto:synchrosphere@proton.me" className="text-primary underline">synchrosphere@proton.me</a> to escalate your concern. We will investigate and respond within 30 days.</li>
                            <li><strong>Step 2:</strong> If you remain unsatisfied after our response, you have the right to lodge a formal complaint with the supervisory authority:</li>
                        </ul>
                        <div className="pl-4 border-l-2 border-primary/30 space-y-1 mt-2">
                            <p><strong>National Cyber Security Authority (NCSA)</strong></p>
                            <p>The supervisory authority for data protection in Rwanda under Law Nº 058/2021</p>
                            <p>Website: <a href="https://cyber.gov.rw" target="_blank" rel="noopener noreferrer" className="text-primary underline">cyber.gov.rw</a></p>
                        </div>
                        <p className="mt-2">
                            You also have the right to seek judicial remedy through the competent courts of Rwanda if you believe your rights under Law Nº 058/2021 have been infringed.
                        </p>
                    </div>
                </section>

                {/* DPO Contact Card */}
                <section className="p-6 rounded-2xl bg-primary/5 border border-primary/10 space-y-3">
                    <p className="font-display font-bold text-lg text-foreground">Data Protection Officer</p>
                    <div className="text-sm text-muted-foreground space-y-1">
                        <p><strong>James Uwingeneye</strong> — Managing Director &amp; DPO</p>
                        <p>SynchroSphere Ltd (TIN: 156004518)</p>
                        <p>Email: <a href="mailto:synchrosphere@proton.me" className="text-primary underline">synchrosphere@proton.me</a></p>
                    </div>
                </section>

                <div className="text-center pt-10 pb-20">
                    <p className="text-xs text-muted-foreground">© 2026 SynchroSphere Ltd. All rights reserved.</p>
                </div>
            </main>
        </div>
    );
}
