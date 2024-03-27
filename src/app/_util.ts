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
import JSBI from "jsbi";
import BigNumber from "bignumber.js";
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

export const isZeroDecimal = (value: string) => {
  return (
    value.startsWith("0.0") &&
    value
      .split("0.0")[1]
      .split("")
      .every((char) => char === "0")
  );
};

export const exceedsDecimals = (value: string, decimals = 18) => {
  return value.split(".")[1].length > decimals;
};

export const trimDecimals = (value: string, decimals = 18) => {
  return value.split(".")[0] + "." + value.split(".")[1].slice(0, decimals);
};

export const clampValue = ({
  value,
  max,
  min = JSBI.BigInt(0),
  decimals = 18,
}: {
  value: string;
  max: JSBI;
  min?: JSBI;
  decimals?: number;
}) => {
  let amount_wei = new BigNumber(parseFloat(value)).multipliedBy(
    new BigNumber(10).pow(decimals)
  );
  const bnMin = new BigNumber(min.toString());
  const bnMax = new BigNumber(max.toString());
  if (amount_wei.isLessThan(bnMin)) amount_wei = new BigNumber(0);
  if (amount_wei.isGreaterThan(bnMax)) amount_wei = new BigNumber(max.toString());
  return amount_wei.dividedBy(new BigNumber(10).pow(decimals)).toString();
};