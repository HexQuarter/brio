import { hash } from "@/helpers/crypto"

export const rpcEndpoint = () => {
    return import.meta.env.DEV ? 'http://localhost:3000' : 'https://dev.backend.brio.hexquarter.com'
}

type RegisterParams = {
    tapRootAddress: string
    publicKey: string
    breezBtcAddress: string 
    breezLnUrl: string
    tgInitData: string,
    hashedPhoneNumber?: string
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
                tgInitData: params.tgInitData,
                hashedPhoneNumber: params.hashedPhoneNumber
            }
        })
    })
}

export const fetchLightningAddress = async (contact: string) => {
    const hashedContact = await hash(contact)
    return await fetch(new URL("/rpc", rpcEndpoint()), {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        body: JSON.stringify({
            operation: 'search-lightning-address',
            payload: {
                contact: hashedContact
            }
        })
    })
}

export const registerPayment = async(contact: string, paymentId: string) => {
    const strippedContact = contact.startsWith('@') ? contact.slice(1, contact.length) : contact
    const hashedContact = await hash(strippedContact)
    return await fetch(new URL("/rpc", rpcEndpoint()), {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        body: JSON.stringify({
            operation: 'register-payment',
            payload: {
                contact: hashedContact,
                payment: paymentId
            }
        })
    })
}