import cron from 'node-cron';
import { Poll, VoteServiceStorage } from '../rpc/vote-service/storage';
import { getBotToken } from '../bot';

export const startCronClosingPolls = (db: VoteServiceStorage) => {
  cron.schedule('* * * * *', async () => {
    try {
      const polls = await db.listPolls()
      const now = new Date()
      polls
        .filter(p => p.status == 'active')
        .forEach(async (poll: Poll) => {
          if (now.getTime() > poll.end_at * 1000) {
            db.closePoll(poll.id)
            console.log('Closing poll ', poll.id)
            await notifyPollResults(db, poll);
          }
        })
    }
    catch (e) {
      const error = e as Error
      console.error('Close closing polls cron error:', error);
    }
  });
}

async function notifyPollResults(db: VoteServiceStorage, poll: Poll) {
  const aggregate = await db.getPollAggregates(poll.id);
  if (aggregate) {
    const org = await db.getOrg(poll.org_id);
    if (org) {
      const message = 
      `
      Poll #${aggregate.poll_id} has closed.

      Results:
      ✅ Yes: ${aggregate.yes_count}  
      ❌ No: ${aggregate.no_count}  
      📊 Total votes: ${aggregate.total_votes}

      Verified voters: ${aggregate.verified_total} (${aggregate.verified_self_attest} self-attested, ${aggregate.verified_sa_id} verified by ID)

      Demographics:
      - Age: <18 (${aggregate.age_lt_18}), 18-24 (${aggregate.age_18_24}), 25-34 (${aggregate.age_25_34}), 35-44 (${aggregate.age_35_44}), 45-54 (${aggregate.age_45_54}), 55+ (${aggregate.age_55p})
      - Gender: Male (${aggregate.gender_male}), Female (${aggregate.gender_female}), Other (${aggregate.gender_other}), Unspecified (${aggregate.gender_unspecified})
      - Residency: In-country (${aggregate.res_in_country}), Abroad (${aggregate.res_outside}), Unspecified (${aggregate.res_unspecified})
      `;
      console.log(message);
      notifyTelegram(org.chat_id, getBotToken(), message);
    }
  }
}

async function notifyTelegram(chatId: string, botToken: string, message: string) {
  return await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: message
    })
  })
}