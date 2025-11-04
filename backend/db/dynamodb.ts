import { UserContact, UserItem, UserServiceStorage } from "../rpc/user-service/storage"
import { PaymentServiceStorage, PaymentItem } from '../rpc/payment-service/storage';
import { Org, OrgInsertion, OrgListing, Poll, PollAggregate, PollInsertion, PollListing, VoteServiceStorage } from '../rpc/vote-service/storage';
import { createHash, randomBytes } from 'crypto';

import { DynamoDBClient, GetItemCommand, PutItemCommand, QueryCommand, TransactWriteItem, TransactWriteItemsCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";

const prod = process.env['PROD'] || true
const dev = process.env['DEV'] || false
const WALLET_TABLE = prod === true && dev === false ? 'wallet' : 'wallet_dev'
const POLLS_TABLE = prod === true && dev === false ? 'polls' : 'polls_dev'

const pollPartitioner = (pollId: string, orgId: string) => `${orgId}-${pollId}`
const pollDepartitioner = (pollPartition: String) => {
  const [orgId, pollId] = pollPartition.split('-')
  return { orgId, pollId }
}

export class DynamodbStorage implements UserServiceStorage, PaymentServiceStorage, VoteServiceStorage {

  private db: DynamoDBClient

  constructor() {
    this.db = new DynamoDBClient({});
  }

  async getUserByChatID(chatID: string): Promise<UserItem | null> {
    const res = await this.db.send(new GetItemCommand({
      TableName: WALLET_TABLE,
      Key: {
        PK: { S: `USER#${chatID}` },
        SK: { S: "PROFILE" }
      }
    }));

    if (res.$metadata.httpStatusCode !== 200) {
      throw new Error(res.$metadata.httpStatusCode?.toString())
    }

    if (!res.Item) {
      return null
    }

    return {
      chatID: res.Item.chatID.S || '',
      publicKey: res.Item.publicKey.S || '',
      breezBtcAddress: res.Item.breezBtcAddress.S || '',
      breezLnUrl: res.Item.breezLnUrl.S || '',
      tapRootAddress: res.Item.tapRootAddress.S || '',
      handle: res.Item.handle.S || '',
      phoneNumber: res.Item.phoneNumber.S || ''
    };
  }

  async getUserContact(contactDigest: string): Promise<UserContact | null> {
    const res = await this.db.send(new GetItemCommand({
      TableName: WALLET_TABLE,
      Key: {
        PK: { S: `CONTACT#${contactDigest}` },
        SK: { S: `LOOKUP`}
      }
    }));
    if (res.$metadata.httpStatusCode !== 200) {
      throw new Error(res.$metadata.httpStatusCode?.toString())
    }

    if (!res.Item) {
      return null
    }

    return {
      chatID: res.Item?.chatID.S || '',
      breezBtcAddress: res.Item?.breezBtcAddress.S || '',
      breezLnUrl: res.Item?.breezLnUrl.S || '',
      tapRootAddress: res.Item?.tapRootAddress.S || ''
    }
  }

  async createUser(user: UserItem): Promise<void> {
    const items: TransactWriteItem[] = [];

    // user profile
    items.push({
      Put: {
        TableName: WALLET_TABLE,
        Item: {
          PK: { S: `USER#${user.chatID}` },
          SK: { S: "PROFILE" },
          Type: { S: "User" },
          chatID: { S: user.chatID },
          publicKey: { S: user.publicKey },
          breezBtcAddress: { S: user.breezBtcAddress },
          breezLnUrl: { S: user.breezLnUrl },
          tapRootAddress: { S: user.tapRootAddress },
          handle: { S: user.handle || "" },
          phoneNumber: { S: user.phoneNumber || "" },
        },
      }
    })

    // contact lookups
    for (const contact of [user.handle, user.phoneNumber]) {
      if (!contact) continue;
      items.push({
        Put: {
          TableName: WALLET_TABLE,
          Item: {
            PK: { S: `CONTACT#${contact}` },
            SK: { S: `LOOKUP` },
            Type: { S: "ContactLookup" },
            chatID: { S: user.chatID },
            breezBtcAddress: { S: user.breezBtcAddress },
            breezLnUrl: { S: user.breezLnUrl },
            tapRootAddress: { S: user.tapRootAddress }
          }
        },
      });
    }

    const res = await this.db.send(new TransactWriteItemsCommand({
      TransactItems: items
    }))
    if(res.$metadata.httpStatusCode !== 200) {
      throw new Error(res.$metadata.httpStatusCode?.toString())
    }
  }

  async createPayment(paymentItem: PaymentItem): Promise<void> {
    const res = await this.db.send(new PutItemCommand({
      TableName: WALLET_TABLE,
      Item: {
        PK: { S: `PAYMENT#${paymentItem.id}` },
        SK: { S: "DETAILS" },
        Type: { S: "Payment" },
        paymentId: { S: paymentItem.id },
        amount: { N: paymentItem.amount.toString() },
        method: { S: paymentItem.method }
      }
    }));
    if (res.$metadata.httpStatusCode !== 200) {
      throw new Error(res.$metadata.httpStatusCode?.toString())
    }
  }

  async getPayment(paymentId: string): Promise<PaymentItem | null> {
    const res = await this.db.send(new GetItemCommand({
      TableName: WALLET_TABLE,
      Key: {
        PK: { S: `PAYMENT#${paymentId}` },
        SK: { S: "DETAILS" }
      }
    }));
    if (res.$metadata.httpStatusCode !== 200) {
      throw new Error(res.$metadata.httpStatusCode?.toString())
    }

    if (!res.Item) {
      return null
    }

    return {
      id: paymentId,
      amount: Number(res.Item.amount.N) || 0,
      method: res.Item.method.S || ''
    }
  }

  async createOrg(org: OrgInsertion): Promise<string> {
    const orgID = createHash('sha256').update(`${org.chat_id}-${org.name}`).digest('hex') as string

    const command = new TransactWriteItemsCommand({
      TransactItems: [
        {
          Put: {
            TableName: POLLS_TABLE,
            Item: {
              PK: { S: `ORG#${orgID}` },
              SK: { S: `ORG#${orgID}` },
              Type: { S: 'Org' },
              name: { S: org.name },
              purpose: { S: org.purpose || '' },
              scope_level: { S: org.scope_level },
              geographic_scope: { S: org.geographic_scope },
              countries: { S: org.scope_level === 'countries' ? org.geographic_scope : '' },
              logo_url: { S: org.logo_url || '' },
              chat_id: { N: org.chat_id.toString() },
              created_at: { N: Date.now().toString() }
            }
          }
        },
        {
          Put: {
            TableName: POLLS_TABLE,
            Item: {
              PK: { S: `CHAT#${org.chat_id}` },
              SK: { S: `ORG#${orgID}` },
              Type: { S: 'OrgChatRef' },
              org_id: { S: orgID },
              name: { S: org.name }
            }
          }
        }
      ]
    })
    const commandRes = await this.db.send(command);
    if (commandRes.$metadata.httpStatusCode !== 200) {
      throw new Error(commandRes.$metadata.httpStatusCode?.toString())
    }

    return orgID
  }

  async getOrg(id: string): Promise<Org | undefined> {
    const getCommand = new GetItemCommand({
      TableName: POLLS_TABLE,
      Key: {
        PK: { S: `ORG#${id}` },
        SK: { S: `ORG#${id}` }
      }
    })

    const commandRes = await this.db.send(getCommand);
    if (commandRes.$metadata.httpStatusCode !== 200) {
      throw new Error(commandRes.$metadata.httpStatusCode?.toString())
    }
    if (!commandRes.Item) {
      return undefined
    }

    const scopeLevel = commandRes.Item.scope_level.S || 'world'
    return {
      id: id,
      name: commandRes.Item.name.S || '',
      chat_id: Number(commandRes.Item.chat_id.N) || 0,
      scope_level: (scopeLevel as 'region' | 'countries' | 'continent' | 'world' | 'city' | 'community'),
      logo_url: commandRes.Item.logo_url.S,
      geographic_scope: commandRes.Item.geographic_scope.S || '',
      purpose: commandRes.Item.purpose.S,
      created_at: Number(commandRes.Item.created_at.N) || 0,
    }
  }

  async listOrgByChatId(chatId: number): Promise<OrgListing[]> {
    const queryCommand = new QueryCommand({
      TableName: POLLS_TABLE,
      KeyConditionExpression: "PK = :pk",
      ExpressionAttributeValues: { ":pk": { S: `CHAT#${chatId}` } },
    })

    const queryCommandRes = await this.db.send(queryCommand);
    if (queryCommandRes.$metadata.httpStatusCode !== 200) {
      throw new Error(queryCommandRes.$metadata.httpStatusCode?.toString())
    }

    return (queryCommandRes.Items || []).map(item => ({
      id: item.org_id.S || '',
      name: item.name.S || ''
    })) as OrgListing[]
  }

  async createPoll(poll: PollInsertion): Promise<string> {
    const hashSalt = randomBytes(32).toString('hex')
    const pollId = createHash('sha256').update(hashSalt).digest('hex')
    const transactCommand = new TransactWriteItemsCommand({
      TransactItems: [
        {
          Put: {
            TableName: POLLS_TABLE,
            Item: {
              PK: { S: `ORG#${poll.org_id}` },
              SK: { S: `POLL#${pollId}` },
              Type: { S: 'Poll' },
              question: { S: poll.question },
              scope_level: { S: poll.scope_level },
              geographic_scope: { S: poll.geographic_scope },
              countries: { S: poll.scope_level === 'countries' ? poll.geographic_scope : '' },
              start_at: { N: poll.start_at.toString() },
              end_at: { N: poll.end_at.toString() },
              hash_salt: { S: hashSalt },
              status: { S: 'active' },
              created_at: { N: Date.now().toString() }
            }
          },
        },
        {
          Put: {
            TableName: POLLS_TABLE,
            Item: {
              PK: { S: `ACTIVE_POLLS` },
              SK: { S: `ORG#${poll.org_id}#POLL#${pollId}#${poll.end_at.toString()}` },
              Type: { S: 'ActivePollRef' },
              poll_id: { S: pollId },
              org_id: { S: poll.org_id },
              question: { S: poll.question },
              end_at: { N: poll.end_at.toString() },
            }
          }
        },
        {
          Put: {
            TableName: POLLS_TABLE,
            Item: {
              PK: { S: `ORG#${poll.org_id}` },
              SK: { S: `POLL#${pollId}#AGGREGATE` },
              Type: { S: 'Aggregate' },
              total_votes: { N: '0' },
              yes_count: { N: '0' },
              no_count: { N: '0' }
            }
          }
        }
      ]
    })

    const commandRes = await this.db.send(transactCommand)
    if (commandRes.$metadata.httpStatusCode !== 200) {
      throw new Error(commandRes.$metadata.httpStatusCode?.toString())
    }

    return Promise.resolve(pollPartitioner(pollId, poll.org_id))
  }

  async listPolls(): Promise<Poll[]> {
    const queryCommand = new QueryCommand({
      TableName: POLLS_TABLE,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :poll)'
    });

    const commandRes = await this.db.send(queryCommand)
    if (commandRes.$metadata.httpStatusCode !== 200) {
      throw new Error(commandRes.$metadata.httpStatusCode?.toString())
    }

    return (commandRes.Items || []).map(item => ({
      id: item.poll_id.S || '',
      question: item.question.S || '',
      hash_salt: item.hash_salt.S || '',
      created_at: Number(item.create_at.N) || 0,
      status: item.status.N || '',
      end_at: item.end_at.N || 0,
      start_at: item.start_at.N || 0,
      org_id: item.org_id.S || '',
      scope_level: item.scope_level.S || '',
      geographic_scope: item.geographic_scope.S || ''
    })) as Poll[]
  }


  async listActivePolls(): Promise<PollListing[]> {
    const queryCommand = new QueryCommand({
      TableName: POLLS_TABLE,
      KeyConditionExpression: 'PK = :pk AND SK >= :now',
      ExpressionAttributeValues: {
        ":pk": { S: "ACTIVE_POLLS" },
        ":now": { S: Date.now().toString() },
      },
    })

    const commandRes = await this.db.send(queryCommand)
    if (commandRes.$metadata.httpStatusCode !== 200) {
      throw new Error(commandRes.$metadata.httpStatusCode?.toString())
    }

    return (commandRes.Items || []).map(item => ({
      id: item.poll_id.S || '',
      question: item.question.S || '',
      end_at: item.end_at.N || 0,
      org_id: item.org_id.S || ''
    })) as PollListing[]
  }

  async listPastPolls(): Promise<PollListing[]> {
    const queryCommand = new QueryCommand({
      TableName: POLLS_TABLE,
      KeyConditionExpression: "PK = :pk",
      ExpressionAttributeValues: {
        ":pk": { S: "PAST_POLLS" },
      }
    })

    const commandRes = await this.db.send(queryCommand)
    if (commandRes.$metadata.httpStatusCode !== 200) {
      throw new Error(commandRes.$metadata.httpStatusCode?.toString())
    }

    return (commandRes.Items || []).map(item => ({
      id: item.poll_id.S || '',
      question: item.question.S || '',
      end_at: item.end_at.N || 0,
      org_id: item.org_id.S || ''
    })) as PollListing[]
  }

  async closePoll(poll: Poll) {
    const pollKey = {
      PK: { S: `ORG#${poll.org_id}` },
      SK: { S: `POLL#${poll.id}` }
    }

    const activeKey = {
      PK: { S: "ACTIVE_POLLS" },
      SK: { S: `ORG#${poll.org_id}#POLL#${poll.id}#${poll.end_at}` }
    };

    const transactCommand = new TransactWriteItemsCommand({
      TransactItems: [
        {
          Update: {
            TableName: POLLS_TABLE,
            Key: pollKey,
            UpdateExpression: "SET #s = :closed",
            ExpressionAttributeNames: { "#s": "status" },
            ExpressionAttributeValues: { ":closed": { S: "closed" } },
          }
        },
        {
          Delete: {
            TableName: POLLS_TABLE,
            Key: activeKey
          }
        },
        {
          Put: {
            TableName: POLLS_TABLE,
            Item: {
              PK: { S: "PAST_POLLS" },
              SK: { S: `ORG#${poll.org_id}#POLL#${poll.id}#${poll.end_at}` },
              Type: { S: "PastPollRef" },
              org_id: { S: poll.org_id },
              poll_id: { S: poll.id },
              question: { S: poll.question },
              end_at: { N: poll.end_at.toString() }
            }
          },
        },
      ]
    })

    const commandRes = await this.db.send(transactCommand)
    if (commandRes.$metadata.httpStatusCode !== 200) {
      throw new Error(commandRes.$metadata.httpStatusCode?.toString())
    }
  }

  async getPoll(pollPartition: string): Promise<Poll | undefined> {
    const { orgId, pollId } = pollDepartitioner(pollPartition)
    const command = new GetItemCommand({
      TableName: POLLS_TABLE,
      Key: {
        PK: { S: `ORG#${orgId}` },
        SK: { S: `POLL#${pollId}` }
      }
    })

    const commandRes = await this.db.send(command)
    if (commandRes.$metadata.httpStatusCode !== 200) {
      throw new Error(commandRes.$metadata.httpStatusCode?.toString())
    }

    if (!commandRes.Item) {
      return undefined
    }

    return {
      id: pollId,
      hash_salt: commandRes.Item.hash_salt.S || '',
      created_at: Number(commandRes.Item.created_at.N) || 0,
      status: (commandRes.Item.status.S === 'active' ? 'active' : 'closed'),
      org_id: orgId,
      question: commandRes.Item.question.S || '',
      scope_level: (commandRes.Item.scope_level.S || 'countries') as 'region' | 'countries' | 'continent' | 'world' | 'city' | 'community',
      geographic_scope: commandRes.Item.geographic_scope.S || '',
      start_at: Number(commandRes.Item.start_at.N) || 0,
      end_at: Number(commandRes.Item.end_at.N) || 0
    }
  }

  async getPollAggregates(pollPartition: string): Promise<PollAggregate | undefined> {
    const { orgId, pollId } = pollDepartitioner(pollPartition)
    const command = new GetItemCommand({
      TableName: POLLS_TABLE,
      Key: {
        PK: { S: `ORG#${orgId}` },
        SK: { S: `POLL#${pollId}#AGGREGATE` }
      }
    })

    const commandRes = await this.db.send(command)
    if (commandRes.$metadata.httpStatusCode !== 200) {
      throw new Error(commandRes.$metadata.httpStatusCode?.toString())
    }

    if (!commandRes.Item) {
      return undefined
    }

    return {
      poll_id: pollId,
      total_votes: Number(commandRes.Item.total_votes.N) || 0,
      yes_count: Number(commandRes.Item.yes_count.N) || 0,
      no_count: Number(commandRes.Item.no_count.N) || 0,
      verified_total: commandRes.Item.verified_total ? Number(commandRes.Item.verified_total.N) : 0,
      age_lt_18: commandRes.Item.age_lt_18 ? Number(commandRes.Item.age_lt_18.N) : 0,
      age_18_24: commandRes.Item.age_18_24 ? Number(commandRes.Item.age_18_24.N) : 0,
      age_25_34: commandRes.Item.age_25_34 ? Number(commandRes.Item.age_25_34.N) : 0,
      age_35_44: commandRes.Item.age_35_44 ? Number(commandRes.Item.age_35_44.N) : 0,
      age_45_54: commandRes.Item.age_45_54 ? Number(commandRes.Item.age_45_54.N) : 0,
      age_55p: commandRes.Item.age_55p ? Number(commandRes.Item.age_55p.N) : 0,
      gender_male: commandRes.Item.gender_male ? Number(commandRes.Item.gender_male.N) : 0,
      gender_female: commandRes.Item.gender_female ? Number(commandRes.Item.gender_female.N) : 0,
      gender_other: commandRes.Item.gender_other ? Number(commandRes.Item.gender_other.N) : 0,
      gender_unspecified: commandRes.Item.gender_unspecified ? Number(commandRes.Item.gender_unspecified.N) : 0,
      res_in_country: commandRes.Item.res_in_country ? Number(commandRes.Item.res_in_country.N) : 0,
      res_outside: commandRes.Item.res_outside ? Number(commandRes.Item.res_outside.N) : 0,
      res_unspecified: commandRes.Item.res_unspecified ? Number(commandRes.Item.res_unspecified.N) : 0,
      verified_self_attest: commandRes.Item.verified_self_attest ? Number(commandRes.Item.verified_self_attest.N) : 0,
      verified_sa_id: commandRes.Item.verified_sa_id ? Number(commandRes.Item.verified_sa_id.N) : 0
    }
  }

  async hasVoted(pollPartition: string, voterHash: string): Promise<boolean> {
    const { orgId, pollId } = pollDepartitioner(pollPartition)
    const command = new GetItemCommand({
      TableName: POLLS_TABLE,
      Key: {
        PK: { S: `ORG#${orgId}` },
        SK: { S: `POLL#${pollId}#VOTER#${voterHash}` }
      }
    })

    const commandRes = await this.db.send(command)
    if (commandRes.$metadata.httpStatusCode !== 200) {
      throw new Error(commandRes.$metadata.httpStatusCode?.toString())
    }

    return !!commandRes.Item
  }

  async recordVote(pollPartition: string, voterHash: string): Promise<void> {
    const { orgId, pollId } = pollDepartitioner(pollPartition)
    const command = new PutItemCommand({
      TableName: POLLS_TABLE,
      Item: {
        PK: { S: `ORG#${orgId}` },
        SK: { S: `POLL#${pollId}#VOTER#${voterHash}` },
        Type: { S: 'VoterKey' },
        created_at: { N: Date.now().toString() }
      },
      ConditionExpression: 'attribute_not_exists(SK)'
    })

    const commandRes = await this.db.send(command)
    if (commandRes.$metadata.httpStatusCode !== 200) {
      throw new Error(commandRes.$metadata.httpStatusCode?.toString())
    }
  }

  async updateAggregates(
    pollPartition: string,
    vote: 'yes' | 'no',
    attributes?: {
      age_bracket?: string;
      gender?: string;
      residence?: string;
      verification_method?: string;
    }
  ) {
    const { orgId, pollId } = pollDepartitioner(pollPartition)

    const key = {
      PK: { S: `ORG#${orgId}` },
      SK: { S: `POLL#${pollId}#AGGREGATE` },
    };

    const inc = (field: string) => `${field} = if_not_exists(${field}, :zero) + :one`;

    // --- Base counters ---
    const updates: string[] = [
      inc("total_votes"),
      inc(vote === "yes" ? "yes_count" : "no_count"),
    ];

    // --- Verification methods ---
    if (attributes?.verification_method === "sa_id") {
      updates.push(inc("verified_total"));
      updates.push(inc("verified_sa_id"));
    } else if (attributes?.verification_method === "self_attest") {
      updates.push(inc("verified_total"));
      updates.push(inc("verified_self_attest"));
    }

    // --- Age brackets ---
    const ageMap: Record<string, string> = {
      "<18": "age_lt_18",
      "18-24": "age_18_24",
      "25-34": "age_25_34",
      "35-44": "age_35_44",
      "45-54": "age_45_54",
      "55+": "age_55p",
    };
    if (attributes?.age_bracket && ageMap[attributes.age_bracket]) {
      updates.push(inc(ageMap[attributes.age_bracket]));
    }

    // --- Gender ---
    const genderMap: Record<string, string> = {
      male: "gender_male",
      female: "gender_female",
      other: "gender_other",
    };
    if (attributes?.gender && genderMap[attributes.gender]) {
      updates.push(inc(genderMap[attributes.gender]));
    } else {
      updates.push(inc("gender_unspecified"));
    }

    // --- Residence ---
    if (attributes?.residence === "in-country") {
      updates.push(inc("res_in_country"));
    } else if (attributes?.residence === "outside") {
      updates.push(inc("res_outside"));
    } else {
      updates.push(inc("res_unspecified"));
    }

    const UpdateExpression = `SET ${updates.join(", ")}`;

    const command = new UpdateItemCommand({
      TableName: POLLS_TABLE!,
      Key: key,
      UpdateExpression,
      ExpressionAttributeValues: {
        ":one": { N: '1' },
        ":zero": { N: '0' },
      },
      ReturnValues: "UPDATED_NEW",
    });

    const commandRes = await this.db.send(command);
    if (commandRes.$metadata.httpStatusCode !== 200) {
      throw new Error(commandRes.$metadata.httpStatusCode?.toString())
    }
  }

  async appendAuditLog(
    pollPartition: string,
    vote: 'yes' | 'no',
    voterHash: string,
    attributes?: {
      age_bracket?: string;
      gender?: string;
      residence?: string;
      verification_method?: string;
    }
  ) {
    const { orgId, pollId } = pollDepartitioner(pollPartition)

    const lastQuery = new QueryCommand({
      TableName: POLLS_TABLE!,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
      ExpressionAttributeValues: {
        ":pk": { S: `ORG#${orgId}` },
        ":prefix": { S: `POLL#${pollId}#AUDIT#` }
      },
      ScanIndexForward: false, // descending order
      Limit: 1,
    });

    let commandRes = await this.db.send(lastQuery);
    if (commandRes.$metadata.httpStatusCode !== 200) {
      throw new Error(commandRes.$metadata.httpStatusCode?.toString())
    }

    if (!commandRes.Items) {
      return
    }

    const lastEntry = commandRes.Items[0];
    const lastSeq = commandRes.Items.length > 0 ? parseInt(lastEntry?.SK?.S?.split("#").pop()!) : 0;
    const prevHash = lastEntry?.rolling_sha256 || "0".repeat(64);

    const nextSeq = lastSeq + 1;
    const seqStr = nextSeq.toString().padStart(6, "0");

    const ts = Date.now();
    const flagsJson = JSON.stringify(attributes || {});
    const dataToHash = `${pollId}-${nextSeq}-${vote}-${voterHash}-${prevHash}`;
    const rollingHash = createHash("sha256").update(dataToHash).digest("hex");

    const newAuditItem = {
      PK: { S: `ORG#${orgId}` },
      SK: { S: `POLL#${pollId}#AUDIT#${seqStr}` },
      Type: { S: "Audit" },
      poll_id: { S: pollId },
      seq: { N: nextSeq.toString() },
      ts: { N: ts.toString() },
      vote: { S: vote },
      flags_json: { S: flagsJson },
      voter_hash: { S: voterHash },
      rolling_sha256: { S: rollingHash },
    };

    commandRes = await this.db.send(
      new PutItemCommand({
        TableName: POLLS_TABLE,
        Item: newAuditItem,
        ConditionExpression: "attribute_not_exists(SK)", // prevent overwrite
      })
    );

    if (commandRes.$metadata.httpStatusCode !== 200) {
      throw new Error(commandRes.$metadata.httpStatusCode?.toString())
    }
  }
}