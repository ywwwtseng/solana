import { Keypair } from '@solana/web3.js';

export class KeyPair {
  public static from(privateKey: string | Uint8Array): Keypair {
    return Keypair.fromSecretKey(
      privateKey instanceof Uint8Array
        ? privateKey
        : Uint8Array.from(Buffer.from(privateKey, 'hex'))
    );
  }
}
