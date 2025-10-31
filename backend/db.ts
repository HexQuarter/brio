import Database from 'better-sqlite3';
import { resolve } from 'path';
import { mkdirSync } from 'fs';

import { UserItem, UserServiceStorage } from "./rpc/user-service/storage"
import { PaymentServiceStorage, PaymentItem } from './rpc/payment-service/storage';
import { Org, OrgInsertion, Poll, PollAggregate, PollInsertion, VoteServiceStorage } from './rpc/vote-service/storage';
import { createHash, randomBytes } from 'crypto';

const dataDir = resolve(process.cwd(), 'data');
mkdirSync(dataDir, { recursive: true });

const dbPath = resolve(dataDir, 'brio.db');
export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

export class SQLStorage implements UserServiceStorage, PaymentServiceStorage, VoteServiceStorage {
  constructor() {
    this.initWalletTables()
    this.initYourVoiceTables()
  }

  private initWalletTables() {
    db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                chatID TEXT PRIMARY KEY,
                publicKey TEXT,
                breezBtcAddress TEXT,
                breezLnUrl TEXT,
                tapRootAddress TEXT,
                handle TEXT,
                phoneNumber TEXT
            );
            
            CREATE TABLE IF NOT EXISTS user_contacts (
                contactDigest TEXT PRIMARY KEY,
                chatID TEXT,
                FOREIGN KEY(chatID) REFERENCES users(chatID)
            );

