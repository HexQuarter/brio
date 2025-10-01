import { buf2hex } from "@/helpers/crypto"

function rpcEndpoint() {
    return import.meta.env.DEV ? 'http://localhost:3000/rpc' : 'https://dev.backend.brio.hexquarter.com/rpc'
}

type RegisterParams = {
    tapRootAddress: string
    publicKey: string
    breezBtcAddress: string 
    breezBolt12Offer: string
    tgInitData: string
}

export const registerUser = async (params: RegisterParams) => {

    console.log(params)

    return await fetch(rpcEndpoint(), {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        body: JSON.stringify({
            operation: 'create-user',
            payload: {
                tapRootAddress: params.tapRootAddress,
                publicKey: params.publicKey,
                breezBtcAddress: params.breezBtcAddress,
                breezBolt12Offer: params.breezBolt12Offer,
                tgInitData: params.tgInitData
            }
        })
    })
}

export const fetchUserInfo = async (handle: string) => {
    const digest = await crypto.subtle.digest("sha-256", new TextEncoder().encode(handle))
    return await fetch(rpcEndpoint(), {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        body: JSON.stringify({
            operation: 'search-user',
            payload: {
                handle: buf2hex(digest)
            }
        })
    })
}