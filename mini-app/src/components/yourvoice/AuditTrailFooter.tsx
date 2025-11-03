import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface AuditTrailFooterProps {
  pollId: string;
  rollingHash?: string;
}

export default function AuditTrailFooter({ pollId, rollingHash = 'a3f5c9e2b1d8f4a6e7c9b3d5f8a2e4c6d9b1f3a5e7c2d4f6a8b3e5c7d9f1a3e5' }: AuditTrailFooterProps) {
  return (
    <div className="border-1 rounded-sm border-border bg-card/50 backdrop-blur-sm" data-testid="audit-trail-footer">
      <div className="p-1">
        <Dialog>
          <DialogTrigger>
            <Button
              variant="ghost"
              size="sm"
              className="justify-center gap-2"
              data-testid="button-view-audit"
            >
              <Lock className="w-4 h-4" />
              <span className="text-sm">Cryptographically verifiable results</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Audit Trail</DialogTitle>
              <DialogDescription>
                This poll uses a rolling SHA-256 digest to ensure vote integrity. Each vote is
                chained to the previous one, making tampering detectable.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-foreground">Poll ID</Label>
                <div className="mt-1 p-3 bg-muted rounded-md font-mono text-sm break-all">
                  {pollId}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-foreground">Current Rolling Hash</Label>
                <div className="mt-1 p-3 bg-muted rounded-md font-mono text-xs break-all" data-testid="text-rolling-hash">
                  {rollingHash}
                </div>
              </div>
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <Lock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-foreground">
                    <p className="font-medium mb-1">Privacy Guarantee</p>
                    <p className="text-muted-foreground">
                      No personal information is stored. Only aggregated statistics and salted
                      hashes are kept to prevent double-voting while preserving anonymity.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}
