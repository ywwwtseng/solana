import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddressSync,
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';

export async function hasAta(
  connection: Connection,
  mintAddress: string | PublicKey,
  ownerAddress: string | PublicKey
) {
  const ata = getAssociatedTokenAddressSync(
    new PublicKey(mintAddress),
    new PublicKey(ownerAddress)
  );

  const accountInfo = await connection.getAccountInfo(ata);
  return accountInfo !== null; // true = 已存在
}

export function createAtaInstruction(
  payer: PublicKey,
  mint: PublicKey,
  owner: PublicKey
) {
  const ata = getAssociatedTokenAddressSync(mint, owner);

  return createAssociatedTokenAccountInstruction(
    payer, // 誰出 SOL 來建 ATA
    ata, // ATA 地址
    owner, // ATA 的持有者 (接收方)
    mint, // Token Mint
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
}

export async function createSolanaTransaction({
  source,
  destination,
  amount,
}: {
  source: string | PublicKey;
  destination: string | PublicKey;
  amount: bigint | string | number;
}) {
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: new PublicKey(source),
      toPubkey: new PublicKey(destination),
      lamports: Number(amount),
    })
  );

  // transaction.feePayer = new PublicKey(feePayer);
  // transaction.recentBlockhash = (
  //   await connection.getLatestBlockhash()
  // ).blockhash;

  return transaction;
}

export async function createTokenTransaction(
  connection: Connection,
  {
    feePayer,
    source,
    destination,
    amount,
    mint,
  }: {
    feePayer: string | PublicKey;
    source: string | PublicKey;
    destination: string | PublicKey;
    amount: bigint | string | number;
    mint: string | PublicKey;
  }
) {
  const fromPayerATA = getAssociatedTokenAddressSync(
    new PublicKey(mint),
    new PublicKey(source),
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const hasRecipientATA = await hasAta(connection, mint, destination);

  const instructions = [];

  if (!hasRecipientATA) {
    instructions.push(
      createAtaInstruction(
        new PublicKey(feePayer),
        new PublicKey(mint),
        new PublicKey(destination)
      )
    );
  }

  const recipientATA = getAssociatedTokenAddressSync(
    new PublicKey(mint),
    new PublicKey(destination),
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  instructions.push(
    createTransferInstruction(
      fromPayerATA,
      recipientATA,
      new PublicKey(feePayer),
      Number(amount),
      [],
      TOKEN_PROGRAM_ID
    )
  );

  const transaction = new Transaction().add(...instructions);

  // transaction.feePayer = new PublicKey(feePayer);
  // transaction.recentBlockhash = (
  //   await connection.getLatestBlockhash()
  // ).blockhash;

  return transaction;
}

export function createTransaction(
  connection: Connection,
  {
    feePayer,
    source,
    destination,
    amount,
    mint,
  }: {
    feePayer: string | PublicKey;
    source: string | PublicKey;
    destination: string | PublicKey;
    amount: bigint | string | number;
    mint?: string | PublicKey | null;
  }
) {
  if (mint) {
    return createTokenTransaction(connection, {
      feePayer,
      source,
      destination,
      amount,
      mint,
    });
  } else {
    return createSolanaTransaction({
      source,
      destination,
      amount,
    });
  }
}
