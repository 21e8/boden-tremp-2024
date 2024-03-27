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
import { getAssociatedTokenAccount, transformedTvl } from "./_util";
import { Cell, Pie, PieChart } from "recharts";
import { BigNumber } from "bignumber.js";
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

  return (
    <>
      <div className="w-full max-w-7xl mx-auto p-8 flex flex-col">
        <div className="w-full text-center md:grid grid-cols-3 items-center mb-8">
          <div></div>
          <h1 className="text-3xl">Boden vs Tremp 2024</h1>
          <div className="flex flex-row">
            <div className="mx-auto md:ml-auto my-4 md:my-0">
              {" "}
              {mounted && <WalletMultiButton />}
            </div>
          </div>
        </div>
        <div
          className="flex flex-col md:grid grid-cols-3 text-center mt-8 gap-8 mb-8"
          style={{ gridTemplateColumns: "1fr 50px 1fr" }}
        >
          <div className="flex flex-col gap-4">
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
                      setInputBodenAmount(e.target.value);
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
          <div className="flex flex-col gap-4">
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
                    value={inputTokenBoden}
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
                    onChange={(e) => setInputTrempAmount(e.target.value)}
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
                className={
                  "flex px-3 py-2 bg-red-600 border border-red-800 text-white rounded " +
                  ((!fetchedTrempResponseMeta && inputTrempAmount !== "0") ||
                  inputTrempAmount === "0" ||
                  voteTrempLoading
                    ? "opacity-50"
                    : "")
                }
              >
                {!fetchedTrempResponseMeta && inputTrempAmount !== "0"
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
      </div>
    </>
  );
}
