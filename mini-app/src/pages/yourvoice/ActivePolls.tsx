import { useEffect, useState } from 'react';
import { listActivePolls } from '@/lib/yourvoice/api';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import type { Poll } from '@/lib/yourvoice/schema';
import { useNavigate } from 'react-router-dom';

export function YourVoiceActivePollsPage() {
  const navigate = useNavigate();

  const [activePolls, setActivePolls] = useState<Poll[]>([]); // Replace with actual data fetching
  const [activePollsLoading, setActivePollsLoading] = useState(false);

  useEffect(() => {
    const loadActivePolls = async () => {
      setActivePollsLoading(true)
      const polls = await listActivePolls()
      setActivePollsLoading(false)
      setActivePolls(polls)
    }

    loadActivePolls()
  }, [])

  return (
    <div className='flex flex-col gap-5'>
      <h2 className="text-xl">Active Polls</h2>
      {activePollsLoading ? (
        <p className="text-muted-foreground">Loading polls...</p>
      ) : activePolls.length === 0 ? (
        <p className="text-muted-foreground">No active polls</p>
      ) : (
        <div className="flex flex-col gap-3">
          {activePolls.map((poll: Poll) => (
            <Card
              key={`${poll.org_id}-${poll.id}`}
              data-testid={`card-past-poll-${poll.org_id}-${poll.id}`}
              className="shadow-none bg-gray-50 border-gray-200 border-1 rounded-md cursor-pointer"
              onClick={() => navigate(`/app/yourvoice/poll/${poll.org_id}-${poll.id}`)}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2">
                  <span className='font-normal'>{poll.question}</span>
                </CardTitle>
                <CardDescription>
                  Ending: {new Date(poll.end_at * 1000).toLocaleString()}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
