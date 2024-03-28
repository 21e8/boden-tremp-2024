"use client";
import { useJupiter } from "@jup-ag/react-hook";
import JSBI from "jsbi";
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import Image from "next/image";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";
import {
  clampValue,
  exceedsDecimals,
  getAssociatedTokenAccount,
  isZeroDecimal,
  transformedTvl,
  trimDecimals,
} from "./_util";
import { Cell, Pie, PieChart } from "recharts";
import { BigNumber } from "bignumber.js";
import { Coming_Soon } from "next/font/google";
import localFont from "next/font/local";
import { config } from "./_config";
import { CoinGeckoClient } from 'coingecko-api-v3';
const coingecko = new CoinGeckoClient({
  timeout: 10000,
  autoRetry: true,
});

const comingSoon = Coming_Soon({ subsets: ["latin"], weight: ["400"] });
const adigiana = localFont({ src: "../../public/AdigianaUI.ttf" });
const RADIAN = Math.PI / 180;
const renderMcapLabel = (t: {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
  index: number;
  value: number;
}) => {
  const radius = t.innerRadius + (t.outerRadius - t.innerRadius) * 0.5;
  const x = t.cx + radius * Math.cos(-t.midAngle * RADIAN);
  const y = t.cy + radius * Math.sin(-t.midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > t.cx ? "start" : "end"}
      dominantBaseline="central"
    >
      {transformedTvl(t.value)}
    </text>
  );
};
const renderPriceLabel = (t: {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
  index: number;
  value: number;
}) => {
  const radius = t.innerRadius + (t.outerRadius - t.innerRadius) * 0.5;
  const x = t.cx + radius * Math.cos(-t.midAngle * RADIAN);
  const y = t.cy + radius * Math.sin(-t.midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > t.cx ? "start" : "end"}
      dominantBaseline="central"
    >
      ${t.value.toLocaleString("en-US", { maximumSignificantDigits: 2 })}
    </text>
  );
};
const renderHolderLabel = (t: {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
  index: number;
  value: number;
}) => {
  const radius = t.innerRadius + (t.outerRadius - t.innerRadius) * 0.5;
  const x = t.cx + radius * Math.cos(-t.midAngle * RADIAN);
  const y = t.cy + radius * Math.sin(-t.midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > t.cx ? "start" : "end"}
      dominantBaseline="central"
    >
      {t.value}
    </text>
  );
};

