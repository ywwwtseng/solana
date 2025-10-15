import { test, expect, describe } from 'bun:test';
import { KeyVaultService } from '../src/KeyVaultService';

describe('KeyVaultService', () => {
  test('generateWallet and loadWallet', () => {
    const keyVaultService = new KeyVaultService(
      '0123456789abcdef0123456789abcdef'
    );

    const wallet = keyVaultService.generateWallet();
    const recovered = keyVaultService.loadWallet(wallet.privateKeyEncrypted);

    expect(wallet.publicKey).toBe(recovered.publicKey.toBase58());
  });
});
