import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users } from 'lucide-react';

interface PastPollCardProps {
  orgName: string;
  orgLogo?: string;
  question: string;
  closedDate: string;
  totalVotes: number;
  yesPercentage: number;
  noPercentage: number;
  onClick?: () => void;
}

export default function PastPollCard({
  orgName,
  orgLogo,
  question,
  closedDate,
  totalVotes,
  yesPercentage,
  noPercentage,
  onClick,
}: PastPollCardProps) {
  return (
    <Card
      className="p-6 space-y-4 cursor-pointer hover-elevate active-elevate-2"
      onClick={onClick}
      data-testid="card-past-poll"
    >
      <div className="flex items-start gap-3">
        {orgLogo ? (
          <img
            src={orgLogo}
            alt={orgName}
            className="w-12 h-12 rounded-full border-2 border-border object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold border-2 border-border flex-shrink-0">
            {orgName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground line-clamp-2 mb-1" data-testid="text-question">
            {question}
          </h3>
          <p className="text-sm text-muted-foreground">{orgName}</p>
        </div>
        <Badge variant="secondary" className="flex-shrink-0">
          Closed
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="text-center p-3 bg-success/10 rounded-lg border border-success/20">
          <div className="text-2xl font-bold text-success">{yesPercentage}%</div>
          <div className="text-xs text-muted-foreground">Yes</div>
        </div>
        <div className="text-center p-3 bg-destructive/10 rounded-lg border border-destructive/20">
          <div className="text-2xl font-bold text-destructive">{noPercentage}%</div>
          <div className="text-xs text-muted-foreground">No</div>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t border-border">
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          <span>{closedDate}</span>
        </div>
        <div className="flex items-center gap-1">
          <Users className="w-4 h-4" />
          <span>{totalVotes.toLocaleString()} votes</span>
        </div>
      </div>
    </Card>
  );
}
