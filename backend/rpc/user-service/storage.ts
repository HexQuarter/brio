export interface UserServiceStorage {
  getUserContact(contactDigest: string): Promise<{ chatID: string } | null>;
  getUserByChatID(chatID: string): Promise<UserItem | null>;
  addUserContact(contactDigest: string, chatID: string): Promise<void>;
  createUser(userItem: UserItem): Promise<void>;
}

export type UserItem = {
  chatID: string,
  publicKey: string,
  breezBtcAddress: string,
  breezLnUrl: string,
  tapRootAddress: string,
  handle: string | null,
  phoneNumber: string | null
}