export type Org = {
  id: string
  name: string,
  purpose: string | null,
  scope_level: 'countries' | 'region' | 'continent' | 'world' | 'city' | 'community',
  geographic_scope: string,
  countries: string,
  logo_url: string | null,
  chat_id: string | null,
  created_at: string,
};

export type Poll = {
  id: string,
  org_id: string,
  question: string,
  scope_level: 'countries' | 'region' | 'continent' | 'world' | 'city' | 'community',
  geographic_scope: string,
  countries: string,
  start_at: number,
  end_at: number,
  settings_json: string,
  status: 'active' | 'closed',
  hash_salt: string,
  created_at: number,
};

export type PollAggregates = {
  poll_id: string,
  total_votes: number,
  yes_count: number,
  no_count: number,
  verified_total: number,
  age_lt_18: number,
  age_18_24: number,
  age_25_34: number,
  age_35_44: number,
  age_45_54: number,
  age_55p: number,
  gender_male: number,
  gender_female: number,
  gender_other: number,
  gender_unspecified: number,
  res_in_country: number,
  res_outside: number,
  res_unspecified: number,
  verified_self_attest: number,
  verified_sa_id: number,
};

export type InsertOrg = {
  name: string,
  purpose: string | undefined,
  scope_level: 'countries' | 'region' | 'continent' | 'world' | 'city' | 'community',
  geographic_scope: string,
  logo_url: string | undefined,
  tgInitData: string
};

export type InsertPoll = {
  org_id: string,
  question: string,
  scope_level: 'countries' | 'region' | 'continent' | 'world' | 'city' | 'community',
  geographic_scope: string,
  start_at: number,
  end_at: number,
  init_data: string | undefined,
};

export type Vote = {
  poll_id: string,
  vote: 'yes' | 'no',
  tgInitData: string,
  age_bracket: '<18' | '18-24' | '25-34' | '35-44' | '45-54' | '55+' | undefined,
  gender: 'male' | 'female' | 'other' | undefined,
  residence: 'in-country' | 'outside' | undefined,
  verification_method: 'self_attest' | 'sa_id' | undefined,
};

export interface OrgCreationResponse {
  org: Org;
  admin_token: string;
}
