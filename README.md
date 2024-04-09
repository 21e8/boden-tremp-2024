# Boden Tremp 2024

This is a fun project that displays the stats of two different Solana coins, in this case Boden and Tremp coins. It is possible to "vote" for a candidate by swapping via Jupiter v6.

Project can be configured via src/app/_config.ts.

## Proxy

In order to count the holders in a manner that isn't gonna destroy your API key limits, there is a service exposed via NEXT_PUBLIC_HELIUS_PROXY in the frontend that gathers and caches holder snapshots.
This repo can be found under [github.com/21e8/helius-holder-proxy](https://github.com/21e8/helius-holder-proxy)
