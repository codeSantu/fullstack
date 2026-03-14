import { Sidebar } from '@/components/layout/Sidebar';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="dashboard-container">
            <Sidebar />
            <main className="dashboard-main">
                {children}
            </main>
        </div>
    );
}
