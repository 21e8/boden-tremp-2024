type Config = {
  aDisplayNameShort: string;
  aDisplayNameLong: string;
  aDescriptor: string;
  aMint: string;
  aColor: string;
  aDecimals: number;
  aTicker: string;

  bDisplayNameShort: string;
  bDisplayNameLong: string;
  bDescriptor: string;
  bMint: string;
  bColor: string;
  bDecimals: number;
  bTicker: string;

  author: string;
  githubRepo: string;
  twitter: string;
};

export const config: Config = {
  aDisplayNameShort: "Boden",
  aDisplayNameLong: "Jeo Boden",
  aDescriptor: "boden",
  aMint: "3psH1Mj1f7yUfaD5gh6Zj7epE8hhrMkMETgv5TshQA4o",
  aColor: "rgb(1,73,171)",
  aDecimals: 6,
  aTicker: "BODEN",

  bDisplayNameShort: "Tremp",
  bDisplayNameLong: "Doland Tremp",
  bDescriptor: "tremp",
  bMint: "FU1q8vJpZNUrmqsciSjp8bAKKidGsLmouB8CBdf8TKQv",
  bColor: "rgb(220,38,38)",
  bDecimals: 6,
  bTicker: "TREMP",

  author: "0xAlice",
  githubRepo: "https://github.com/21e8/boden-tremp-2024",
  twitter: "https://twitter.com/thereal0xalice",
};
