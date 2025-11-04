export interface UserServiceStorage {
  getUserContact(contactDigest: string): Promise<UserContact | null>;
  getUserByChatID(chatID: string): Promise<UserItem | null>;
  createUser(userItem: UserItem): Promise<void>;
}

export type UserItem = {
  chatID: string
  publicKey: string
  breezBtcAddress: string
  breezLnUrl: string
  tapRootAddress: string
  handle: string | null
  phoneNumber: string | null
}

export type UserContact = {
  chatID: string
  breezBtcAddress: string
  breezLnUrl: string
  tapRootAddress: string
}