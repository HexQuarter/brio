export interface VoteServiceStorage {
  createOrg(org: OrgInsertion): number
  getOrg(id: number): Promise<Org | undefined>
  listOrgByChatId(chatId: number): Promise<Org[]>
  createPoll(poll: PollInsertion): number
  listActivePolls(): Promise<Poll[]>
  listPastPolls(): Promise<Poll[]>
  getPoll(id: number): Promise<Poll | undefined>
  getPollAggregates(pollId: number): Promise<PollAggregate | undefined>
  hasVoted(pollId: number, voterHash: string): Promise<boolean>
  recordVote(pollId: number, voterHash: string): Promise<void>
  listPolls(): Promise<Poll[]>
  closePoll(pollId: number): void

  updateAggregates(
    pollId: number,
    vote: 'yes' | 'no',
    attributes?: {
      age_bracket?: string;
      gender?: string;
      residence?: string;
      verification_method?: string;
    }
  ): void

  appendAuditLog(
    pollId: number,
    vote: 'yes' | 'no',
    voterHash: string,
    attributes?: {
      age_bracket?: string;
      gender?: string;
      residence?: string;
      verification_method?: string;
    }
  ): void
}

export type OrgInsertion = {
  name: string
  purpose: string | undefined
  scope_level: 'countries' | 'region' | 'continent' | 'world' | 'city' | 'community'
  geographic_scope: string
  logo_url: string | undefined
  chat_id: string
}

export type Org = OrgInsertion & {
  id: number
  created_at: Number
}

export type PollInsertion = {
  org_id: number
  question: string
  scope_level: 'countries' | 'region' | 'continent' | 'world' | 'city' | 'community'
  geographic_scope: string
  start_at: number
  end_at: number
}

export type Poll = PollInsertion & {
  id: number
  hash_salt: string
  created_at: number
  status: 'active' | 'closed'
};

export type PollAggregate = {
  poll_id: number
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