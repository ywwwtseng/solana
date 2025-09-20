import {
  type ParsedTransactionWithMeta,
  Connection,
  PublicKey,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';

type TransferInfo = {
  source: string;
  destination: string;
  amount: number;
  mint?: string;
};

export function parseTransfers(
  parsedTransaction: ParsedTransactionWithMeta
): TransferInfo[] {
  const transfers: TransferInfo[] = [];

  const mint = parsedTransaction.meta?.preTokenBalances?.[0]?.mint;

  if (mint) {
    let source: string;
    let destination: string;
    let amount: number;

    parsedTransaction.meta?.preTokenBalances?.forEach((preBalance) => {
      const preAmount = preBalance?.uiTokenAmount.amount || '0';
      const postAmount =
        parsedTransaction.meta?.postTokenBalances?.find(
          (postBalance) =>
            postBalance.mint === mint && postBalance.owner === preBalance.owner
        )?.uiTokenAmount.amount || '0';

      const change = Number(postAmount) - Number(preAmount);

      if (change > 0) {
        destination = preBalance.owner;
        amount = change;
      } else if (change < 0) {
        source = preBalance.owner;
      }
    });

    if (source && destination && amount) {
      transfers.push({ source, destination, amount, mint });
    }
  } else {
    for (const ix of parsedTransaction.transaction.message.instructions) {
      // 只處理類型為 'transfer'
      if ('parsed' in ix) {
        const parsed = ix.parsed as {
          type: string;
          info: {
            destination: string;
            lamports: string;
            source: string;
          };
        };
        if (parsed.type === 'transfer') {
          const info = parsed.info;
          const source = info.source;
          const destination = info.destination;
          const lamports = Number(info.lamports);
          const found = transfers.find(
            (r) => r.destination === destination && r.source === source
          );
          if (!found) {
            transfers.push({ source, destination, amount: lamports });
          } else {
            found.amount += lamports;
          }
        }
      }
    }
  }

  return transfers;
}

export async function hasAta(
  connection: Connection,
  mintAddress: string,
  ownerAddress: string
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