const MINTS: Record<string, PublicKey> = {
  [config.aDescriptor]: new PublicKey(config.aMint),
  [config.bDescriptor]: new PublicKey(config.bMint),
  sol: new PublicKey("So11111111111111111111111111111111111111112"),
  usdc: new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
};
const DECIMALS: Record<string, number> = {
  sol: 9,
  usdc: 6,
  [config.aDescriptor]: config.aDecimals,
  [config.bDescriptor]: config.bDecimals,
};
export default function Home() {
  const wallet = useWallet();
  const [mounted, setMounted] = useState(false);
  const { connection } = useConnection();
  const [aPrice, setAPrice] = useState("0");
  const [bPrice, setBPrice] = useState("0");
  const [aSupply, setASupply] = useState(690325179.6146736);
  const [bSupply, setBSupply] = useState(99999112.73141688);
  const [solBalance, setSolBalance] = useState(0);
  const [usdcBalance, setUsdcBalance] = useState(0);
  const [aBalance, setABalance] = useState(0);
  const [bBalance, setBBalance] = useState(0);
  const [mcapChartData, setMcapChartData] = useState<any[]>([]);
  const [priceChartData, setPriceChartData] = useState<any[]>([]);
  const [holdersChartData, setHoldersChartData] = useState<any[]>([]);
  const [aInputToken, setAInputToken] = useState("sol");
  const [bInputToken, setBInputToken] = useState("sol");
  const [aInputAmount, setAInputAmount] = useState("0");
  const [bInputAmount, setBInputAmount] = useState("0");
  const [voteALoading, setVoteALoading] = useState(false);
  const [voteBLoading, setVoteBLoading] = useState(false);
  const [fetchedAResponseMeta, setFetchedAResponseMeta] = useState<any>();
  const [fetchedBResponseMeta, setFetchedBResponseMeta] = useState<any>();
  const { quoteResponseMeta: bResponseMeta } = useJupiter({
    amount: JSBI.BigInt(1 * 10 ** DECIMALS["usdc"]),
    inputMint: MINTS[config.bDescriptor],
    outputMint: new PublicKey(MINTS["usdc"]),
    slippageBps: 1000,
    debounceTime: 1000,
  });
  const { quoteResponseMeta: aResponseMeta } = useJupiter({
    amount: JSBI.BigInt(1 * 10 ** DECIMALS["usdc"]),
    inputMint: MINTS[config.aDescriptor],
    outputMint: new PublicKey(MINTS["usdc"]),
    slippageBps: 1000,
    debounceTime: 1000,
  });

  const outAmtParsedA = JSBI.BigInt(
    new BigNumber(aInputAmount || "0")
      .multipliedBy(new BigNumber(10).pow(DECIMALS[aInputToken]))
      .toString()
      .split(".")[0]
  );
  const outAmtParsedB = JSBI.BigInt(
    new BigNumber(bInputAmount || "0")
      .multipliedBy(new BigNumber(10).pow(DECIMALS[bInputToken]))
      .toString()
      .split(".")[0]
  );
  const {
    fetchSwapTransaction: fetchSwapTransactionA,
    quoteResponseMeta: aResponseMetaTx,
  } = useJupiter({
    amount: outAmtParsedA,
    inputMint: MINTS[aInputToken],
    outputMint: MINTS[config.aDescriptor],
    slippageBps: 10000,
    debounceTime: 1000,
  });
  const {
    fetchSwapTransaction: fetchSwapTransactionB,
    quoteResponseMeta: bResponseMetaTx,
  } = useJupiter({
    amount: outAmtParsedB,
    inputMint: MINTS[bInputToken],
    outputMint: MINTS[config.bDescriptor],
    slippageBps: 1000,
    debounceTime: 1000,
  });

  useEffect(() => {
    if (aResponseMetaTx) {
      setFetchedAResponseMeta(aResponseMetaTx);
    }
  }, [aResponseMetaTx]);

  useEffect(() => {
    if (bResponseMetaTx) {
      setFetchedBResponseMeta(bResponseMetaTx);
    }
  }, [bResponseMetaTx]);

  useEffect(() => {
    if (!mounted) {
      setMounted(true);
    }
  }, [mounted]);

  useEffect(() => {
    Promise.allSettled([
      connection.getTokenSupply(MINTS[config.aDescriptor]),
      connection.getTokenSupply(MINTS[config.bDescriptor]),
    ]).then((res) => {
      const [aRes, bRes] = res;

      if (aRes.status === "fulfilled") {
        if (aRes.value.value.uiAmount) {
          setASupply(aRes.value.value.uiAmount);
        }
      }
      if (bRes.status === "fulfilled") {
        if (bRes.value.value.uiAmount) {
          setBSupply(bRes.value.value.uiAmount);
        }
      }
    });
  }, [connection]);

  useEffect(() => {
    (async () => {
      const price = await coingecko.simplePrice({ vs_currencies: 'usd', ids: 'jeo-boden,donald-tremp' });
      setAPrice(`${price['jeo-boden'].usd.toFixed(3)}`);
      setBPrice(`${price['donald-tremp'].usd.toFixed(3)}`);
    })()
  }, []);

  useEffect(() => {
    (async () => {
      if (wallet.publicKey) {
        connection.getBalance(wallet.publicKey).then((balance) => {
          setSolBalance(balance / LAMPORTS_PER_SOL);
        });

        const associatedTokenUsdc = await getAssociatedTokenAccount(
          connection,
          new PublicKey(MINTS["usdc"]),
          wallet.publicKey
        );

        if (associatedTokenUsdc) {
          const balance = await connection.getTokenAccountBalance(
            associatedTokenUsdc?.address
          );
          if (balance.value.uiAmount) {
            setUsdcBalance(balance.value.uiAmount);
          }
          console.log(balance);
        }
        const aAssociatedToken = await getAssociatedTokenAccount(
          connection,
          MINTS[config.aDescriptor],
          wallet.publicKey
        );
        if (aAssociatedToken) {
          const balance = await connection.getTokenAccountBalance(
            aAssociatedToken?.address
          );
          if (balance.value.uiAmount) {
            setABalance(balance.value.uiAmount);
          }
          console.log(balance);
        }
        const bAssociatedToken = await getAssociatedTokenAccount(
          connection,
          MINTS[config.bDescriptor],
          wallet.publicKey
        );
        if (bAssociatedToken) {
          const balance = await connection.getTokenAccountBalance(
            bAssociatedToken?.address
          );
          if (balance.value.uiAmount) {
            setBBalance(balance.value.uiAmount);
          }
          console.log(balance);
        }
      }
    })();
  }, [connection, wallet.publicKey]);

  useEffect(() => {
    if (bSupply && bPrice && aSupply && aPrice) {
      setMcapChartData([
        {
          name: config.aDisplayNameShort,
          value: parseFloat(aPrice) * aSupply,
          color: config.aColor,
        },
        {
          name: config.bDisplayNameShort,
          value: parseFloat(bPrice) * bSupply,
          color: config.bColor,
        },
      ]);
      console.log(aPrice, aSupply, bPrice, bSupply);
      setPriceChartData([
        {
          name: config.aDisplayNameShort,
          value: parseFloat(aPrice),
          color: config.aColor,
        },
        {
          name: config.bDisplayNameShort,
          value: parseFloat(bPrice),
          color: config.bColor,
        },
      ]);
    }
  }, [aPrice, aSupply, bPrice, bSupply]);

  const currentMax = useMemo(() => {
    if (aInputToken === "sol") {
      return `${transformedTvl(solBalance)}`;
    }
    if (aInputToken === config.bDescriptor) {
      return `${transformedTvl(bBalance)}`;
    }
    if (aInputToken === "usdc") {
      return `${transformedTvl(usdcBalance)}`;
    }
  }, [aInputToken, solBalance, bBalance, usdcBalance]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_HELIUS_PROXY!}/get-holders`)
      .then((data) => data.json())
      .then((data) => {
        setHoldersChartData([
          {
            name: config.aDisplayNameShort,
            value: data.holders[config.aDescriptor],
            color: config.aColor,
          },
          {
            name: config.bDisplayNameShort,
            value: data.holders[config.bDescriptor],
            color: config.bColor,
          },
        ]);
      });
  }, []);

  useEffect(() => {
    if (!wallet.connected) {
      setSolBalance(0);
      setUsdcBalance(0);
      setABalance(0);
      setBBalance(0);
    }
  }, [wallet.connected]);

  const fetchQuote = ({
    inputMint,
    outputMint,
    amount,
    slippageBps,
  }: {
    inputMint: string;
    outputMint: string;
    amount: string;
    slippageBps: string;
  }) => {
    const params = new URLSearchParams();
    params.append("inputMint", inputMint);
    params.append("outputMint", outputMint);
    params.append("amount", amount);
    params.append("slippageBps", slippageBps);
    // params.append("platformFeeBps", "100");
    params.append("experimentalDexes", "Jupiter LO");
    return fetch("https://quote-api.jup.ag/v6/quote?" + params.toString()).then(
      (res) => res.json()
    );
  };
  const aCommitTransaction = useCallback(async () => {
    try {
      setVoteALoading(true);
      fetchQuote({
        inputMint: MINTS[aInputToken].toString(),
        outputMint: MINTS[config.aDescriptor].toString(),
        amount: outAmtParsedA.toString(),
        slippageBps: "10000",
      }).then(async (updatedMeta) => {
        try {
          if (updatedMeta.error) {
            alert("There was an error fetching the quote");
            setVoteALoading(false);
            return;
          }
          if (updatedMeta && wallet.publicKey && fetchedAResponseMeta) {
            updatedMeta.inAmount = JSBI.BigInt(updatedMeta.inAmount);
            updatedMeta.outAmount = JSBI.BigInt(updatedMeta.outAmount);
            updatedMeta.inputMint = new PublicKey(updatedMeta.inputMint);
            updatedMeta.outputMint = new PublicKey(updatedMeta.outputMint);
            updatedMeta.otherAmountThreshold = JSBI.BigInt(
              updatedMeta.otherAmountThreshold
            );
            fetchedAResponseMeta.quoteResponse = updatedMeta;
            // const [feeAccount] = await PublicKey.findProgramAddressSync(
            //   [
            //     Buffer.from("referral_ata"),
            //     new PublicKey(process.env.NEXT_PUBLIC_FEE_ACCOUNT!).toBuffer(), // your referral account public key
            //     new PublicKey(updatedMeta.inputMint).toBuffer(), // the token mint, output mint for ExactIn, input mint for ExactOut.
            //   ],
            //   new PublicKey("REFER4ZgmyYx9c6He5XfaTMiGfdLwRnkV4RPp9t9iF3") // the Referral Program
            // );
            // console.log(updatedMeta)
            // const { swapTransaction } = await (
            //   await fetch("https://quote-api.jup.ag/v6/swap", {
            //     method: "POST",
            //     headers: {
            //       "Content-Type": "application/json",
            //     },
            //     body: JSON.stringify({
            //       // quoteResponse from /quote api
            //       quoteResponse: updatedMeta,
            //       // user public key to be used for the swap
            //       userPublicKey: wallet.publicKey.toString(),
            //       // auto wrap and unwrap SOL. default is true
            //       wrapAndUnwrapSol: true,
            //       feeAccount,
            //       prioritizationFeeLamports: 0.001 * LAMPORTS_PER_SOL
            //     }),
            //   })
            // ).json();
            // const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
            // const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
            // wallet.sendTransaction(transaction, connection);
            const { swapTransaction } = (await fetchSwapTransactionA({
              quoteResponseMeta: fetchedAResponseMeta,
              userPublicKey: wallet.publicKey,
              prioritizationFeeLamports: 0.001 * LAMPORTS_PER_SOL,
            })) as {
              swapTransaction: VersionedTransaction | Transaction;
              blockhash: string;
              lastValidBlockHeight: number;
            };
            if (!wallet.signTransaction) {
              return;
            }
            await wallet.signTransaction(swapTransaction);
            setVoteALoading(false);
          }
        } catch (e) {
          console.log(e);
          setVoteALoading(false);
        }
      });
    } catch (e) {
      console.log(e);
      setVoteALoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aResponseMetaTx, aInputToken, outAmtParsedA, wallet]);

  const bCommitTransaction = useCallback(async () => {
    try {
      setVoteBLoading(true);
      fetchQuote({
        inputMint: MINTS[bInputToken].toString(),
        outputMint: MINTS[config.bDescriptor].toString(),
        amount: outAmtParsedB.toString(),
        slippageBps: "10000",
      }).then(async (updatedMeta) => {
        try {
          if (updatedMeta.error) {
            alert("There was an error fetching the quote");
            setVoteBLoading(false);
            return;
          }
          if (updatedMeta && wallet.publicKey && bResponseMetaTx) {
            updatedMeta.inAmount = JSBI.BigInt(updatedMeta.inAmount);
            updatedMeta.outAmount = JSBI.BigInt(updatedMeta.outAmount);
            updatedMeta.inputMint = new PublicKey(updatedMeta.inputMint);
            updatedMeta.outputMint = new PublicKey(updatedMeta.outputMint);
            updatedMeta.otherAmountThreshold = JSBI.BigInt(
              updatedMeta.otherAmountThreshold
            );
            bResponseMetaTx.quoteResponse = updatedMeta;
            const { swapTransaction } = (await fetchSwapTransactionB({
              quoteResponseMeta: bResponseMetaTx,
              userPublicKey: wallet.publicKey,
              prioritizationFeeLamports: 0.001 * LAMPORTS_PER_SOL,
            })) as {
              swapTransaction: VersionedTransaction | Transaction;
              blockhash: string;
              lastValidBlockHeight: number;
            };
            if (!wallet.signTransaction) {
              return;
            }
            await wallet.signTransaction(swapTransaction);
            setVoteBLoading(false);
          }
        } catch (e) {
          console.log(e);
          setVoteBLoading(false);
        }
      });
    } catch (e) {
      console.log(e);
      setVoteBLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bInputToken, outAmtParsedB, bResponseMetaTx, wallet]);

  const bButtonDisabled = useMemo(() => {
    return (
      (!fetchedBResponseMeta && bInputAmount !== "0" && bInputAmount !== "") ||
      bInputAmount === "0" ||
      bInputAmount === "" ||
      voteBLoading
    );
  }, [fetchedBResponseMeta, bInputAmount, voteBLoading]);

  const handleDispatchBAmount = useCallback(
    (value: string) => {
      if (value === "") {
        setBInputAmount("");
        return;
      }
      if (isZeroDecimal(value)) {
        if (exceedsDecimals(value, DECIMALS[bInputToken])) {
          setBInputAmount(trimDecimals(value, DECIMALS[bInputToken]));
          return;
        }
        setBInputAmount(value);
        return;
      }
      const max =
        bInputToken === "sol"
          ? solBalance
          : bInputToken === config.aDescriptor
          ? aBalance
          : usdcBalance;
      const jsbiMax = new BigNumber(max * 10 ** DECIMALS[bInputToken]).toFixed(
        0
      );
      const clamped = clampValue({
        value,
        max: JSBI.BigInt(jsbiMax),
        decimals: DECIMALS[bInputToken],
      });
      setBInputAmount(clamped);
    },
    [aBalance, bInputToken, solBalance, usdcBalance]
  );

  const handleDispatchAAmount = useCallback(
    (value: string) => {
      if (value === "") {
        setAInputAmount("");
        return;
      }
      if (isZeroDecimal(value)) {
        if (exceedsDecimals(value, DECIMALS[aInputToken])) {
          setAInputAmount(trimDecimals(value, DECIMALS[aInputToken]));
          return;
        }
        setAInputAmount(value);
        return;
      }
      const max =
        aInputToken === "sol"
          ? solBalance
          : aInputToken === config.bDescriptor
          ? bBalance
          : usdcBalance;
      const jsbiMax = new BigNumber(max * 10 ** DECIMALS[aInputToken]).toFixed(
        0
      );
      const clamped = clampValue({
        value,
        max: JSBI.BigInt(jsbiMax),
        decimals: DECIMALS[aInputToken],
      });
      setAInputAmount(clamped);
    },
    [aInputToken, solBalance, bBalance, usdcBalance]
  );

  return (
    <>
      <div className="w-full max-w-7xl mx-auto p-8 flex flex-col">
        <div className="text-center items-center mb-8 bg-black p-4 border-b-4 border-red-600 left-0 right-0 top-0 w-full fixed z-10">
          <div className="w-full max-w-7xl mx-auto flex flex-col md:grid grid-cols-3 ">
            <div></div>
            <h1 className="text-3xl">
              <span className={comingSoon.className}>
                {config.aDisplayNameShort}
              </span>{" "}
              vs{" "}
              <span className={adigiana.className}>
                {config.bDisplayNameShort}
              </span>
            </h1>
            <div className="flex flex-row">
              <div className="mx-auto md:ml-auto md:mr-0 md:my-0">
                {" "}
                {mounted && (
                  <div className="hidden md:block">
                    <WalletMultiButton />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {mounted && (
          <div className=" md:hidden mt-16 w-full flex items-center justify-center">
            <WalletMultiButton />
          </div>
        )}
        <div
          className="flex flex-col md:grid grid-cols-3 text-center gap-8 mb-8 ring ring-4 ring-[rgb(1,73,171)] p-4 rounded-2xl mt-8 md:mt-24"
          style={{ gridTemplateColumns: "1fr 50px 1fr" }}
        >
          <div className={`flex flex-col gap-4 ${comingSoon.className}`}>
            <h2 className="text-2xl">{config.aDisplayNameLong}</h2>
            <div className="flex flex-col items-center justify-center">
              <div className="rounded-full overflow-hidden bg-blue-600 h-[200px] w-[200px]  ring-4 ring-white">
                <Image
                  className="-scale-y-100 -rotate-180"
                  alt={config.aDisplayNameShort}
                  src={`/${config.aDescriptor}.png`}
                  width={200}
                  height={200}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 max-w-[300px] mx-auto">
              <div className="text-left">Price</div>
              <div className="text-right">
                ${aPrice} / {config.aTicker}{" "}
              </div>
              <div className="text-left">MCAP</div>
              <div className="text-right">
                ${transformedTvl(parseInt(`${aSupply * parseFloat(aPrice)}`))}
              </div>
              <div className="text-left">Balance</div>
              <div className="text-right">
                {aBalance.toLocaleString("en-US", {
                  maximumFractionDigits: 2,
                })}{" "}
                {config.aTicker}
              </div>
            </div>
            <div className="flex flex-col justify-center items-center gap-4">
              <div className="flex flex-col items-center justify-center">
                <div className="flex flex-row gap-4 w-full mb-2">
                  <button
                    onClick={() => {
                      setFetchedAResponseMeta(undefined);
                      if (aInputToken === "sol") {
                        return setAInputAmount((solBalance / 2).toString());
                      }
                      if (aInputToken === config.bDescriptor) {
                        return setAInputAmount((bBalance / 2).toString());
                      }
                      if (aInputToken === "usdc") {
                        return setAInputAmount((usdcBalance / 2).toString());
                      }
                    }}
                    className="ml-auto border border-zinc-400 px-2 rounded-lg text-xs"
                  >
                    half
                  </button>
                  <button
                    onClick={() => {
                      setFetchedAResponseMeta(undefined);
                      if (aInputToken === "sol") {
                        return setAInputAmount(solBalance.toString());
                      }
                      if (aInputToken === config.bDescriptor) {
                        return setAInputAmount(bBalance.toString());
                      }
                      if (aInputToken === "usdc") {
                        return setAInputAmount(usdcBalance.toString());
                      }
                    }}
                    className="border border-zinc-400 px-2 rounded-lg text-xs"
                  >
                    max
                  </button>
                </div>
                <div className="flex flex-row bg-white text-black px-3 py-2 rounded justify-center items-center">
                  <select
                    value={aInputToken}
                    onChange={(e) => setAInputToken(e.target.value)}
                  >
                    <option value={"sol"}>SOL</option>
                    <option value={"usdc"}>USDC</option>
                    <option value={config.bDescriptor}>{config.bTicker}</option>
                  </select>
                  <input
                    className="w-[150px] text-right"
                    placeholder={currentMax}
                    value={aInputAmount}
                    onChange={(e) => {
                      handleDispatchAAmount(e.target.value);
                      setFetchedAResponseMeta(undefined);
                    }}
                    type="number"
                  />{" "}
                </div>
                {
                  <div className="w-full flex flex-row justify-between my-2 text-zinc-400 text-xs">
                    <span>available:</span>
                    <span>
                      {aInputToken === "sol" &&
                        `${transformedTvl(solBalance)} SOL`}
                      {aInputToken === config.bDescriptor &&
                        `${transformedTvl(bBalance)} ${config.bTicker}`}
                      {aInputToken === "usdc" &&
                        `${transformedTvl(usdcBalance)} USDC`}
                    </span>
                  </div>
                }
              </div>
              <button
                onClick={() => aCommitTransaction()}
                disabled={
                  voteALoading ||
                  (!fetchedAResponseMeta && aInputAmount !== "0") ||
                  aInputAmount === "0"
                }
                className={
                  "flex px-3 py-2 bg-blue-600 border border-blue-800 text-white rounded " +
                  (voteALoading ||
                  (!fetchedAResponseMeta && aInputAmount !== "0") ||
                  aInputAmount === "0"
                    ? "opacity-50"
                    : "")
                }
              >
                {!fetchedAResponseMeta && aInputAmount !== "0"
                  ? "Fetching quote..."
                  : voteALoading
                  ? "Voting..."
                  : `Vote ${config.aDisplayNameShort}`}
              </button>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center text-3xl">
            vs.
          </div>
          <div className={`flex flex-col gap-4 ${adigiana.className}`}>
            <h2 className="text-2xl">{config.bDisplayNameLong}</h2>
            <div className="flex flex-col items-center justify-center">
              <div className="rounded-full overflow-hidden bg-red-600 h-[200px] w-[200px] ring-4 ring-white">
                <Image
                  alt={config.bDisplayNameShort}
                  src={`/${config.bDescriptor}.png`}
                  width={200}
                  height={200}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 max-w-[300px] mx-auto">
              <div className="text-left">Price</div>
              <div className="text-right">
                ${bPrice} / {config.bTicker}{" "}
              </div>
              <div className="text-left">MCAP</div>
              <div className="text-right">
                ${transformedTvl(parseInt(`${bSupply * parseFloat(bPrice)}`))}
              </div>
              <div className="text-left">Balance</div>
              <div className="text-right">
                {bBalance.toLocaleString("en-US", {
                  maximumFractionDigits: 2,
                })}{" "}
                {config.bTicker}
              </div>
            </div>
            <div className="flex flex-col justify-center items-center gap-4">
              <div className="flex flex-col items-center justify-center">
                <div className="flex flex-row gap-2 w-full mb-2">
                  <button
                    onClick={() => {
                      setFetchedBResponseMeta(undefined);
                      if (bInputToken === "sol") {
                        return setBInputAmount((solBalance / 2).toString());
                      }
                      if (bInputToken === config.aDescriptor) {
                        return setBInputAmount((aBalance / 2).toString());
                      }
                      if (bInputToken === "usdc") {
                        return setBInputAmount((usdcBalance / 2).toString());
                      }
                    }}
                    className="ml-auto border border-zinc-400 px-2 rounded-lg text-xs"
                  >
                    half
                  </button>
                  <button
                    onClick={() => {
                      setFetchedBResponseMeta(undefined);

                      if (bInputToken === "sol") {
                        return setBInputAmount(solBalance.toString());
                      }
                      if (bInputToken === config.aDescriptor) {
                        return setBInputAmount(aBalance.toString());
                      }
                      if (bInputToken === "usdc") {
                        return setBInputAmount(usdcBalance.toString());
                      }
                    }}
                    className="border border-zinc-400 px-2 rounded-lg text-xs"
                  >
                    max
                  </button>
                </div>
                <div className="flex flex-row bg-white text-black px-3 py-2 rounded justify-center items-center">
                  <select
                    value={bInputToken}
                    onChange={(e) => setBInputToken(e.target.value)}
                  >
                    <option value={"sol"}>SOL</option>
                    <option value={"usdc"}>USDC</option>
                    <option value={config.aDescriptor}>{config.aTicker}</option>
                  </select>
                  <input
                    className="w-[150px] text-right"
                    placeholder={currentMax}
                    value={bInputAmount}
                    onChange={(e) => {
                      handleDispatchBAmount(e.target.value);
                      setFetchedBResponseMeta(undefined);
                    }}
                    type="number"
                  />{" "}
                </div>
                {
                  <div className="w-full flex flex-row justify-between my-2 text-zinc-400 text-xs">
                    <span>available:</span>
                    <span>
                      {bInputToken === "sol" &&
                        `${transformedTvl(solBalance)} SOL`}
                      {bInputToken === config.aDescriptor &&
                        `${transformedTvl(aBalance)} ${config.aTicker}`}
                      {bInputToken === "usdc" &&
                        `${transformedTvl(usdcBalance)} USDC`}
                    </span>
                  </div>
                }
              </div>
              <button
                onClick={() => bCommitTransaction()}
                disabled={bButtonDisabled}
                className={
                  "flex px-3 py-2 bg-red-600 border border-red-800 text-white rounded " +
                  (bButtonDisabled ? "opacity-50" : "")
                }
              >
                {!fetchedBResponseMeta &&
                bInputAmount !== "0" &&
                bInputAmount !== ""
                  ? "Fetching quote..."
                  : voteBLoading
                  ? "Voting..."
                  : `Vote ${config.bDisplayNameShort}`}
              </button>
            </div>
          </div>
        </div>

        <h2 className="w-full text-center text-3xl mb-8">Polls</h2>
        <div className="flex flex-col gap-8">
          <div>
            <h3 className="w-full text-center text-2xl">Market Cap</h3>
            <div className="flex items-center justify-center">
              {mcapChartData.length > 0 ? (
                <PieChart margin={{ bottom: -180 }} width={400} height={200}>
                  <Pie
                    dataKey="value"
                    startAngle={180}
                    endAngle={0}
                    labelLine={false}
                    data={mcapChartData}
                    cx="50%"
                    cy="50%"
                    height={200}
                    outerRadius={180}
                    label={renderMcapLabel}
                    isAnimationActive={false}
                  >
                    {mcapChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              ) : (
                <>Loading...</>
              )}
            </div>
          </div>
          <div>
            <h3 className="w-full text-center text-2xl">Price</h3>
            <div className="flex items-center justify-center">
              {priceChartData.length > 0 ? (
                <PieChart margin={{ bottom: -180 }} width={400} height={200}>
                  <Pie
                    dataKey="value"
                    startAngle={180}
                    endAngle={0}
                    labelLine={false}
                    data={priceChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={180}
                    label={renderPriceLabel}
                    isAnimationActive={false}
                  >
                    {priceChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              ) : (
                <>Loading...</>
              )}
            </div>
          </div>
          <div>
            <h3 className="w-full text-center text-2xl">Holders</h3>
            <div className="flex items-center justify-center">
              {holdersChartData.length > 0 ? (
                <PieChart margin={{ bottom: -180 }} width={400} height={200}>
                  <Pie
                    dataKey="value"
                    startAngle={180}
                    endAngle={0}
                    labelLine={false}
                    data={holdersChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={180}
                    label={renderHolderLabel}
                    isAnimationActive={false}
                  >
                    {priceChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              ) : (
                <>Loading...</>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-center items-center text-center mt-8">
          <span className="mb-8">
            Made With ❤️ by{" "}
            <a
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-blue-400"
              href={config.twitter}
            >
              {config.author}
            </a>
          </span>
          <a
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-blue-400"
            href={config.githubRepo}
          >
            <i>
              <svg
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width={48}
                height={48}
              >
                {" "}
                <path d="M10.9,2.1c-4.6,0.5-8.3,4.2-8.8,8.7c-0.5,4.7,2.2,8.9,6.3,10.5C8.7,21.4,9,21.2,9,20.8v-1.6c0,0-0.4,0.1-0.9,0.1 c-1.4,0-2-1.2-2.1-1.9c-0.1-0.4-0.3-0.7-0.6-1C5.1,16.3,5,16.3,5,16.2C5,16,5.3,16,5.4,16c0.6,0,1.1,0.7,1.3,1c0.5,0.8,1.1,1,1.4,1 c0.4,0,0.7-0.1,0.9-0.2c0.1-0.7,0.4-1.4,1-1.8c-2.3-0.5-4-1.8-4-4c0-1.1,0.5-2.2,1.2-3C7.1,8.8,7,8.3,7,7.6C7,7.2,7,6.6,7.3,6 c0,0,1.4,0,2.8,1.3C10.6,7.1,11.3,7,12,7s1.4,0.1,2,0.3C15.3,6,16.8,6,16.8,6C17,6.6,17,7.2,17,7.6c0,0.8-0.1,1.2-0.2,1.4 c0.7,0.8,1.2,1.8,1.2,3c0,2.2-1.7,3.5-4,4c0.6,0.5,1,1.4,1,2.3v2.6c0,0.3,0.3,0.6,0.7,0.5c3.7-1.5,6.3-5.1,6.3-9.3 C22,6.1,16.9,1.4,10.9,2.1z" />
              </svg>
            </i>
          </a>
        </div>
      </div>
    </>
  );
}
