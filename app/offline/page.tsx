import { MobileShell } from "@/components/layout/mobile-shell";
import { EmptyState } from "@/components/ui/empty-state";

export default function OfflinePage() {
  return (
    <MobileShell showNav={false}>
      <EmptyState title="You are offline">Reconnect to keep shopping the feed.</EmptyState>
    </MobileShell>
  );
}
