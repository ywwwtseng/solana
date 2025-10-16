import { clusterApiUrl } from '@solana/web3.js';

export function endpoint(src: string) {
  if (src === 'mainnet-beta' || src === 'devnet') {
    return clusterApiUrl(src);
  } else {
    return src;
  }
}
