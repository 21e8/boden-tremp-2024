"use client";
import { JupiterProvider } from "@jup-ag/react-hook";
import { Keypair, PublicKey } from "@solana/web3.js";
import { useMemo } from "react";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  LedgerWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { BackpackWalletAdapter } from "@solana/wallet-adapter-backpack";
import {
  ConnectionProvider,
  WalletProvider,
  useConnection,
  useWallet,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";

const JupiterWrapper = ({ children }: { children: React.ReactNode }) => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  return (
    <JupiterProvider
      connection={connection}
      userPublicKey={publicKey || Keypair.generate().publicKey}
      platformFeeAndAccounts={{
        referralAccount: new PublicKey(process.env.NEXT_PUBLIC_FEE_ACCOUNT!),
        feeBps: 100,
      }}
    >
      {children}
    </JupiterProvider>
  );
};

const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL!;
export const Providers = ({ children }: { children: React.ReactNode }) => {
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new BackpackWalletAdapter(),
      new SolflareWalletAdapter(),
      new LedgerWalletAdapter(),
    ],
    []
  );

  return (
    <>
      <ConnectionProvider endpoint={rpcUrl}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <JupiterWrapper>{children}</JupiterWrapper>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </>
  );
};
