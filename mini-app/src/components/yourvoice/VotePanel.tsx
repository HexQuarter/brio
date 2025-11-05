import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, ThumbsUp, ThumbsDown } from 'lucide-react';

interface VotePanelProps {
  pollId: string;
  question: string;
  hasVoted?: boolean;
  userVote?: 'yes' | 'no';
  onVote?: (vote: 'yes' | 'no') => void;
}

export default function VotePanel({ question, hasVoted = false, userVote, onVote }: VotePanelProps) {
  const [voted, setVoted] = useState(hasVoted);
  const [selectedVote, setSelectedVote] = useState<'yes' | 'no' | null>(userVote || null);

  useEffect(() => {
    setVoted(hasVoted)
  }, [hasVoted])

  const handleVote = (vote: 'yes' | 'no') => {
    if (voted) return;

    setVoted(true);
    setSelectedVote(vote);
    onVote?.(vote);
    console.log(`Vote submitted: ${vote}`);
  };

  return (
    <div className="flex flex-col gap-5" data-testid="vote-panel">
      <div className="text-center flex flex-col gap-2">
        <h2 className="text-2xl md:text-3xl text-foreground leading-tight" data-testid="text-poll-question">
          {question}
        </h2>
        {hasVoted && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Check className="w-4 h-4 text-success" />
            <span>Your vote has been recorded</span>
          </div>
        )}
      </div>

      {!hasVoted &&
        <div className="grid grid-cols-2 gap-4">
          <Button
            size="lg"
            onClick={() => handleVote('yes')}
            className="min-h-24 flex-col gap-2 bg-green-600 text-lg text-white rounded-2xl shadow-lg disabled:opacity-50 active-elevate-2"
            data-testid="button-vote-yes"
          >
            <ThumbsUp className="w-8 h-8" />
            <span>YES</span>
            {selectedVote === 'yes' && <Check className="w-5 h-5" />}
          </Button>

          <Button
            size="lg"
            onClick={() => handleVote('no')}
            className="min-h-24 flex-col gap-2 text-lg bg-destructive text-white rounded-2xl shadow-lg disabled:opacity-50 active-elevate-2"
            data-testid="button-vote-no"
          >
            <ThumbsDown className="w-8 h-8" />
            <span>NO</span>
            {selectedVote === 'no' && <Check className="w-5 h-5" />}
          </Button>
        </div>
      }
    </div>
  );
}
