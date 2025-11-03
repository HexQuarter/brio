import type { InsertOrg, InsertPoll, Vote } from './schema';

export const rpcEndpoint = () => {
    return import.meta.env.DEV ? 'http://localhost:3000' : import.meta.env.VITE_BACKEND_ENDPOINT
}

export async function createOrg(data: InsertOrg) {
  return await fetch(new URL("/rpc", rpcEndpoint()), {
      method: 'POST',
      headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
      },
      body: JSON.stringify({
          operation: 'create-org',
          payload: data
      })
  })
}

export async function listMyOrgs(telegramData: string) {
  return await fetch(new URL("/rpc", rpcEndpoint()), {
      method: 'POST',
      headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
      },
      body: JSON.stringify({
          operation: 'list-my-orgs',
          payload: { tgInitData: telegramData }
      })
  })
  .then(r => r.json())
}

// export async function getOrg(id: number) {
//   // const res = await fetch(`${rpcEndpoint()}/orgs/${id}`);
//   // if (!res.ok) throw new Error(await res.text());
//   // return res.json();
// }

export async function createPoll(data: InsertPoll) {
  return await fetch(new URL("/rpc", rpcEndpoint()), {
      method: 'POST',
      headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
      },
      body: JSON.stringify({
          operation: 'create-poll',
          payload: data
      })
  })
}

export async function getActivePoll(id: string) {
  return await fetch(new URL("/rpc", rpcEndpoint()), {
      method: 'POST',
      headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
      },
      body: JSON.stringify({
          operation: 'get-poll',
          payload: { id }
      })
  })
  .then(r => r.json())
}

export async function listActivePolls() {
  try {
    const res = await fetch(new URL("/rpc", rpcEndpoint()), {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        body: JSON.stringify({
            operation: 'list-active-polls'
        })
    })

    if (res.status != 200) {
        console.error(await res.json())
        return []
    }
    return await res.json()
  }
  catch(e) {
    return []
  }
}

export async function listPastPolls() {
  try {
        const res = await fetch(new URL("/rpc", rpcEndpoint()), {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                operation: 'list-past-polls'
            })
        })
        if (res.status != 200) {
            console.error(await res.json())
            return []
        }
        return await res.json()
    }
    catch(e) {
        return []
    }
}

export async function submitVote(voteData: Vote) {
  return await fetch(new URL("/rpc", rpcEndpoint()), {
      method: 'POST',
      headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
      },
      body: JSON.stringify({
          operation: 'register-vote',
          payload: voteData
      })
  })
}

export async function canVote(pollId: string, tgInitData: string) {
    return await fetch(new URL("/rpc", rpcEndpoint()), {
      method: 'POST',
      headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
      },
      body: JSON.stringify({
          operation: 'check-vote',
          payload: {
            poll_id: pollId,
            tgInitData: tgInitData
          }
      })
  })
  .then(r => r.json())
  .then(({ canVote }) => canVote as boolean)
}
