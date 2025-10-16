import * as _solana_web3_js from '@solana/web3.js';
import { Keypair, Connection, SignaturesForAddressOptions, ParsedTransactionWithMeta, PublicKey, Transaction } from '@solana/web3.js';
export * from '@solana/web3.js';

declare class KeyVaultService {
    private encryptionKey;
    constructor(encryptionKey: string);
    encryptPrivateKey(hexPrivateKey: string): string;
    decryptPrivateKey(encrypted: string): string;
    generateWallet(): {
        publicKey: string;
        privateKeyEncrypted: string;
    };
    loadWallet(encryptedPrivateKey: string): Keypair;
}

declare class KeyPair {
    static from(privateKey: string | Uint8Array): Keypair;
}

declare function endpoint(src: string): string;

declare function getSignaturesForAddress(connection: Connection, { address, ...options }: {
    address: string;
} & SignaturesForAddressOptions): Promise<string[]>;

declare function getTransaction(connection: Connection, { signature }: {
    signature: string;
}): Promise<_solana_web3_js.ParsedTransactionWithMeta>;

type Transfer = {
    source: string;
    destination: string;
    amount: string;
    mint?: string;
};

declare function getTransfers(parsedTransaction: ParsedTransactionWithMeta): Transfer[];

declare function getBalance(connection: Connection, { publicKey, tokenAddress, }: {
    publicKey: string;
    tokenAddress?: string | null;
}): Promise<number | bigint>;

declare function hasAta(connection: Connection, mintAddress: string | PublicKey, ownerAddress: string | PublicKey): Promise<boolean>;
declare function createAtaInstruction(payer: PublicKey, mint: PublicKey, owner: PublicKey): _solana_web3_js.TransactionInstruction;
declare function createSolanaTransaction({ source, destination, amount, }: {
    source: string | PublicKey;
    destination: string | PublicKey;
    amount: bigint | string | number;
}): Promise<Transaction>;
declare function createTokenTransaction(connection: Connection, { feePayer, source, destination, amount, mint, }: {
    feePayer: string | PublicKey;
    source: string | PublicKey;
    destination: string | PublicKey;
    amount: bigint | string | number;
    mint: string | PublicKey;
}): Promise<Transaction>;
declare function createTransaction(connection: Connection, { feePayer, source, destination, amount, mint, }: {
    feePayer: string | PublicKey;
    source: string | PublicKey;
    destination: string | PublicKey;
    amount: bigint | string | number;
    mint?: string | PublicKey | null;
}): Promise<Transaction>;

declare function decodeTransfer(connection: Connection, base64: string): Promise<Transfer>;

export { KeyPair, KeyVaultService, createAtaInstruction, createSolanaTransaction, createTokenTransaction, createTransaction, decodeTransfer, endpoint, getBalance, getSignaturesForAddress, getTransaction, getTransfers, hasAta };
