import { AtsBlocklistSection } from '@/modules/admin/components/AtsBlocklistSection';

/*
 * /admin/ats
 * ATS management page — displays feed stats and the company blocklist editor.
 * Auth is enforced by the parent admin layout.
 */
export default function AdminAtsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-2xl tracking-tight text-brand-foreground">
          ATS Feed
        </h1>
        <p className="mt-1 text-sm text-brand-foreground-muted">
          Monitor automated job imports and manage the company blocklist.
        </p>
      </div>
      <AtsBlocklistSection />
    </div>
  );
}
