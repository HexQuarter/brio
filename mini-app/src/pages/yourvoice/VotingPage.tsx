import { useState, useEffect } from 'react';
import PollHeader from '@/components/yourvoice/PollHeader';
import VotePanel from '@/components/yourvoice/VotePanel';
import CountdownTimer from '@/components/yourvoice/CountdownTimer';
import OptionalAttributesForm from '@/components/yourvoice/OptionalAttributesForm';
import AuditTrailFooter from '@/components/yourvoice/AuditTrailFooter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StatsTiles from '@/components/yourvoice/StatsTiles';
import DemographicCharts from '@/components/yourvoice/DemographicCharts';
import { canVote, getActivePoll, submitVote } from '@/lib/yourvoice/api';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Org, Poll, PollAggregates } from '@/lib/yourvoice/schema';
import { retrieveRawInitData } from '@telegram-apps/sdk-react';

export function VotingPage() {
  const params = useParams();
  const pollId = params?.id ? params.id : '1';
  const [userVote, setUserVote] = useState<'yes' | 'no' | undefined>(undefined);
  const [voteAttributes, setVoteAttributes] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true)
  const [data, setData] = useState<ActivePoll | undefined>(undefined)
  const [voteIsPending, setVoteIsPending] = useState(false)
  const [hasVoted, setHashVoted] = useState(false)

  type ActivePoll = {
    poll: Poll,
    org: Org,
    aggregates: PollAggregates
  }

  const tgData = retrieveRawInitData() as string

  useEffect(() => {
    const fetchPoll = async () => {
      const poll = await getActivePoll(pollId) as ActivePoll
      setData(poll)
      setIsLoading(false)

      const votingPower = await canVote(pollId, tgData)
      setHashVoted(!votingPower)
    }

    fetchPoll()
  }, [userVote])

  const handleVote = async (vote: 'yes' | 'no') => {
    setVoteIsPending(true)
    const res = await submitVote({
      poll_id: pollId,
      vote,
      tgInitData: tgData,
      age_bracket: voteAttributes?.age_bracket,
      gender: voteAttributes?.gender,
      residence: voteAttributes?.residence,
      verification_method: voteAttributes?.verification_method,
    })

    setVoteIsPending(false)
    setHashVoted(true)

    if (res.status != 200) {
      const { error } = await res.json()
      toast.error(error)
      return
    }

    toast.success('Your vote has been successfully recorded.')
    setUserVote(vote);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-lg text-muted-foreground">Loading poll...</div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-lg text-foreground font-semibold">Poll not found</div>
        </div>
      </div>
    );
  }

  const { poll, org, aggregates } = data;
  const countries = poll.scope_level === 'countries' 
    ? poll.geographic_scope.split(',').map((c: string) => c.trim())
    : [];
  const pollEndTime = new Date(poll.end_at * 1000);

  const yesPercentage = aggregates.total_votes > 0 
    ? Math.round((aggregates.yes_count / aggregates.total_votes) * 100) 
    : 0;
  const noPercentage = aggregates.total_votes > 0 
    ? Math.round((aggregates.no_count / aggregates.total_votes) * 100) 
    : 0;

  const ageBrackets = [
    { label: '<18', count: aggregates.age_lt_18 },
    { label: '18-24', count: aggregates.age_18_24 },
    { label: '25-34', count: aggregates.age_25_34 },
    { label: '35-44', count: aggregates.age_35_44 },
    { label: '45-54', count: aggregates.age_45_54 },
    { label: '55+', count: aggregates.age_55p },
  ];

  const genderBreakdown = [
    { label: 'Male', count: aggregates.gender_male },
    { label: 'Female', count: aggregates.gender_female },
    { label: 'Other', count: aggregates.gender_other },
    { label: 'Unspecified', count: aggregates.gender_unspecified },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 p-6 rounded-md">
      <PollHeader
        orgName={org?.name || 'Organization'}
        orgLogo={org?.logo_url || undefined}
        pollQuestion={poll.question}
      />

      <main className="flex-1 overflow-auto mt-10">
        <div className="max-w-6xl mx-auto space-y-6 pb-24">
          {org?.purpose && (
            <div className="bg-muted/50 border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground font-medium mb-1">About {org.name}</p>
              <p className="text-sm text-foreground">{org.purpose}</p>
            </div>
          )}

          <CountdownTimer endTime={pollEndTime} />

          {poll.status == 'active' && !hasVoted && !voteIsPending && (
            <OptionalAttributesForm
              countries={countries}
              onAttributesChange={setVoteAttributes}
            />
          )}

          {poll.status == 'active' && <VotePanel
            pollId={pollId}
            question={poll.question}
            hasVoted={hasVoted}
            userVote={userVote}
            onVote={handleVote}
          />}

          <Tabs defaultValue="stats" className="w-full ">
            <TabsList className="w-full flex rounded-sm gap-2 bg-none">
              <TabsTrigger className="rounded-sm" value="stats" data-testid="tab-stats">Live Stats</TabsTrigger>
              <TabsTrigger className="rounded-sm" value="demographics" data-testid="tab-demographics">Demographics</TabsTrigger>
            </TabsList>
            <TabsContent value="stats" className="space-y-6 mt-15 p-0">
              <StatsTiles
                totalVotes={aggregates.total_votes}
                yesPercentage={yesPercentage}
                noPercentage={noPercentage}
                verifiedCount={aggregates.verified_total}
              />
            </TabsContent>
            <TabsContent value="demographics" className="space-y-6 mt-15 p-0">
              <DemographicCharts
                ageBrackets={ageBrackets}
                genderBreakdown={genderBreakdown}
                residenceBreakdown={{
                  inCountry: aggregates.res_in_country,
                  outside: aggregates.res_outside,
                }}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      {/* <AuditTrailFooter pollId={pollId} /> */}
    </div>
  );
}
