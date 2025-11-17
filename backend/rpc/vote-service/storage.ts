export interface VoteServiceStorage {
  createOrg(org: OrgInsertion): Promise<string>
  getOrg(id: string): Promise<Org | undefined>
  listOrgByChatId(chatId: string): Promise<OrgListing[]>
  createPoll(poll: PollInsertion): Promise<string>
  listActivePolls(): Promise<PollListing[]>
  listPastPolls(): Promise<PollListing[]>
  listPolls(): Promise<Poll[]>
  getPoll(id: string): Promise<Poll | undefined>
  getPollAggregates(pollId: string): Promise<PollAggregate | undefined>
  hasVoted(pollId: string, voterHash: string): Promise<boolean>
  recordVote(pollId: string, voterHash: string): Promise<void>
  closePoll(poll: Poll): Promise<void>
  listOrgPolls(orgId: string): Promise<PollListing[]>

  updateAggregates(
    pollId: string,
    vote: 'yes' | 'no',
    attributes?: {
      age_bracket?: string;
      gender?: string;
      residence?: string;
      verification_method?: string;
    }
  ): Promise<void>

  appendAuditLog(
    pollId: string,
    vote: 'yes' | 'no',
    voterHash: string,
    attributes?: {
      age_bracket?: string;
      gender?: string;
      residence?: string;
      verification_method?: string;
    }
  ): Promise<void>
}

export type OrgInsertion = {
  name: string
  purpose: string | undefined
  scope_level: 'countries' | 'region' | 'continent' | 'world' | 'city' | 'community'
  geographic_scope: string
  logo_url: string | undefined
  chat_id: string
  id_verification_required: boolean
  telegram_handle: string | undefined
}

export type Org = OrgInsertion & {
  id: string
  created_at: Number
}

export type PollInsertion = {
  org_id: string
  question: string
  start_at: number
  end_at: number
}

export type OrgListing = {
  id: string
  name: string
  countries: string
}

export type Poll = PollInsertion & {
  id: string
  hash_salt: string
  created_at: number
  scope_level: 'countries' | 'region' | 'continent' | 'world' | 'city' | 'community'
  geographic_scope: string
  status: 'active' | 'closed'
};

export type PollListing = {
  id: string
  start_at: number
  end_at: number
  question: string
  org_id: string
}

export type PollAggregate = {
  poll_id: string
  total_votes: number
  yes_count: number
  no_count: number
  verified_total: number
  age_lt_18: number
  age_18_24: number
  age_25_34: number
  age_35_44: number
  age_45_54: number
  age_55p: number
  gender_male: number,
  gender_female: number
  gender_other: number
  gender_unspecified: number
  res_in_country: number
  res_outside: number
  res_unspecified: number
  verified_self_attest: number
  verified_sa_id: number
};