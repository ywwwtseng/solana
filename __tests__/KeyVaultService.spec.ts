import { test, expect } from 'bun:test';
import { KeyVaultService } from '../src';

test('KeyVaultService', () => {
  const keyVaultService = new KeyVaultService(
    '0123456789abcdef0123456789abcdef'
  );

  const wallet = keyVaultService.generateWallet();
  const recovered = keyVaultService.loadWallet(wallet.privateKeyEncrypted);

  expect(wallet.publicKey).toBe(recovered.publicKey.toBase58());
});
