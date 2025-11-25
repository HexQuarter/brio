import { useEffect, useState } from 'react';
import { listMyOrgs, listOrgPolls, removeOrg } from '@/lib/yourvoice/api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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
import { FiArrowRightCircle } from 'react-icons/fi';
import { MdAdd, MdOutlineDelete } from 'react-icons/md';

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
      if (voterSelectedOrgId == '') {
        return
      }
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

  const handleRemoveOrg = (orgId: string) => async () => {
    const confirm = window.confirm("Are you sure you want to remove this organization?")
    if (!confirm) {
      return
    }

    setOrgsLoading(true)
    await removeOrg(orgId, tgData)
    const updatedOrgs = await listMyOrgs(tgData)
    setOrgs(updatedOrgs)
    setOrgsLoading(false)
    if (voterSelectedOrgId === orgId) {
      setVoterSelectedOrgId('')
    }
  }

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
                    const startTime = poll.start_at * 1000
                    const endTime = poll.end_at * 1000;
                    const isFuture = startTime > now
                    const isPast = !isFuture && now > endTime;
                    const isActive = !isFuture && now <= endTime;

                    return (
                      <Card
                        key={poll.id}
                        data-testid={`card-org-poll-${poll.id}`}
                        className="shadow-none bg-gray-50 border-gray-200 border-1 rounded-md cursor-pointer"
                      >
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between gap-2">
                            <span className='font-normal'>{poll.question}</span>
                            {isFuture && <Badge variant="default">Scheduled</Badge>}
                            {isActive && <Badge variant="default">Active</Badge>}
                            {isPast && <Badge variant="secondary">Ended</Badge>}
                          </CardTitle>
                          <CardDescription>
                            {isFuture && (
                              <span>Starts at: {new Date(poll.start_at * 1000).toLocaleString()}</span>
                            )}
                            {isActive && (
                              <span>Ends at: {new Date(poll.end_at * 1000).toLocaleString()}</span>
                            )}
                            {isPast && (
                              <span>Ended at: {new Date(poll.end_at * 1000).toLocaleString()}</span>
                            )}
                          </CardDescription>
                        </CardHeader>
                        <CardFooter>
                          <Button onClick={() => navigate(`/app/yourvoice/poll/${poll.id}`)}
                            size='sm'
                            variant='outline'
                            className='w-full border-primary text-sm text-primary'>
                            Open poll <FiArrowRightCircle />
                          </Button>
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              )}

              <div className='flex flex-col gap-5'>
                <Button className='w-full border-primary h-5' onClick={() => navigate(`/app/yourvoice/create-poll?org=${voterSelectedOrgId}`)}>
                  Create a new poll <MdAdd />
                </Button>
                <Button variant='secondary' className='w-full border-primary h-5' onClick={handleRemoveOrg(voterSelectedOrgId)}>
                  Delete the organization <MdOutlineDelete />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
