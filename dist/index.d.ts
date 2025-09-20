import { ParsedTransactionWithMeta } from '@solana/web3.js';

declare class SolanaRPC {
    readonly network: 'mainnet' | 'devnet';
    readonly url: string | undefined;
    constructor({ url, network, }: {
        url?: string;
        network?: 'mainnet' | 'devnet';
    });
    init({ url, network }: {
        url?: string;
        network?: 'mainnet' | 'devnet';
    }): SolanaRPC;
    calculateReceived(parsedTransaction: ParsedTransactionWithMeta): {
        source: string;
        destination: string;
        lamports: number;
    }[];
    generate(): {
        publicKey: string;
        privateKey: string;
    };
    publicKey(privateKey: string): string;
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
    getBalance({ publicKey }: {
        publicKey: string;
    }): Promise<number>;
    sendTransaction({ privateKey, destination, lamports, }: {
        privateKey: string;
        destination: string;
        lamports: number;
    }): Promise<string>;
}

export { SolanaRPC };
