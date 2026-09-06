import { PageHeader } from '@/components/ui/PageHeader';

export default function PortalMessagesPage() {
  return (
    <div>
      <PageHeader title="Messages" subtitle="Conversation history with your sales rep" />
      <p className="text-sm text-slate-500">No standalone message thread yet — comments left on a quotation appear directly on its negotiation screen.</p>
    </div>
  );
}
