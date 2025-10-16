import {
  type ParsedTransactionWithMeta,
  type TokenBalance,
} from '@solana/web3.js';
import { Transfer } from './types';

export function getTransfers(
  parsedTransaction: ParsedTransactionWithMeta
): Transfer[] {
  const transfers: Transfer[] = [];

  const mint = parsedTransaction.meta?.preTokenBalances?.[0]?.mint;

  if (mint) {
    const preMap = new Map<string, TokenBalance>();
    const postMap = new Map<string, TokenBalance>();
    const senders: { mint: string; owner: string; delta: number }[] = [];
    const receivers: { mint: string; owner: string; delta: number }[] = [];

    parsedTransaction.meta?.preTokenBalances?.forEach((b) => {
      if (b.owner) {
        preMap.set(`${b.mint}_${b.owner}`, b);
      }
    });
    parsedTransaction.meta?.postTokenBalances?.forEach((b) => {
      if (b.owner) {
        postMap.set(`${b.mint}_${b.owner}`, b);
      }
    });

    postMap.forEach((postBalance, key) => {
      const preBalance = preMap.get(key);
      const postAmount = Number(postBalance.uiTokenAmount.amount ?? '0');
      const preAmount = Number(preBalance?.uiTokenAmount.amount ?? '0');
      const delta = postAmount - preAmount;

      if (delta > 0) {
        receivers.push({
          mint: postBalance.mint,
          owner: postBalance.owner,
          delta,
        });
      } else if (delta < 0) {
        senders.push({
          mint: postBalance.mint,
          owner: postBalance.owner,
          delta,
        });
      }
    });

    receivers.forEach((receiver) => {
      // 找同 mint 的 sender
      const sender = senders.find((s) => s.mint === receiver.mint);
      if (!sender) return;

      transfers.push({
        mint: receiver.mint,
        source: sender.owner,
        destination: receiver.owner,
        amount: receiver.delta.toString(),
      });
    });
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
            transfers.push({
              source,
              destination,
              amount: lamports.toString(),
            });
          } else {
            found.amount += lamports;
          }
        }
      }
    }
  }

  return transfers;
}
