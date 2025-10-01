import * as bip39 from '@scure/bip39';
import * as bip32 from '@scure/bip32';
import { Address, Tap } from '@cmdcode/tapscript'

export const buf2hex = (buffer: ArrayBuffer) => { // buffer is an ArrayBuffer
  return [...new Uint8Array(buffer)]
      .map(x => x.toString(16).padStart(2, '0'))
      .join('');
}

export const generateTapRootAddress = async (publicKey: Uint8Array) => {
  const [ tpubkey ] = Tap.getPubKey(publicKey)
  return Address.p2tr.fromPubKey(tpubkey)
}

export const generateChildKey = async (mnemonic: string) => {
  const seed = await bip39  .mnemonicToSeed(mnemonic as string)
  let rootKey = bip32.HDKey.fromMasterSeed(seed)
  const child = rootKey.derive("m/86'/0'/0'/0/0");
  return child
}