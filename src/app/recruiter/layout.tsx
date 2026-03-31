import { RecruiterSidebarProvider } from '@/components/layout/RecruiterSidebar';
import { PostJobModal } from '@/modules/recruiter/jobs/components/PostJobModal';

export default function RecruiterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RecruiterSidebarProvider>
      {children}
      <PostJobModal />
    </RecruiterSidebarProvider>
  );
}
