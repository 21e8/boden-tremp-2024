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

type TokenAccount = {
  address: string;
  mint: string;
  owner: string;
  amount: number;
  delegated_amount: number;
  frozen: boolean;
};
const MINTS: Record<string, PublicKey> = {
  tremp: new PublicKey("FU1q8vJpZNUrmqsciSjp8bAKKidGsLmouB8CBdf8TKQv"),
  boden: new PublicKey("3psH1Mj1f7yUfaD5gh6Zj7epE8hhrMkMETgv5TshQA4o"),
  sol: new PublicKey("So11111111111111111111111111111111111111112"),
  usdc: new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
};
const DECIMALS: Record<string, number> = {
  sol: 9,
  usdc: 6,
  boden: 6,
  tremp: 6,
};
export default function Home() {
  const wallet = useWallet();
  const [mounted, setMounted] = useState(false);
  const { connection } = useConnection();
  const [bodenPrice, setBodenPrice] = useState("0");
  const [trempPrice, setTrempPrice] = useState("0");
  const [bodenSupply, setBodenSupply] = useState(690325179.6146736);
  const [trempSupply, setTrempSupply] = useState(99999112.73141688);
  const [solBalance, setSolBalance] = useState(0);
  const [trempBalance, setTrempBalance] = useState(0);
  const [usdcBalance, setUsdcBalance] = useState(0);
  const [bodenBalance, setBodenBalance] = useState(0);
  const [mcapChartData, setMcapChartData] = useState<any[]>([]);
  const [priceChartData, setPriceChartData] = useState<any[]>([]);
  const [holdersChartData, setHoldersChartData] = useState<any[]>([]);
  const [inputTokenBoden, setInputTokenBoden] = useState("sol");
  const [inputTokenTremp, setInputTokenTremp] = useState("sol");
  const [inputBodenAmount, setInputBodenAmount] = useState("0");
  const [inputTrempAmount, setInputTrempAmount] = useState("0");
  const [voteBodenLoading, setVoteBodenLoading] = useState(false);
  const [voteTrempLoading, setVoteTrempLoading] = useState(false);
  const [fetchedBodenResponseMeta, setFetchedBodenResponseMeta] =
    useState<any>();
  const [fetchedTrempResponseMeta, setFetchedTrempResponseMeta] =
    useState<any>();
  const { quoteResponseMeta: trempResponseMeta } = useJupiter({
    amount: JSBI.BigInt(1 * 10 ** 6),
    inputMint: MINTS.tremp,
    outputMint: new PublicKey(MINTS["usdc"]),
    slippageBps: 1000,
    debounceTime: 1000,
  });
  const { quoteResponseMeta: bodenResponseMeta } = useJupiter({
    amount: JSBI.BigInt(1 * 10 ** 6),
    inputMint: MINTS.boden,
    outputMint: new PublicKey(MINTS["usdc"]),
    slippageBps: 1000,
    debounceTime: 1000,
  });
  const outAmtParsedBoden = JSBI.BigInt(
    new BigNumber(inputBodenAmount || "0")
      .multipliedBy(new BigNumber(10).pow(DECIMALS[inputTokenBoden]))
      .toString()
      .split(".")[0]
  );
  const outAmtParsedTremp = JSBI.BigInt(
    new BigNumber(inputTrempAmount || "0")
      .multipliedBy(new BigNumber(10).pow(DECIMALS[inputTokenTremp]))
      .toString()
      .split(".")[0]
  );
  const {
    fetchSwapTransaction: fetchSwapTransactionTremp,
    quoteResponseMeta: trempResponseMetaTx,
  } = useJupiter({
    amount: outAmtParsedTremp,
    inputMint: MINTS[inputTokenTremp],
    outputMint: MINTS["tremp"],
    slippageBps: 1000,
    debounceTime: 1000,
  });
  const {
    fetchSwapTransaction: fetchSwapTransactionBoden,
    quoteResponseMeta: bodenResponseMetaTx,
  } = useJupiter({
    amount: outAmtParsedBoden,
    inputMint: MINTS[inputTokenBoden],
    outputMint: MINTS["boden"],
    slippageBps: 10000,
    debounceTime: 1000,
  });

  useEffect(() => {
    if (bodenResponseMetaTx) {
      setFetchedBodenResponseMeta(bodenResponseMetaTx);
    }
  }, [bodenResponseMetaTx]);

  useEffect(() => {
    if (trempResponseMetaTx) {
      setFetchedTrempResponseMeta(trempResponseMetaTx);
    }
  }, [trempResponseMetaTx]);

  useEffect(() => {
    if (!mounted) {
      setMounted(true);
    }
  }, [mounted]);

  useEffect(() => {
    Promise.allSettled([
      connection.getTokenSupply(MINTS.tremp),
      connection.getTokenSupply(MINTS.boden),
    ]).then((res) => {
      const [tremp, boden] = res;
      if (tremp.status === "fulfilled") {
        if (tremp.value.value.uiAmount) {
          setTrempSupply(tremp.value.value.uiAmount);
        }
      }
      if (boden.status === "fulfilled") {
        if (boden.value.value.uiAmount) {
          setBodenSupply(boden.value.value.uiAmount);
        }
      }
    });
  }, [connection]);

  useEffect(() => {
    if (trempResponseMeta) {
      const bnOut = new BigNumber(
        trempResponseMeta.quoteResponse.otherAmountThreshold.toString()
      );
      const res = bnOut.dividedBy(10 ** 3).toString();
      setTrempPrice(res);
    }
  }, [connection, trempResponseMeta]);

  useEffect(() => {
    if (bodenResponseMeta) {
      const bnOut = new BigNumber(
        bodenResponseMeta.quoteResponse.otherAmountThreshold.toString()
      );
      const res = bnOut.dividedBy(10 ** 3).toString();
      setBodenPrice(res);
    }
  }, [bodenResponseMeta, connection]);

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
        const associatedTokenBoden = await getAssociatedTokenAccount(
          connection,
          MINTS.boden,
          wallet.publicKey
        );
        if (associatedTokenBoden) {
          const balance = await connection.getTokenAccountBalance(
            associatedTokenBoden?.address
          );
          if (balance.value.uiAmount) {
            setBodenBalance(balance.value.uiAmount);
          }
          console.log(balance);
        }
        const associatedTokenTremp = await getAssociatedTokenAccount(
          connection,
          MINTS.tremp,
          wallet.publicKey
        );
        if (associatedTokenTremp) {
          const balance = await connection.getTokenAccountBalance(
            associatedTokenTremp?.address
          );
          if (balance.value.uiAmount) {
            setTrempBalance(balance.value.uiAmount);
          }
          console.log(balance);
        }
      }
    })();
  }, [connection, wallet.publicKey]);

  useEffect(() => {
    if (trempSupply && trempPrice && bodenSupply && bodenPrice) {
      setMcapChartData([
        {
          name: "Boden",
          value: parseFloat(bodenPrice) * bodenSupply,
          color: "#2563eb",
        },
        {
          name: "Tremp",
          value: parseFloat(trempPrice) * trempSupply,
          color: "#DC2626",
        },
      ]);
      console.log(bodenPrice, bodenSupply, trempPrice, trempSupply);
      setPriceChartData([
        {
          name: "Boden",
          value: parseFloat(bodenPrice),
          color: "#2563eb",
        },
        {
          name: "Tremp",
          value: parseFloat(trempPrice),
          color: "#DC2626",
        },
      ]);
    }
  }, [bodenPrice, bodenSupply, trempPrice, trempSupply]);

  const currentMax = useMemo(() => {
    if (inputTokenBoden === "sol") {
      return `${transformedTvl(solBalance)}`;
    }
    if (inputTokenBoden === "tremp") {
      return `${transformedTvl(trempBalance)}`;
    }
    if (inputTokenBoden === "usdc") {
      return `${transformedTvl(usdcBalance)}`;
    }
  }, [inputTokenBoden, solBalance, trempBalance, usdcBalance]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_HELIUS_PROXY!}/get-holders`).then(
      (data) => {
        data.json().then((res) => {
          console.log(res);
          setHoldersChartData([
            {
              name: "Boden",
              value: res.holders.boden,
              color: "#2563eb",
            },
            {
              name: "Tremp",
              value: res.holders.tremp,
              color: "#DC2626",
            },
          ]);
        });
      }
    );
  }, []);

  useEffect(() => {
    if (!wallet.connected) {
      setSolBalance(0);
      setUsdcBalance(0);
      setBodenBalance(0);
      setTrempBalance(0);
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
  const commitTransactionBoden = useCallback(async () => {
    try {
      setVoteBodenLoading(true);
      fetchQuote({
        inputMint: MINTS[inputTokenBoden].toString(),
        outputMint: MINTS["boden"].toString(),
        amount: outAmtParsedBoden.toString(),
        slippageBps: "10000",
      }).then(async (updatedMeta) => {
        try {
          if (updatedMeta.error) {
            alert("There was an error fetching the quote");
            setVoteBodenLoading(false);
            return;
          }
          if (updatedMeta && wallet.publicKey && fetchedBodenResponseMeta) {
            updatedMeta.inAmount = JSBI.BigInt(updatedMeta.inAmount);
            updatedMeta.outAmount = JSBI.BigInt(updatedMeta.outAmount);
            updatedMeta.inputMint = new PublicKey(updatedMeta.inputMint);
            updatedMeta.outputMint = new PublicKey(updatedMeta.outputMint);
            updatedMeta.otherAmountThreshold = JSBI.BigInt(
              updatedMeta.otherAmountThreshold
            );
            fetchedBodenResponseMeta.quoteResponse = updatedMeta;
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
            const { swapTransaction } = (await fetchSwapTransactionBoden({
              quoteResponseMeta: fetchedBodenResponseMeta,
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
            setVoteBodenLoading(false);
          }
        } catch (e) {
          console.log(e);
          setVoteBodenLoading(false);
        }
      });
    } catch (e) {
      console.log(e);
      setVoteBodenLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bodenResponseMetaTx, inputTokenBoden, outAmtParsedBoden, wallet]);

  const commitTransactionTremp = useCallback(async () => {
    try {
      setVoteTrempLoading(true);
      fetchQuote({
        inputMint: MINTS[inputTokenTremp].toString(),
        outputMint: MINTS["tremp"].toString(),
        amount: outAmtParsedTremp.toString(),
        slippageBps: "10000",
      }).then(async (updatedMeta) => {
        try {
          if (updatedMeta.error) {
            alert("There was an error fetching the quote");
            setVoteTrempLoading(false);
            return;
          }
          if (updatedMeta && wallet.publicKey && trempResponseMetaTx) {
            updatedMeta.inAmount = JSBI.BigInt(updatedMeta.inAmount);
            updatedMeta.outAmount = JSBI.BigInt(updatedMeta.outAmount);
            updatedMeta.inputMint = new PublicKey(updatedMeta.inputMint);
            updatedMeta.outputMint = new PublicKey(updatedMeta.outputMint);
            updatedMeta.otherAmountThreshold = JSBI.BigInt(
              updatedMeta.otherAmountThreshold
            );
            trempResponseMetaTx.quoteResponse = updatedMeta;
            const { swapTransaction } = (await fetchSwapTransactionTremp({
              quoteResponseMeta: trempResponseMetaTx,
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
            setVoteTrempLoading(false);
          }
        } catch (e) {
          console.log(e);
          setVoteTrempLoading(false);
        }
      });
    } catch (e) {
      console.log(e);
      setVoteTrempLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputTokenTremp, outAmtParsedTremp, trempResponseMetaTx, wallet]);

  const trempButtonDisabled = useMemo(() => {
    return (
      (!fetchedTrempResponseMeta &&
        inputTrempAmount !== "0" &&
        inputTrempAmount !== "") ||
      inputTrempAmount === "0" ||
      inputTrempAmount === "" ||
      voteTrempLoading
    );
  }, [fetchedTrempResponseMeta, inputTrempAmount, voteTrempLoading]);

  const handleDispatchTrempAmount = useCallback(
    (value: string) => {
      if (value === "") {
        setInputTrempAmount("");
        return;
      }
      if (isZeroDecimal(value)) {
        if (exceedsDecimals(value, DECIMALS[inputTokenTremp])) {
          setInputTrempAmount(trimDecimals(value, DECIMALS[inputTokenTremp]));
          return;
        }
        setInputTrempAmount(value);
        return;
      }
      const max =
        inputTokenTremp === "sol"
          ? solBalance
          : inputTokenTremp === "boden"
          ? bodenBalance
          : usdcBalance;
      const jsbiMax = new BigNumber(
        max * 10 ** DECIMALS[inputTokenTremp]
      ).toFixed(0);
      const clamped = clampValue({
        value,
        max: JSBI.BigInt(jsbiMax),
        decimals: DECIMALS[inputTokenTremp],
      });
      setInputTrempAmount(clamped);
    },
    [bodenBalance, inputTokenTremp, solBalance, usdcBalance]
  );

  const handleDispatchBodenAmount = useCallback(
    (value: string) => {
      if (value === "") {
        setInputBodenAmount("");
        return;
      }
      if (isZeroDecimal(value)) {
        if (exceedsDecimals(value, DECIMALS[inputTokenBoden])) {
          setInputBodenAmount(trimDecimals(value, DECIMALS[inputTokenBoden]));
          return;
        }
        setInputBodenAmount(value);
        return;
      }
      const max =
        inputTokenBoden === "sol"
          ? solBalance
          : inputTokenBoden === "tremp"
          ? trempBalance
          : usdcBalance;
      const jsbiMax = new BigNumber(
        max * 10 ** DECIMALS[inputTokenBoden]
      ).toFixed(0);
      const clamped = clampValue({
        value,
        max: JSBI.BigInt(jsbiMax),
        decimals: DECIMALS[inputTokenBoden],
      });
      setInputBodenAmount(clamped);
    },
    [inputTokenBoden, solBalance, trempBalance, usdcBalance]
  );

  return (
    <>
      <div className="w-full max-w-7xl mx-auto p-8 flex flex-col">
        <div className="text-center items-center mb-8 bg-red-600 p-4 rounded-2xl left-0 right-0 top-0 w-full fixed z-10">
          <div className="w-full max-w-7xl mx-auto flex flex-col md:grid grid-cols-3 ">
            <div></div>
            <h1 className="text-3xl">
              <span className={comingSoon.className}>Boden</span> vs{" "}
              <span className={adigiana.className}>Tremp</span>
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
            <h2 className="text-2xl">Jeo Boden</h2>
            <div className="flex flex-col items-center justify-center">
              <div className="rounded-full overflow-hidden bg-blue-600 h-[200px] w-[200px]  ring-4 ring-white">
                <Image
                  className="-scale-y-100 -rotate-180"
                  alt="Boden"
                  src={"/boden.png"}
                  width={200}
                  height={200}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 max-w-[300px] mx-auto">
              <div className="text-left">Price</div>
              <div className="text-right">${bodenPrice} / BODEN </div>
              <div className="text-left">MCAP</div>
              <div className="text-right">
                $
                {transformedTvl(
                  parseInt(`${bodenSupply * parseFloat(bodenPrice)}`)
                )}
              </div>
              <div className="text-left">Balance</div>
              <div className="text-right">
                {bodenBalance.toLocaleString("en-US", {
                  maximumFractionDigits: 2,
                })}{" "}
                BODEN
              </div>
            </div>
            <div className="flex flex-col justify-center items-center gap-4">
              <div className="flex flex-col items-center justify-center">
                <div className="flex flex-row gap-4 w-full mb-2">
                  <button
                    onClick={() => {
                      setFetchedBodenResponseMeta(undefined);
                      if (inputTokenBoden === "sol") {
                        return setInputBodenAmount((solBalance / 2).toString());
                      }
                      if (inputTokenBoden === "tremp") {
                        return setInputBodenAmount(
                          (trempBalance / 2).toString()
                        );
                      }
                      if (inputTokenBoden === "usdc") {
                        return setInputBodenAmount(
                          (usdcBalance / 2).toString()
                        );
                      }
                    }}
                    className="ml-auto border border-zinc-400 px-2 rounded-lg text-xs"
                  >
                    half
                  </button>
                  <button
                    onClick={() => {
                      setFetchedBodenResponseMeta(undefined);
                      if (inputTokenBoden === "sol") {
                        return setInputBodenAmount(solBalance.toString());
                      }
                      if (inputTokenBoden === "tremp") {
                        return setInputBodenAmount(trempBalance.toString());
                      }
                      if (inputTokenBoden === "usdc") {
                        return setInputBodenAmount(usdcBalance.toString());
                      }
                    }}
                    className="border border-zinc-400 px-2 rounded-lg text-xs"
                  >
                    max
                  </button>
                </div>
                <div className="flex flex-row bg-white text-black px-3 py-2 rounded justify-center items-center">
                  <select
                    value={inputTokenBoden}
                    onChange={(e) => setInputTokenBoden(e.target.value)}
                  >
                    <option value={"sol"}>SOL</option>
                    <option value={"usdc"}>USDC</option>
                    <option value={"tremp"}>TREMP</option>
                  </select>
                  <input
                    className="w-[150px] text-right"
                    placeholder={currentMax}
                    value={inputBodenAmount}
                    onChange={(e) => {
                      handleDispatchBodenAmount(e.target.value);
                      setFetchedBodenResponseMeta(undefined);
                    }}
                    type="number"
                  />{" "}
                </div>
                {
                  <div className="w-full flex flex-row justify-between my-2 text-zinc-400 text-xs">
                    <span>available:</span>
                    <span>
                      {inputTokenBoden === "sol" &&
                        `${transformedTvl(solBalance)} SOL`}
                      {inputTokenBoden === "tremp" &&
                        `${transformedTvl(trempBalance)} TREMP`}
                      {inputTokenBoden === "usdc" &&
                        `${transformedTvl(usdcBalance)} USDC`}
                    </span>
                  </div>
                }
              </div>
              <button
                onClick={() => commitTransactionBoden()}
                disabled={
                  voteBodenLoading ||
                  (!fetchedBodenResponseMeta && inputBodenAmount !== "0") ||
                  inputBodenAmount === "0"
                }
                className={
                  "flex px-3 py-2 bg-blue-600 border border-blue-800 text-white rounded " +
                  (voteBodenLoading ||
                  (!fetchedBodenResponseMeta && inputBodenAmount !== "0") ||
                  inputBodenAmount === "0"
                    ? "opacity-50"
                    : "")
                }
              >
                {!fetchedBodenResponseMeta && inputBodenAmount !== "0"
                  ? "Fetching quote..."
                  : voteBodenLoading
                  ? "Voting..."
                  : "Vote Boden"}
              </button>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center text-3xl">
            vs.
          </div>
          <div className={`flex flex-col gap-4 ${adigiana.className}`}>
            <h2 className="text-2xl">Doland Tremp</h2>
            <div className="flex flex-col items-center justify-center">
              <div className="rounded-full overflow-hidden bg-red-600 h-[200px] w-[200px] ring-4 ring-white">
                <Image
                  alt="Boden"
                  src={"/tremp.png"}
                  width={200}
                  height={200}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 max-w-[300px] mx-auto">
              <div className="text-left">Price</div>
              <div className="text-right">${trempPrice} / TREMP </div>
              <div className="text-left">MCAP</div>
              <div className="text-right">
                $
                {transformedTvl(
                  parseInt(`${trempSupply * parseFloat(trempPrice)}`)
                )}
              </div>
              <div className="text-left">Balance</div>
              <div className="text-right">
                {trempBalance.toLocaleString("en-US", {
                  maximumFractionDigits: 2,
                })}{" "}
                TREMP
              </div>
            </div>
            <div className="flex flex-col justify-center items-center gap-4">
              <div className="flex flex-col items-center justify-center">
                <div className="flex flex-row gap-2 w-full mb-2">
                  <button
                    onClick={() => {
                      setFetchedTrempResponseMeta(undefined);
                      if (inputTokenTremp === "sol") {
                        return setInputTrempAmount((solBalance / 2).toString());
                      }
                      if (inputTokenTremp === "boden") {
                        return setInputTrempAmount(
                          (bodenBalance / 2).toString()
                        );
                      }
                      if (inputTokenTremp === "usdc") {
                        return setInputTrempAmount(
                          (usdcBalance / 2).toString()
                        );
                      }
                    }}
                    className="ml-auto border border-zinc-400 px-2 rounded-lg text-xs"
                  >
                    half
                  </button>
                  <button
                    onClick={() => {
                      setFetchedTrempResponseMeta(undefined);

                      if (inputTokenTremp === "sol") {
                        return setInputTrempAmount(solBalance.toString());
                      }
                      if (inputTokenTremp === "boden") {
                        return setInputTrempAmount(bodenBalance.toString());
                      }
                      if (inputTokenTremp === "usdc") {
                        return setInputTrempAmount(usdcBalance.toString());
                      }
                    }}
                    className="border border-zinc-400 px-2 rounded-lg text-xs"
                  >
                    max
                  </button>
                </div>
                <div className="flex flex-row bg-white text-black px-3 py-2 rounded justify-center items-center">
                  <select
                    value={inputTokenTremp}
                    onChange={(e) => setInputTokenTremp(e.target.value)}
                  >
                    <option value={"sol"}>SOL</option>
                    <option value={"usdc"}>USDC</option>
                    <option value={"boden"}>BODEN</option>
                  </select>
                  <input
                    className="w-[150px] text-right"
                    placeholder={currentMax}
                    value={inputTrempAmount}
                    onChange={(e) => {
                      handleDispatchTrempAmount(e.target.value);
                      setFetchedTrempResponseMeta(undefined);
                    }}
                    type="number"
                  />{" "}
                </div>
                {
                  <div className="w-full flex flex-row justify-between my-2 text-zinc-400 text-xs">
                    <span>available:</span>
                    <span>
                      {inputTokenTremp === "sol" &&
                        `${transformedTvl(solBalance)} SOL`}
                      {inputTokenTremp === "boden" &&
                        `${transformedTvl(bodenBalance)} BODEN`}
                      {inputTokenTremp === "usdc" &&
                        `${transformedTvl(usdcBalance)} USDC`}
                    </span>
                  </div>
                }
              </div>
              <button
                onClick={() => commitTransactionTremp()}
                disabled={trempButtonDisabled}
                className={
                  "flex px-3 py-2 bg-red-600 border border-red-800 text-white rounded " +
                  (trempButtonDisabled ? "opacity-50" : "")
                }
              >
                {!fetchedTrempResponseMeta &&
                inputTrempAmount !== "0" &&
                inputTrempAmount !== ""
                  ? "Fetching quote..."
                  : voteTrempLoading
                  ? "Voting..."
                  : "Vote Tremp"}
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
              href="https://twitter.com/thereal0xalice"
            >
              0xAlice
            </a>
          </span>
          <a
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-blue-400"
            href="https://github.com/21e8/boden-tremp-2024"
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
