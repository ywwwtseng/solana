import { test, expect } from 'bun:test';
import { clusterApiUrl } from '@solana/web3.js';
import { endpoint } from '../src';

test('endpoint', () => {
  expect(endpoint('mainnet-beta')).toBe(clusterApiUrl('mainnet-beta'));
  expect(endpoint('devnet')).toBe(clusterApiUrl('devnet'));
  expect(endpoint('https://mainnet.helius-rpc.com/?api-key=123456')).toBe(
    'https://mainnet.helius-rpc.com/?api-key=123456'
  );
});
