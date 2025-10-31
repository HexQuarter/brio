import { Card } from '@/components/ui/card';
import { Users, TrendingUp, TrendingDown, ShieldCheck } from 'lucide-react';

interface StatsTilesProps {
  totalVotes: number;
  yesPercentage: number;
  noPercentage: number;
  verifiedCount: number;
}

export default function StatsTiles({ totalVotes, yesPercentage, noPercentage, verifiedCount }: StatsTilesProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="stats-tiles">
      <Card className="p-6 space-y-2 hover-elevate bg-gray-50 border-gray-200 border-1 rounded-md">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Total Votes</span>
          <Users className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="text-4xl md:text-5xl text-foreground" data-testid="text-total-votes">
          {totalVotes.toLocaleString()}
        </div>
      </Card>

      <Card className="p-6 space-y-2 hover-elevate bg-gray-50 border-gray-200 border-1 rounded-md">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Yes</span>
          <TrendingUp className="w-4 h-4 text-success" />
        </div>
        <div className="text-4xl md:text-5xl text-green-600" data-testid="text-yes-percentage">
          {yesPercentage}%
        </div>
      </Card>

      <Card className="p-6 space-y-2 hover-elevate bg-gray-50 border-gray-200 border-1 rounded-md">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">No</span>
          <TrendingDown className="w-4 h-4 text-destructive" />
        </div>
        <div className="text-4xl md:text-5xl text-destructive" data-testid="text-no-percentage">
          {noPercentage}%
        </div>
      </Card>

      <Card className="p-6 space-y-2 hover-elevate bg-gray-50 border-gray-200 border-1 rounded-md">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Verified</span>
          <ShieldCheck className="w-4 h-4 text-primary" />
        </div>
        <div className="text-4xl md:text-5xl text-foreground" data-testid="text-verified-count">
          {verifiedCount.toLocaleString()}
        </div>
      </Card>
    </div>
  );
}
