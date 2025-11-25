import { useState, useEffect } from 'react';
import PollHeader from '@/components/yourvoice/PollHeader';
import VotePanel from '@/components/yourvoice/VotePanel';
import CountdownTimer from '@/components/yourvoice/CountdownTimer';
import OptionalAttributesForm from '@/components/yourvoice/OptionalAttributesForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StatsTiles from '@/components/yourvoice/StatsTiles';
import DemographicCharts from '@/components/yourvoice/DemographicCharts';
import { canVote, getActivePoll, submitVote } from '@/lib/yourvoice/api';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Org, Poll, PollAggregates } from '@/lib/yourvoice/schema';
import { retrieveRawInitData } from '@telegram-apps/sdk-react';
import { Card } from '@/components/ui/card';
import { Heart, MessageCircle } from 'lucide-react';

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
      try {
        const poll = await getActivePoll(pollId) as ActivePoll
        setData(poll)
        setIsLoading(false)

        const votingPower = await canVote(pollId, tgData)
        setHashVoted(!votingPower)
      } catch (err) {
        setIsLoading(false)
        setData(undefined)
      }
    }

    fetchPoll()
  }, [userVote])

  const handleVote = async (vote: 'yes' | 'no') => {
    setVoteIsPending(true)

    // Check if ID verification is required but not completed
    if (org?.id_verification_required === true && voteAttributes?.verification_method !== 'sa_id') {
      toast.error('This organization requires SA ID verification to vote. Please verify your SA ID number above before voting.')
      setVoteIsPending(false)
      setHashVoted(false)
      return;
    }

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
   

    if (res.status != 200) {
      const { error } = await res.json()
      toast.error(error)
      return
    }

    setHashVoted(true)
    toast.success('Your vote has been successfully recorded.')
    setUserVote(vote);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-muted-foreground">Loading poll...</div>
        </div>
      </div>
    );
  }

  if (!data) {
    window.location.href = '#/app/yourvoice';
    return null;  
  }

  const { poll, org, aggregates } = data;
  const countries = poll && poll.scope_level === 'countries' 
    ? poll.geographic_scope.split(',').map((c: string) => c.trim())
    : [];
  const pollEndTime = new Date(poll.end_at * 1000);
  const pollStartTime = new Date(poll.start_at * 1000)
  const isFuture = pollStartTime.getTime() > new Date().getTime()

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
    <div className="flex flex-col gap-5">
      <PollHeader
        orgName={org?.name || 'Organization'}
        orgLogo={org?.logo_url || undefined}
        pollQuestion={poll.question}
      />

      <div className="flex flex-col gap-10">
        {org?.purpose && (
          <div className="bg-muted/50 border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground font-medium mb-1">About <span className='font-semibold'>{org.name}</span></p>
            <p className="text-sm text-foreground">{org.purpose}</p>
          </div>
        )}

          {org?.telegram_handle && (
          <Card className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20" data-testid="card-donation">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Heart className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-semibold text-foreground">Support {org.name}</p>
                <p className="text-xs text-muted-foreground">
                  Donate BTC via Brio on Telegram
                </p>
                <a
                  href={`https://t.me/${org.telegram_handle.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary hover-elevate active-elevate-2 bg-background border border-primary/30 rounded-lg px-3 py-1.5 mt-2"
                  data-testid="link-telegram-donation"
                >
                  <MessageCircle className="w-4 h-4" />
                  {org.telegram_handle}
                </a>
              </div>
            </div>
          </Card>
        )}

        <div className='flex flex-col gap-5 bg-white p-5 rounded-sm'>
          <CountdownTimer startTime={pollStartTime} endTime={pollEndTime} />

          {!isFuture && poll.status == 'active' && !hasVoted && !voteIsPending && (
            <OptionalAttributesForm
              countries={countries}
              idVerificationRequired={org?.id_verification_required === true}
              onAttributesChange={setVoteAttributes}
            />
          )}

          {!isFuture && poll.status == 'active' && <VotePanel
            pollId={pollId}
            question={poll.question}
            hasVoted={hasVoted}
            userVote={userVote}
            onVote={handleVote}
          />}
        </div>

        <Tabs defaultValue="stats">
          <TabsList className="w-full flex rounded-sm gap-2 bg-none">
            <TabsTrigger className="rounded-sm" value="stats" data-testid="tab-stats">Live Stats</TabsTrigger>
            <TabsTrigger className="rounded-sm" value="demographics" data-testid="tab-demographics">Demographics</TabsTrigger>
          </TabsList>
          <TabsContent value="stats" className="p-0 pt-5">
            <StatsTiles
              totalVotes={aggregates.total_votes}
              yesPercentage={yesPercentage}
              noPercentage={noPercentage}
              verifiedCount={aggregates.verified_total}
            />
          </TabsContent>
          <TabsContent value="demographics" className="p-0 pt-5">
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
    </div>
  );
}
