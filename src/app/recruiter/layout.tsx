import { RecruiterSidebarProvider } from '@/components/layout/RecruiterSidebar';
import { PostJobModal } from '@/modules/recruiter/jobs/components/PostJobModal';
import { ReactQueryProvider } from '@/providers/query-provider';

export default function RecruiterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ReactQueryProvider>
      <RecruiterSidebarProvider>
        {children}
        <PostJobModal />
      </RecruiterSidebarProvider>
    </ReactQueryProvider>
  );
}
