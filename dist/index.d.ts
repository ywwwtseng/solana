import * as _solana_spl_token from '@solana/spl-token';
import * as _solana_web3_js from '@solana/web3.js';
import { Connection, ParsedTransactionWithMeta, Keypair, PublicKey } from '@solana/web3.js';

declare class SolanaRPC {
    readonly network: 'mainnet' | 'devnet';
    readonly url: string | undefined;
    readonly connection: Connection;
    constructor({ url, network, }: {
        url?: string;
        network?: 'mainnet' | 'devnet';
    });
    init({ url, network }: {
        url?: string;
        network?: 'mainnet' | 'devnet';
    }): SolanaRPC;
    getSignaturesForAddress({ address, ...configuration }: {
        address: string;
        limit?: number;
        commitment?: string;
        minContextSlot?: number;
        before?: string;
        until?: string;
    }): Promise<string[]>;
    getTransaction({ signature }: {
        signature: string;
    }): Promise<ParsedTransactionWithMeta>;
    getBalance({ publicKey, tokenAddress, }: {
        publicKey: string;
        tokenAddress?: string | null;
    }): Promise<number | bigint>;
    sendTransaction({ privateKey, destination, tokenAddress, amount, }: {
        privateKey: string;
        destination: string;
        tokenAddress?: string | null;
        amount: number;
    }): Promise<string>;
    getMint({ mint }: {
        mint: string;
    }): Promise<_solana_spl_token.Mint>;
}

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

type TransferInfo = {
    source: string;
    destination: string;
    amount: number;
    mint?: string;
};
declare function parseTransfers(parsedTransaction: ParsedTransactionWithMeta): TransferInfo[];
declare function hasAta(connection: Connection, mintAddress: string, ownerAddress: string): Promise<boolean>;
declare function createAtaInstruction(payer: PublicKey, mint: PublicKey, owner: PublicKey): _solana_web3_js.TransactionInstruction;

export { KeyVaultService, SolanaRPC, createAtaInstruction, hasAta, parseTransfers };
