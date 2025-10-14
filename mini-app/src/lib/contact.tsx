import { cloudStorage } from "@telegram-apps/sdk-react"

export const listContacts = async (): Promise<string[]> => {
    const localContacts = sessionStorage.getItem('contacts')
    if (localContacts) {
        return JSON.parse(localContacts) as string[]
    }
    if (!import.meta.env.DEV && cloudStorage.getItem.isAvailable()) {
        const cloudContacts = await cloudStorage.getItem('contacts')
        if (cloudContacts) {
            const contacts = JSON.parse(cloudContacts)
            sessionStorage.setItem('contacts', contacts)
            return contacts
        }
    }
    return []
}

export const addContact = async (handle: string) => {
    const formattedHandle = handle.startsWith('@') ? handle : `@${handle}`
    let contacts = await listContacts()
    const contactSet = new Set(contacts)
    if (contactSet.has(formattedHandle)) {
        return
    }
    contacts = Array.from(contactSet.add(formattedHandle))
    const serializedContact = JSON.stringify(contacts)
    sessionStorage.setItem('contacts', serializedContact)
    if (!import.meta.env.DEV && cloudStorage.setItem.isAvailable()) {
        await cloudStorage.setItem('contacts', serializedContact)
    }
}

export const removeContact = async (contact: string) => {
    const contacts = await listContacts()
    const filteredContacts = contacts.filter(c => c != contact)
    if (!import.meta.env.DEV && cloudStorage.setItem.isAvailable()) {
        await cloudStorage.setItem('contacts', JSON.stringify(filteredContacts))
    }
    sessionStorage.setItem('contacts', JSON.stringify(filteredContacts))
}