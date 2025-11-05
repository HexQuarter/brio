import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface PollHeaderProps {
  orgName: string;
  orgLogo?: string;
  pollQuestion: string;
}

export default function PollHeader({ orgName, orgLogo, pollQuestion }: PollHeaderProps) {
  const navigate = useNavigate()
  return (
    <header className="" data-testid="poll-header">
      <div className="flex items-center gap-3 p-4 max-w-6xl mx-auto">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => navigate(-1) }
          className="flex-shrink-0"
          data-testid="button-back-home"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {orgLogo ? (
            <img
              src={orgLogo}
              alt={orgName}
              className="w-10 h-10 rounded-full border-2 border-border object-cover flex-shrink-0"
              data-testid="img-org-logo"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold border-2 border-border flex-shrink-0">
              {orgName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-lg text-foreground truncate" data-testid="text-poll-title">
              {pollQuestion}
            </h1>
            <p className="text-sm text-muted-foreground truncate">{orgName}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
