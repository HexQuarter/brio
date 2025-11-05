import { useEffect, useState } from 'react';
import { listMyOrgs, createPoll } from '@/lib/yourvoice/api';
import PollCreationForm from '@/components/yourvoice/PollCreationForm';
import { Label } from '@/components/ui/label';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import type { Org } from '@/lib/yourvoice/schema';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { retrieveRawInitData } from "@telegram-apps/sdk-react";

export function YourVoiceCreatePollPage() {
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const navigate = useNavigate();
  const location = useLocation()

  const [orgs, setOrgs] = useState<Org[]>([]); // Replace with actual data fetching
  const [orgsLoading, setOrgsLoading] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Org | null>(null)

  const tgData = retrieveRawInitData() as string

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
    const org = orgs.find(o => o.id == selectedOrgId)
    if (org) {
      setSelectedOrg(org)
    }
  }, [selectedOrgId])

  useEffect(() => {
    if (orgs.length > 0) {
      const query = new URLSearchParams(location.search)
      if (query.has('org')) {
        setSelectedOrgId(query.get('org') as string)
      }
    }
  }, [location, orgs])

  const handleCreatePoll = async (data: any) => {
    if (!selectedOrgId) {
      return
    }
    data.org_id = selectedOrgId
    data.tgInitData = tgData

    const res = await createPoll(data)
    if (res.status != 201) {
      const { error } = await res.json()
      throw new Error(error)
    }

    const { id: pollId } = await res.json()
    toast.success(`Poll created successfully!`);

    navigate(`/app/yourvoice/poll/${pollId}`);
  }

  return (
    <div className='flex flex-col gap-5'>
      <h2 className="text-xl mb-4">Create Poll</h2>
      {orgsLoading ? (
        <p className="text-muted-foreground">Loading organizations...</p>
      ) : orgs.length === 0 ? (
        <p className="text-muted-foreground">No organizations yet. Create one above to get started!</p>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-5">
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

          {selectedOrg && (
            <PollCreationForm
              orgCountries={selectedOrg.countries}
              onSubmit={handleCreatePoll}
            />
          )}
        </div>
      )}
    </div>
  );
}
