import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@mrgnlabs/mrgn-common";
import { Connection, PublicKey, Commitment } from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  getAccount,
  TokenInvalidMintError,
  TokenInvalidOwnerError,
  Account,
} from "@mrgnlabs/mrgn-common";
export async function getAssociatedTokenAccount(
  connection: Connection,
  mint: PublicKey,
  owner: PublicKey,
  allowOwnerOffCurve = false,
  commitment: Commitment = "confirmed",
  programId = TOKEN_PROGRAM_ID,
  associatedTokenProgramId = ASSOCIATED_TOKEN_PROGRAM_ID
): Promise<Account | undefined> {
  const associatedToken = getAssociatedTokenAddressSync(
    mint,
    owner,
    allowOwnerOffCurve,
    programId,
    associatedTokenProgramId
  );

  // This is the optimal logic, considering TX fee, client-side computation, RPC roundtrips and guaranteed idempotent.
  // Sadly we can't do this atomically.
  let account: Account;
  try {
    account = await getAccount(
      connection,
      associatedToken,
      commitment,
      programId
    );
  } catch (error: unknown) {
    return undefined;
  }

  if (!account.mint.equals(mint)) throw new TokenInvalidMintError();
  if (!account.owner.equals(owner)) throw new TokenInvalidOwnerError();

  return account;
}

export const transformedTvl = (_tvl = 0) => {
  if (Math.abs(_tvl) >= 1_000 && Math.abs(_tvl) <= 999_999)
    return `${(_tvl / 1_000).toFixed(2)}k`;
  if (Math.abs(_tvl) > 999_999 && Math.abs(_tvl) <= 999_999_999)
    return `${(_tvl / 1_000_000).toFixed(2)}m`;
  if (Math.abs(_tvl) > 999_999_999)
    return `${(_tvl / 1_000_000_000).toFixed(2)}b`;
  return _tvl.toFixed(2);
};
