import { buf2hex } from "@/helpers/crypto"

export const rpcEndpoint = () => {
    return import.meta.env.DEV ? 'http://localhost:3000' : 'https://dev.backend.brio.hexquarter.com'
}

type RegisterParams = {
    tapRootAddress: string
    publicKey: string
    breezBtcAddress: string 
    breezLnUrl: string
    tgInitData: string
}

export const webHookUrl = (userId: number) => {
    return new URL(`/webhook/${userId}`, rpcEndpoint()).toString()
}

export const registerUser = async (params: RegisterParams) => {
    return await fetch(new URL("/rpc", rpcEndpoint()), {
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
                breezLnUrl: params.breezLnUrl,
                tgInitData: params.tgInitData
            }
        })
    })
}

export const fetchUserInfo = async (handle: string) => {
    const digest = await crypto.subtle.digest("sha-256", new TextEncoder().encode(handle))
    return await fetch(new URL("/rpc", rpcEndpoint()), {
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

export const registerPayment = async(handle: string, paymentId: string) => {
    const digest = await crypto.subtle.digest("sha-256", new TextEncoder().encode(handle))
    return await fetch(new URL("/rpc", rpcEndpoint()), {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        body: JSON.stringify({
            operation: 'register-payment',
            payload: {
                handle: buf2hex(digest),
                payment: paymentId
            }
        })
    })
}