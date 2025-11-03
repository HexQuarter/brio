import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createOrg, createPoll, listActivePolls, listMyOrgs, listPastPolls } from '@/lib/yourvoice/api';
import OrgRegistrationForm from '@/components/yourvoice/OrgRegistrationForm';
import PollCreationForm from '@/components/yourvoice/PollCreationForm';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import type { Org, Poll } from '@/lib/yourvoice/schema';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { retrieveRawInitData } from "@telegram-apps/sdk-react";

export function YourVoiceWelcomePage() {
  const [activeTab, setActiveTab] = useState('create');
  const [createdOrg, setCreatedOrg] = useState<{ id: number; countries: string } | null>(null);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const navigate = useNavigate();

  const [orgs, setOrgs] = useState<Org[]>([]); // Replace with actual data fetching
  const [orgsLoading, setOrgsLoading] = useState(false);
  const [activePolls, setActivePolls] = useState<Poll[]>([]); // Replace with actual data fetching
  const [activePollsLoading, setActivePollsLoading] = useState(false);
  const [pastPolls, setPastPolls] = useState<Poll[]>([]);
  const [pastPollsLoading, setPastPollsLoading] = useState(false);

  const selectedOrg = orgs.find(org => org.id === selectedOrgId);

  const activeOrg = (selectedOrgId && selectedOrg) ? {
    id: selectedOrg.id,
    countries: selectedOrg.countries
  } : (selectedOrgId ? null : createdOrg);

  const tgData = retrieveRawInitData() as string

  useEffect(() => {
    const fetchOrgs = async () => {
      setOrgsLoading(true)
      const orgs = await listMyOrgs(tgData)
      setOrgsLoading(false)
      setOrgs(orgs)
    }

    fetchOrgs()
  }, [createdOrg])

  useEffect(() => {
    if (activeTab == 'active') {
      const loadActivePolls = async () => {
        setActivePollsLoading(true)
        const polls = await listActivePolls()
        setActivePollsLoading(false)
        setActivePolls(polls)
      }

      loadActivePolls()
    }

    if (activeTab == 'past') {
      const loadPastPolls = async () => {
        setPastPollsLoading(true)
        const polls = await listPastPolls()
        setPastPollsLoading(false)
        setPastPolls(polls)
      }

      loadPastPolls()
    }
  }, [activeTab])

  const handleCreateOrg = async (data: any) => {
    data.tgInitData = tgData
    const res = await createOrg(data)
    if (res.status != 201) {
      return
    }

    const org = await res.json()

    await new Promise(r => setTimeout(r, 1000));
    toast.success(`Organization "${org.name}" created successfully!`);
    setCreatedOrg({ id: org.id, countries: org.countries });

    await new Promise(r => setTimeout(r, 500));
    setSelectedOrgId(org.id)
  }

  const handleCreatePoll = async (data: any) => {
    if (!activeOrg) {
      return
    }
    data.org_id = activeOrg.id
    data.tgInitData = tgData

    const res = await createPoll(data)
    if (res.status != 201) {
      return
    }

    const { id: pollId } = await res.json()
    toast.success(`Poll created successfully!`);

    navigate(`/app/yourvoice/poll/${pollId}`);
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className='bg-white gap-2'>
        <TabsTrigger className="rounded-sm" value="create" data-testid="tab-create">Create Org/Poll</TabsTrigger>
        <TabsTrigger className="rounded-sm" value="active" data-testid="tab-active">Active Polls</TabsTrigger>
        <TabsTrigger className="rounded-sm" value="past" data-testid="tab-past">Past Polls</TabsTrigger>
      </TabsList>

      <TabsContent value="create" className="mt-6 space-y-8">
          {orgs.length > 0 &&
            <div>
              <h2 className="text-xl mb-4">Create Poll for Existing Organization</h2>
              {orgsLoading ? (
                <p className="text-muted-foreground">Loading organizations...</p>
              ) : orgs.length === 0 ? (
                <p className="text-muted-foreground">No organizations yet. Create one above to get started!</p>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="org-select">Select Organization</Label>
                      <Select
                        value={selectedOrgId}
                        onValueChange={(value) => {
                          setSelectedOrgId(value);
                        }}
                      >
                        <SelectTrigger id="org-select" data-testid="select-org" className='w-full'>
                          {selectedOrg ? (
                            <div className="flex items-center gap-2">
                              {selectedOrg.logo_url ? (
                                <img
                                  src={selectedOrg.logo_url}
                                  alt={selectedOrg.name}
                                  className="w-5 h-5 rounded-full border border-border object-cover flex-shrink-0"
                                />
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold border border-border flex-shrink-0">
                                  {selectedOrg.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <span>{selectedOrg.name}</span>
                            </div>
                          ) : (
                            <SelectValue placeholder="Choose an organization..." />
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          {orgs.map((org: Org) => (
                            <SelectItem key={org.id} value={String(org.id)}>
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
                  </div>

                  {activeOrg && selectedOrgId && (
                    <PollCreationForm
                      orgCountries={activeOrg.countries}
                      onSubmit={handleCreatePoll}
                    />
                  )}
                </div>
              )}

              <div className="relative flex justify-center text-xs uppercase mt-5 mb-5">
                <span className="bg-background px-2 text-muted-foreground">
                  Or
                </span>
              </div>
              <div />

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
              </div>
            </div>
          }

          <div>
            <h2 className="text-xl mb-4">Create New Organization</h2>
            <OrgRegistrationForm
              onSubmit={handleCreateOrg}
            />
          </div>
        </TabsContent>

        <TabsContent value="active" className="mt-6">
          <h2 className="text-xl mb-4">Active Polls</h2>
          {activePollsLoading ? (
            <p className="text-muted-foreground">Loading polls...</p>
          ) : activePolls.length === 0 ? (
            <p className="text-muted-foreground">No active polls</p>
          ) : (
            <div className="space-y-3">
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
        </TabsContent>

        <TabsContent value="past" className="mt-6">
          <h2 className="text-xl mb-4">Past Polls</h2>
          {pastPollsLoading ? (
            <p className="text-muted-foreground">Loading polls...</p>
          ) : pastPolls.length === 0 ? (
            <p className="text-muted-foreground">No past polls</p>
          ) : (
            <div className="space-y-3">
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
                      Ended: {new Date(poll.end_at * 1000).toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
    </Tabs>
  );
}
