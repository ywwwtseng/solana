import {
  type ParsedTransactionWithMeta,
  type ConfirmedSignatureInfo,
  Keypair,
  clusterApiUrl,
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
  getMint,
  createTransferInstruction,
  getAssociatedTokenAddressSync,
  getAccount,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { hasAta, createAtaInstruction } from './utils';

export class SolanaRPC {
  public readonly network: 'mainnet' | 'devnet';
  public readonly url: string | undefined;
  public readonly connection: Connection;

  constructor({
    url,
    network,
  }: {
    url?: string;
    network?: 'mainnet' | 'devnet';
  }) {
    this.url = url
      ? url
      : network
      ? clusterApiUrl(network === 'mainnet' ? 'mainnet-beta' : 'devnet')
      : undefined;

    if (!this.url) {
      throw new Error('rpcUrl or cluster is required');
    }

    this.connection = new Connection(this.url, 'confirmed');
  }

  init({ url, network }: { url?: string; network?: 'mainnet' | 'devnet' }) {
    return new SolanaRPC({ url, network });
  }

  generate() {
    const wallet = Keypair.generate();

    return {
      publicKey: wallet.publicKey.toBase58(),
      privateKey: Buffer.from(wallet.secretKey).toString('hex'),
    };
  }

  publicKey(privateKey: string) {
    const secretKey = Uint8Array.from(Buffer.from(privateKey, 'hex'));
    return Keypair.fromSecretKey(secretKey).publicKey.toBase58();
  }

  async getSignaturesForAddress({
    address,
    ...configuration
  }: {
    address: string;
    limit?: number;
    commitment?: string;
    minContextSlot?: number;
    before?: string;
    until?: string;
  }) {
    if (!this.url) {
      throw new Error('rpcUrl or cluster is required');
    }

    const res = await fetch(this.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getSignaturesForAddress',
        params: [
          address,
          {
            limit: 3,
            // https://solana.com/docs/rpc#configuring-state-commitment
            commitment: 'finalized',
            ...configuration,
          },
        ],
      }),
    });

    const data = (await res.json()) as { result: ConfirmedSignatureInfo[] };
    return data.result.map((s) => s.signature);
  }

  async getTransaction({ signature }: { signature: string }) {
    const res = await fetch(this.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getTransaction',
        params: [signature, { encoding: 'jsonParsed' }],
      }),
    });

    const data = (await res.json()) as { result: ParsedTransactionWithMeta };

    return data.result;
  }

  async getBalance({
    publicKey,
    tokenAddress,
  }: {
    publicKey: string;
    tokenAddress?: string | null;
  }) {
    if (tokenAddress) {
      const ownerATA = getAssociatedTokenAddressSync(
        new PublicKey(tokenAddress),
        new PublicKey(publicKey),
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const account = await getAccount(this.connection, ownerATA);

      return account.amount;
    } else {
      return await this.connection.getBalance(new PublicKey(publicKey));
    }
  }

  async sendTransaction({
    privateKey,
    destination,
    tokenAddress,
    amount,
  }: {
    privateKey: string;
    destination: string;
    tokenAddress?: string | null;
    amount: number;
  }) {
    const secretKey = Uint8Array.from(Buffer.from(privateKey, 'hex'));

    const fromKeyPair = Keypair.fromSecretKey(secretKey);
    const feePayer = fromKeyPair.publicKey;

    if (tokenAddress) {
      const mint = new PublicKey(tokenAddress);

      const feePayerATA = getAssociatedTokenAddressSync(
        mint,
        feePayer,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const hasRecipientATA = await hasAta(
        this.connection,
        tokenAddress,
        destination
      );

      const instructions = [];

      if (!hasRecipientATA) {
        instructions.push(
          createAtaInstruction(feePayer, mint, new PublicKey(destination))
        );
      }

      const recipientATA = getAssociatedTokenAddressSync(
        mint,
        new PublicKey(destination),
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      instructions.push(
        createTransferInstruction(
          feePayerATA,
          recipientATA,
          feePayer,
          amount,
          [],
          TOKEN_PROGRAM_ID
        )
      );

      const transaction = new Transaction().add(...instructions);

      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [fromKeyPair],
        { commitment: 'confirmed' }
      );

      return signature;
    } else {
      const instruction = SystemProgram.transfer({
        fromPubkey: feePayer,
        toPubkey: new PublicKey(destination),
        lamports: amount,
      });

      const transaction = new Transaction().add(instruction);

      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [fromKeyPair],
        { commitment: 'confirmed' }
      );

      return signature;
    }
  }

  async getMint({ mint }: { mint: string }) {
    return await getMint(this.connection, new PublicKey(mint));
  }
}
