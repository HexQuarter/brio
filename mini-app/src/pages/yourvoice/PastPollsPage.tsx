import { useEffect, useState } from 'react';
import { listPastPolls } from '@/lib/yourvoice/api';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

import type { Poll } from '@/lib/yourvoice/schema';
import { useNavigate } from 'react-router-dom';
import { FiArrowRightCircle } from 'react-icons/fi';
import { Button } from '@/components/ui/button';

export function YourVoicePastPollsPage() {
  const navigate = useNavigate();

  const [pastPolls, setPastPolls] = useState<Poll[]>([]);
  const [pastPollsLoading, setPastPollsLoading] = useState(false);

  useEffect(() => {

    const loadPastPolls = async () => {
      setPastPollsLoading(true)
      const polls = await listPastPolls()
      setPastPollsLoading(false)
      setPastPolls(polls)
    }

    loadPastPolls()
  }, [])

  return (
    <div className='flex flex-col gap-5'>
      <h2 className="text-xl">Past Polls</h2>
      {pastPollsLoading ? (
        <p className="text-muted-foreground">Loading polls...</p>
      ) : pastPolls.length === 0 ? (
        <p className="text-muted-foreground">No past polls</p>
      ) : (
        <div className="flex flex-col gap-3">
          {pastPolls.map((poll: Poll) => (
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
                  Ended at: {new Date(poll.end_at * 1000).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button onClick={() => navigate(`/app/yourvoice/poll/${poll.id}`)}
                  size='lg'
                  variant='outline'
                  className='w-full border-primary text-sm text-primary'>
                  Open poll <FiArrowRightCircle />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
