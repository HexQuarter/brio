import { useEffect, useState } from 'react';
import { listMyOrgs, listOrgPolls } from '@/lib/yourvoice/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import type { Org, Poll } from '@/lib/yourvoice/schema';
import { useLocation, useNavigate } from 'react-router-dom';
import { retrieveRawInitData } from "@telegram-apps/sdk-react";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function YourVoiceWelcomePage() {
  const navigate = useNavigate();

  const [orgs, setOrgs] = useState<Org[]>([]); // Replace with actual data fetching
  const [orgsLoading, setOrgsLoading] = useState(false);
  const [voterSelectedOrgId, setVoterSelectedOrgId] = useState<string>('');
  const [orgPollsLoading, setOrgPollsLoading] = useState(true)
  const [orgPolls, setOrgPolls] = useState([])

  const location = useLocation()

  const tgData = retrieveRawInitData() as string

  useEffect(() => {
    const loadingPolls = async () => {
      setOrgPollsLoading(true)
      const polls = await listOrgPolls(voterSelectedOrgId)
      setOrgPollsLoading(false)
      setOrgPolls(polls)
    }

    loadingPolls()
  }, [voterSelectedOrgId])

  useEffect(() => {
    const fetchOrgs = async () => {
      setOrgsLoading(true)
      const orgs = await listMyOrgs(tgData)
      setOrgsLoading(false)
      setOrgs(orgs)
    }

    fetchOrgs()
  }, [])

  useEffect(() => {
    const query = new URLSearchParams(location.search)
    if (query.has('org')) {
      setVoterSelectedOrgId(query.get('org') as string)
    }
  }, [location])

  return (
    <div className='flex flex-col gap-10'>
      <div className="flex flex-col gap-10">
        <h1 className="text-3xl text-foreground mb-2" data-testid="text-welcome">
          Welcome to Your Voice Your Vote
        </h1>
        <p className="text-muted-foreground">
          Select an organization to view and participate in their polls
        </p>
      </div>

      {orgsLoading ? (
        <p className="text-muted-foreground">Loading organizations...</p>
      ) : orgs.length === 0 ? (
        <Card className='shadow-none bg-gray-50 border-gray-200 border-1 rounded-md cursor-pointer'>
          <CardContent className="pt-6 flex flex-col gap-5">
            <p className="text-muted-foreground text-center">
              No organizations available yet
            </p>
            <div className='flex'>
              <Button className='w-full border-primary text-primary h-5' variant="outline" onClick={() => navigate(`/app/yourvoice/create-org`)}>Create a new organization</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="voter-org-select">Choose an Organization</Label>
            <Select
              value={voterSelectedOrgId}
              onValueChange={setVoterSelectedOrgId}
            >
              <SelectTrigger id="voter-org-select" data-testid="select-voter-org" className='w-full'>
                {orgs.find(o => o.id === voterSelectedOrgId) ? (
                  <div className="flex items-center gap-2  w-full">
                    {orgs.find(o => o.id === voterSelectedOrgId)!.logo_url ? (
                      <img
                        src={orgs.find(o => o.id === voterSelectedOrgId)!.logo_url!}
                        alt={orgs.find(o => o.id === voterSelectedOrgId)!.name}
                        className="w-5 h-5 rounded-full border border-border object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold border border-border flex-shrink-0">
                        {orgs.find(o => o.id === voterSelectedOrgId)!.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span>{orgs.find(o => o.id === voterSelectedOrgId)!.name}</span>
                  </div>
                ) : (
                  <SelectValue placeholder="Select an organization to see polls..." />
                )}
              </SelectTrigger>
              <SelectContent>
                {orgs.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    <div className="flex items-center gap-2">
                      {org.logo_url ? (
                        <img
                          src={org.logo_url}
                          alt={org.name}
                          className="w-5 h-5 rounded-full border border-border object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold border border-border flex-shrink-0">
                          {org.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span>{org.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {voterSelectedOrgId && (
            <div className="flex flex-col gap-5">
              <h3 className="text-lg">Polls from {orgs.find(o => o.id === voterSelectedOrgId)?.name}</h3>
              {orgPollsLoading ? (
                <p className="text-muted-foreground">Loading polls...</p>
              ) : orgPolls.length === 0 ? (
                <Card className="shadow-none bg-gray-50 border-gray-200 border-1 rounded-md cursor-pointer">
                  <CardContent>
                    <p className="text-muted-foreground text-center">
                      No polls available from this organization yet.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="flex flex-col gap-2">
                  {orgPolls.map((poll: Poll) => {
                    const now = new Date().getTime();
                    const endTime = poll.end_at * 1000;
                    const isPast = now > endTime;
                    const isActive = now <= endTime;

                    return (
                      <Card
                        key={poll.id}
                        data-testid={`card-org-poll-${poll.id}`}
                        className="shadow-none bg-gray-50 border-gray-200 border-1 rounded-md cursor-pointer"
                        onClick={() => navigate(`/app/yourvoice/poll/${poll.org_id}-${poll.id}`)}
                      >
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between gap-2">
                            <span className='font-normal'>{poll.question}</span>
                            {isActive && <Badge variant="default">Active</Badge>}
                            {isPast && <Badge variant="secondary">Ended</Badge>}
                          </CardTitle>
                          <CardDescription>
                            {isPast ? 'Ended' : 'Ends'}: {new Date(poll.end_at * 1000).toLocaleString()}
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    );
                  })}
                </div>
              )}
               
              <div className='flex'>
                <Button className='w-full border-primary text-primary h-5' variant="outline" onClick={() => navigate(`/app/yourvoice/create-poll?org=${voterSelectedOrgId}`)}>Create a new poll</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