            CREATE TABLE IF NOT EXISTS payments (
                id TEXT PRIMARY KEY,
                amount REAL,
                method TEXT
            );
        `);
  }

  private initYourVoiceTables() {
    db.exec(`
            CREATE TABLE IF NOT EXISTS orgs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                purpose TEXT,
                scope_level TEXT NOT NULL DEFAULT 'countries',
                geographic_scope TEXT,
                countries TEXT NOT NULL,
                logo_url TEXT,
                chat_id TEXT,
                created_at INTEGER DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS polls (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                org_id INTEGER NOT NULL REFERENCES orgs(id),
                question TEXT NOT NULL,
                scope_level TEXT NOT NULL DEFAULT 'countries',
                geographic_scope TEXT NOT NULL,
                countries TEXT NOT NULL,
                start_at INTEGER NOT NULL,
                end_at INTEGER NOT NULL,
                status TEXT NOT NULL DEFAULT 'active',
                hash_salt TEXT NOT NULL,
                created_at INTEGER DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS poll_aggregates (
                poll_id INTEGER PRIMARY KEY REFERENCES polls(id),
                total_votes INTEGER DEFAULT 0,
                yes_count INTEGER DEFAULT 0,
                no_count INTEGER DEFAULT 0,
                verified_total INTEGER DEFAULT 0,
                age_lt_18 INTEGER DEFAULT 0,
                age_18_24 INTEGER DEFAULT 0,
                age_25_34 INTEGER DEFAULT 0,
                age_35_44 INTEGER DEFAULT 0,
                age_45_54 INTEGER DEFAULT 0,
                age_55p INTEGER DEFAULT 0,
                gender_male INTEGER DEFAULT 0,
                gender_female INTEGER DEFAULT 0,
                gender_other INTEGER DEFAULT 0,
                gender_unspecified INTEGER DEFAULT 0,
                res_in_country INTEGER DEFAULT 0,
                res_outside INTEGER DEFAULT 0,
                res_unspecified INTEGER DEFAULT 0,
                verified_self_attest INTEGER DEFAULT 0,
                verified_sa_id INTEGER DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS poll_voter_keys (
                poll_id INTEGER NOT NULL REFERENCES polls(id),
                voter_hash TEXT NOT NULL,
                created_at INTEGER DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (poll_id, voter_hash)
            );

            CREATE TABLE IF NOT EXISTS poll_audit (
                poll_id INTEGER NOT NULL REFERENCES polls(id),
                seq INTEGER NOT NULL,
                ts INTEGER NOT NULL,
                vote TEXT NOT NULL CHECK (vote IN ('yes','no')),
                flags_json TEXT NOT NULL,
                voter_hash TEXT NOT NULL,
                rolling_sha256 TEXT NOT NULL,
                PRIMARY KEY (poll_id, seq)
            );
            `);
  }

  async getUserByChatID(chatID: string): Promise<UserItem | null> {
    const stmt = db.prepare('SELECT * FROM users WHERE chatID = ?');
    const row = stmt.get(chatID) as UserItem | undefined;
    return row || null;
  }

  async getUserContact(contactDigest: string): Promise<{ contactDigest: string, chatID: string } | null> {
    const stmt = db.prepare('SELECT * FROM user_contacts WHERE contactDigest = ?');
    const row = stmt.get(contactDigest) as { contactDigest: string, chatID: string } | undefined;
    return row || null;
  }

  async addUserContact(contactDigest: string, chatID: string): Promise<void> {
    const stmt = db.prepare('INSERT OR REPLACE INTO user_contacts (contactDigest, chatID) VALUES (?, ?)');
    stmt.run(contactDigest, chatID);
  }

  async createUser(user: UserItem): Promise<void> {
    const stmt = db.prepare(`
            INSERT OR REPLACE INTO users (chatID, publicKey, breezBtcAddress, breezLnUrl, tapRootAddress, handle, phoneNumber)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
    stmt.run(
      user.chatID,
      user.publicKey,
      user.breezBtcAddress,
      user.breezLnUrl,
      user.tapRootAddress,
      user.handle,
      user.phoneNumber
    )
  }

  async createPayment(paymentItem: PaymentItem): Promise<void> {
    const stmt = db.prepare(`
            INSERT INTO payments (id, amount, method)
            VALUES (?, ?, ?)
        `);
    stmt.run(
      paymentItem.id,
      paymentItem.amount,
      paymentItem.method
    );
  }

  async getPayment(paymentId: string): Promise<PaymentItem | null> {
    const stmt = db.prepare('SELECT * FROM payments WHERE id = ?');
    const row = stmt.get(paymentId) as PaymentItem | undefined;
    return row || null;
  }

  createOrg(org: OrgInsertion): number {
    const countries = org.scope_level === 'countries' ? org.geographic_scope : '';

    const stmt = db.prepare(
      'INSERT INTO orgs (name, purpose, scope_level, geographic_scope, countries, logo_url, chat_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    const info = stmt.run(
      org.name,
      org.purpose || null,
      org.scope_level,
      org.geographic_scope,
      countries,
      org.logo_url || null,
      org.chat_id
    );

    return info.lastInsertRowid as number
  }

  getOrg(id: number): Promise<Org | undefined> {
    const org = db.prepare('SELECT * FROM orgs WHERE id = ?').get(id) as Org | undefined;
    return Promise.resolve(org);
  }

  listOrgByChatId(chatId: number): Promise<Org[]> {
    const org = db.prepare('SELECT * FROM orgs WHERE chat_id = ?').all(chatId) as Org[]
    return Promise.resolve(org)
  }

  createPoll(poll: PollInsertion): number {
    const hashSalt = randomBytes(32).toString('hex');

    const countries = poll.scope_level === 'countries' ? poll.geographic_scope : '';

    const stmt = db.prepare(
      `INSERT INTO polls (
                org_id, 
                question, 
                scope_level, 
                geographic_scope, 
                countries, 
                start_at, 
                end_at, 
                hash_salt
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const info = stmt.run(
      poll.org_id,
      poll.question,
      poll.scope_level,
      poll.geographic_scope,
      countries,
      poll.start_at,
      poll.end_at,
      hashSalt
    );

    db.prepare(
      'INSERT INTO poll_aggregates (poll_id) VALUES (?)'
    ).run(info.lastInsertRowid);

    return info.lastInsertRowid as number
  }

  listPolls(): Promise<Poll[]> {
    const polls = db.prepare('SELECT * FROM polls ').all() as Poll[]
    return Promise.resolve(polls);
  }

  listActivePolls(): Promise<Poll[]> {
    const polls = db.prepare(
      `
        SELECT * FROM polls 
        WHERE status = 'active'
        AND strftime('%s', 'now') BETWEEN start_at AND end_at
        ORDER BY created_at DESC
        `
    ).all() as Poll[];
    console.log(polls)
    return Promise.resolve(polls);
  }

  closePoll(pollId: number) {
    db.prepare(`UPDATE polls SET status = 'closed' WHERE id = ?`).run(pollId);
  }

  listPastPolls(): Promise<Poll[]> {
    const polls = db.prepare(
      `SELECT * FROM polls 
        WHERE status = 'closed' OR strftime('%s', 'now') > end_at
        ORDER BY end_at DESC`
    ).all() as Poll[];
    return Promise.resolve(polls);
  }

  getPoll(id: number): Promise<Poll | undefined> {
    const poll = db.prepare('SELECT * FROM polls WHERE id = ?').get(id) as Poll | undefined;
    return Promise.resolve(poll);
  }

  getPollAggregates(pollId: number): Promise<PollAggregate | undefined> {
    const agg = db.prepare(
      'SELECT * FROM poll_aggregates WHERE poll_id = ?'
    ).get(pollId) as PollAggregate | undefined;
    return Promise.resolve(agg);
  }

  hasVoted(pollId: number, voterHash: string): Promise<boolean> {
    const result = db.prepare(
      'SELECT 1 FROM poll_voter_keys WHERE poll_id = ? AND voter_hash = ?'
    ).get(pollId, voterHash);
    return Promise.resolve(!!result);
  }

  recordVote(pollId: number, voterHash: string): Promise<void> {
    db.prepare(
      'INSERT INTO poll_voter_keys (poll_id, voter_hash) VALUES (?, ?)'
    ).run(pollId, voterHash);
    return Promise.resolve();
  }

  updateAggregates(
    pollId: number,
    vote: 'yes' | 'no',
    attributes?: {
      age_bracket?: string;
      gender?: string;
      residence?: string;
      verification_method?: string;
    }
  ) {
    const updates: string[] = ['total_votes = total_votes + 1'];

    if (vote === 'yes') {
      updates.push('yes_count = yes_count + 1');
    } else {
      updates.push('no_count = no_count + 1');
    }

    if (attributes?.verification_method === 'sa_id') {
      updates.push('verified_total = verified_total + 1');
      updates.push('verified_sa_id = verified_sa_id + 1');
    } else if (attributes?.verification_method === 'self_attest') {
      updates.push('verified_total = verified_total + 1');
      updates.push('verified_self_attest = verified_self_attest + 1');
    }

    if (attributes?.age_bracket) {
      const ageMap: Record<string, string> = {
        '<18': 'age_lt_18',
        '18-24': 'age_18_24',
        '25-34': 'age_25_34',
        '35-44': 'age_35_44',
        '45-54': 'age_45_54',
        '55+': 'age_55p',
      };
      const field = ageMap[attributes.age_bracket];
      if (field) updates.push(`${field} = ${field} + 1`);
    }

    if (attributes?.gender) {
      const genderMap: Record<string, string> = {
        male: 'gender_male',
        female: 'gender_female',
        other: 'gender_other',
      };
      const field = genderMap[attributes.gender];
      if (field) {
        updates.push(`${field} = ${field} + 1`);
      } else {
        updates.push('gender_unspecified = gender_unspecified + 1');
      }
    } else {
      updates.push('gender_unspecified = gender_unspecified + 1');
    }

    if (attributes?.residence) {
      if (attributes.residence === 'in-country') {
        updates.push('res_in_country = res_in_country + 1');
      } else if (attributes.residence === 'outside') {
        updates.push('res_outside = res_outside + 1');
      } else {
        updates.push('res_unspecified = res_unspecified + 1');
      }
    } else {
      updates.push('res_unspecified = res_unspecified + 1');
    }

    const sql = `UPDATE poll_aggregates SET ${updates.join(', ')} WHERE poll_id = ?`;
    db.prepare(sql).run(pollId);
  }

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
  ): void {
    const lastEntry = db.prepare(
      'SELECT seq, rolling_sha256 FROM poll_audit WHERE poll_id = ? ORDER BY seq DESC LIMIT 1'
    ).get(pollId) as { seq: number; rolling_sha256: string } | undefined;

    const nextSeq = lastEntry ? lastEntry.seq + 1 : 1;
    const prevHash = lastEntry?.rolling_sha256 || '0'.repeat(64);

    const flagsJson = JSON.stringify(attributes || {});
    const ts = new Date().getTime();

    const dataToHash = `${pollId}-${nextSeq}-${vote}-${voterHash}-${prevHash}`;
    const rollingHash = createHash('sha256').update(dataToHash).digest('hex');

    db.prepare(
      `INSERT INTO poll_audit (poll_id, seq, ts, vote, flags_json, voter_hash, rolling_sha256)
            VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(pollId, nextSeq, ts, vote, flagsJson, voterHash, rollingHash);
  }
}