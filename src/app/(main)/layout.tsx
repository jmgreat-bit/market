import { MainLayout } from '@/components/layout/MainLayout';
import { ConversationsProvider } from '@/hooks/useConversations';

export default function MainGroupLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ConversationsProvider>
            <MainLayout>{children}</MainLayout>
        </ConversationsProvider>
    );
}
