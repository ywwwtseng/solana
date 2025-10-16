import { test, expect } from 'bun:test';
import { type ParsedTransactionWithMeta } from '@solana/web3.js';
import { getTransfers } from '../src';

export const parsedTransaction = {
  blockTime: 1759305801,
  meta: {
    computeUnitsConsumed: 4644,
    costUnits: 6306,
    err: null,
    fee: 5000,
    innerInstructions: [],
    loadedAddresses: { readonly: [], writable: [] },
    logMessages: [
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [1]',
      'Program log: Instruction: Transfer',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4644 of 200000 compute units',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
    ],
    postBalances: [99791446, 2039280, 2039280, 5064907155],
    postTokenBalances: [
      {
        accountIndex: 1,
        mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        owner: 'Cn9yzV2kdCQRYNUYZ4KXeD5Z7DmevUkqixjv8eaYYXfk',
        programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        uiTokenAmount: {
          amount: '8100000',
          decimals: 6,
          uiAmount: 8.1,
          uiAmountString: '8.1',
        },
      },
      {
        accountIndex: 2,
        mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        owner: '5g1QJWjSKuP2Pd2hbRffiSKPt7qgNvHgSN3m7nzRNbBM',
        programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        uiTokenAmount: {
          amount: '400000',
          decimals: 6,
          uiAmount: 0.4,
          uiAmountString: '0.4',
        },
      },
    ],
    preBalances: [99796446, 2039280, 2039280, 5064907155],
    preTokenBalances: [
      {
        accountIndex: 1,
        mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        owner: 'Cn9yzV2kdCQRYNUYZ4KXeD5Z7DmevUkqixjv8eaYYXfk',
        programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        uiTokenAmount: {
          amount: '8300000',
          decimals: 6,
          uiAmount: 8.3,
          uiAmountString: '8.3',
        },
      },
      {
        accountIndex: 2,
        mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        owner: '5g1QJWjSKuP2Pd2hbRffiSKPt7qgNvHgSN3m7nzRNbBM',
        programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        uiTokenAmount: {
          amount: '200000',
          decimals: 6,
          uiAmount: 0.2,
          uiAmountString: '0.2',
        },
      },
    ],
    rewards: [],
    status: { Ok: null },
  },
  slot: 370438249,
  transaction: {
    message: {
      accountKeys: [
        'Cn9yzV2kdCQRYNUYZ4KXeD5Z7DmevUkqixjv8eaYYXfk',
        '9tegQvZY3BP9P4AFi1MNoB9NNrkJ1DhNUK5ujsHmpjZd',
        'GvYGxbP8qZajdCVuXxSKopSFtDuV1xq3JFCRs3GAe5j9',
        'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
      ],
      header: {
        numReadonlySignedAccounts: 0,
        numReadonlyUnsignedAccounts: 1,
        numRequiredSignatures: 1,
      },
      instructions: [
        {
          accounts: [1, 2, 0],
          data: '3QAwFKa3MJAs',
          programIdIndex: 3,
          stackHeight: 1,
        },
      ],
      recentBlockhash: 'B81AHbDJifW6bRpEyktt1q3D6DMsqjZJwRJcgEPKXFCe',
    },
    signatures: [
      '2Xw7wah1migKkQ5VS6fizvStFd3E8sedtUfr6tGDXc6AZaAjXQZseZDC5vkKvKYmGDXVfuur7aoDxKXn15vGiRYf',
    ],
  },
  version: 'legacy',
};

test('getTransfers', () => {
  const transfers = getTransfers(
    parsedTransaction as unknown as ParsedTransactionWithMeta
  );
  expect(transfers).toBeDefined();
  expect(transfers.length).toBe(1);
  expect(transfers[0].source).toBe(
    'Cn9yzV2kdCQRYNUYZ4KXeD5Z7DmevUkqixjv8eaYYXfk'
  );
  expect(transfers[0].destination).toBe(
    '5g1QJWjSKuP2Pd2hbRffiSKPt7qgNvHgSN3m7nzRNbBM'
  );
  expect(transfers[0].amount).toBe('200000');
});
