import { test, expect, describe } from 'bun:test';
import { Keypair } from '@solana/web3.js';
import { KeyPair } from '../src';

describe('KeyPair', () => {
  test('pass string as private key', () => {
    const wallet = Keypair.generate();

    const privateKey = Buffer.from(wallet.secretKey).toString('hex');
    const keyPair = KeyPair.from(privateKey);
    expect(keyPair).toBeDefined();
    expect(keyPair.publicKey.toBase58()).toBe(wallet.publicKey.toBase58());
  });

  test('pass Uint8Array as private key', () => {
    const wallet = Keypair.generate();
    const privateKey = new Uint8Array(wallet.secretKey);
    const keyPair = KeyPair.from(privateKey);
    expect(keyPair).toBeDefined();
    expect(keyPair.publicKey.toBase58()).toBe(wallet.publicKey.toBase58());
  });
});
