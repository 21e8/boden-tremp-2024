type Config = {
  aDisplayNameShort: string;
  aDisplayNameLong: string;
  aDescriptor: string;
  aMint: string;
  aColor: string;
  aDecimals: number;
  aTicker: string;
  aCoingeckoId: string;

  bDisplayNameShort: string;
  bDisplayNameLong: string;
  bDescriptor: string;
  bMint: string;
  bColor: string;
  bDecimals: number;
  bTicker: string;
  bCoingeckoId: string;

  author: string;
  githubRepo: string;
  twitter: string;

  slippageBps: string;
};

export const config: Config = {
  aDisplayNameShort: "Boden",
  aDisplayNameLong: "Jeo Boden",
  aDescriptor: "boden",
  aMint: "3psH1Mj1f7yUfaD5gh6Zj7epE8hhrMkMETgv5TshQA4o",
  aColor: "rgb(1,73,171)",
  aDecimals: 9,
  aTicker: "BODEN",
  aCoingeckoId: "jeo-boden",

  bDisplayNameShort: "Tremp",
  bDisplayNameLong: "Doland Tremp",
  bDescriptor: "tremp",
  bMint: "FU1q8vJpZNUrmqsciSjp8bAKKidGsLmouB8CBdf8TKQv",
  bColor: "rgb(220,38,38)",
  bDecimals: 9,
  bTicker: "TREMP",
  bCoingeckoId: "donald-tremp",

  author: "0xAlice",
  githubRepo: "https://github.com/21e8/boden-tremp-2024",
  twitter: "https://twitter.com/thereal0xalice",
  slippageBps: "10000",
};
