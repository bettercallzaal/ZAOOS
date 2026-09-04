# Seniority roster - all 122 ZAO Respect holders by first on-chain receipt

Companion data file to [doc 2419](./README.md). Measured 2026-08-25.

**This is a measurement, not an allocation.** No ZID was assigned. Whether ZIDs
are ordered by this list at all is Zaal's decision (doc 2419 section 2.3), and
one of the two readings of his 2026-08-25 reversal says they are not.

**Method.** All 518 `Transfer` events for
`0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957` on Optimism, read from Blockscout v2
across 11 pages, complete history 2024-07-30 to 2025-12-20. Rank is by the block
number of each address's first incoming transfer. All 122 current holders have
one, and every first receipt is in a distinct block, so the ordering is total -
there are no ties to break.

**Read the identity columns carefully.** An ENS name is a claim about a wallet,
never proof of a person, and a `users` row is a record somebody typed. Neither is
a confirmed identity. Confirming those is Zaal's.

| Rank | First receipt | Respect | ENS | `users` row | ZID | Address |
|---|---|---|---|---|---|---|
| 1 | 2024-07-30 | 3,094 | - | zaal | **1** | `0x7234c36a71ec237c2ae7698e8916e0735001e9af` |
| 2 | 2024-07-30 | 1,265 | ohnahji.eth | wallet-only row | **3** | `0x64a15b1d2de581097cb48e5d82619203e24bb3e1` |
| 3 | 2024-07-30 | 2,512 | - | hurric4n3ike | **4** | `0x29f5dee65e1fb856b816eab4f0b702c10e5eaa34` |
| 4 | 2024-07-30 | 3,079 | attabotty.eth | wallet-only row | - | `0x7990d756acf4e12afc41f995130a33925fb868ee` |
| 5 | 2024-07-30 | 239 | - | tejm | - | `0x2c4b9348d19c85b23a1b7ea110f0295a657197f3` |
| 6 | 2024-07-30 | 1,914 | - | not in `users` | - | `0x8d43a3fc2fed663bf6b82ea4792c0e5239d5ee66` |
| 7 | 2024-07-30 | 65 | - | not in `users` | - | `0x934fbd975001ba40e3b8b2a7f180e74b12d0729f` |
| 8 | 2024-07-30 | 910 | - | wallet-only row | - | `0xf6519fef3eacfdb7843beea94a887255794438f0` |
| 9 | 2024-07-30 | 505 | - | wallet-only row | - | `0xe86840d9c4db42da83366a9ee75e57c711a34204` |
| 10 | 2024-07-30 | 28 | - | not in `users` | - | `0x86354d410d57e0acb8321cb2692b34b2ff68341a` |
| 11 | 2024-07-30 | 878 | - | wallet-only row | - | `0x1af4c2950c5c892d1f4aacd60e8f656a14555e5a` |
| 12 | 2024-07-30 | 79 | - | not in `users` | - | `0xf08d62405f064abc953fe3052ea84b4c4bd32678` |
| 13 | 2024-07-30 | 10 | - | not in `users` | - | `0xc558bfa9cb4d6e7b2acf074a235df0b0ef204918` |
| 14 | 2024-07-30 | 15 | - | not in `users` | - | `0x8f59aa0f586d6d941152b9075b344cdc42e9b024` |
| 15 | 2024-07-30 | 162 | - | not in `users` | - | `0x711741ae6e6e4ee7abbc02212b141e963b314185` |
| 16 | 2024-07-30 | 611 | - | wallet-only row | - | `0xb7f4b9caba6bb0aeaa2b5d8df23e2b59c192bdbb` |
| 17 | 2024-07-30 | 451 | melatto.eth | wallet-only row | - | `0x69b256c8016759fdab80ada8e4b48ba2f6cea088` |
| 18 | 2024-07-30 | 220 | - | wallet-only row | - | `0x06d43fe5b16a6783dfdaff1c6a4024e926e89e1f` |
| 19 | 2024-07-30 | 825 | - | metamu | - | `0x2d9cbc4ecfbd1b8f66aa798fd51585ae058daa8b` |
| 20 | 2024-07-30 | 85 | - | not in `users` | - | `0x0bd71542a37980f0fc738ada81466b33d7480840` |
| 21 | 2024-07-30 | 33 | - | not in `users` | - | `0xa32ac6f43458c40369385e60f704912b33312919` |
| 22 | 2024-07-30 | 13 | - | not in `users` | - | `0x1f069ed706f9f8a156fc18679ee0c30db5953bbd` |
| 23 | 2024-08-06 | 23 | - | not in `users` | - | `0x389522008fcee1f8bbe82c9fc9cb1538c3b20737` |
| 24 | 2024-08-06 | 34 | - | not in `users` | - | `0x0517a288d795905d955b1e9f005dc191956875f7` |
| 25 | 2024-08-06 | 65 | - | not in `users` | - | `0x0d08ec62b556d3dec321a6097ab43c8488f9dfaf` |
| 26 | 2024-08-06 | 1,379 | jedxo.eth | jedxo | - | `0xa70fe49c71529808eb881455073beded47f7016c` |
| 27 | 2024-08-08 | 8 | - | not in `users` | - | `0x1d2f6243b964ffad6c7e72c1ec7d3edd2deecdd3` |
| 28 | 2024-08-09 | 581 | danici.eth | wallet-only row | - | `0xc98520e01789d21509ec449ddb5285fc56a6eed8` |
| 29 | 2024-08-13 | 247 | - | not in `users` | - | `0x2e691c095a9cb738e9121a005bf9c330dbca2445` |
| 30 | 2024-08-20 | 1,147 | - | wallet-only row | - | `0xbc66077e3a212c5f255cfc986e7c0508cfeabfd1` |
| 31 | 2024-08-20 | 152 | - | wallet-only row | - | `0x3d5e3102b2df3289799f5b09fe4827a59c3e59ef` |
| 32 | 2024-08-20 | 23 | - | not in `users` | - | `0x8902902f8f5aa3123d0b8e6717b015e847d11320` |
| 33 | 2024-09-04 | 320 | - | wallet-only row | - | `0x50878df070d764aede0d91101d2de83fdcdcf79a` |
| 34 | 2024-09-04 | 37 | - | not in `users` | - | `0x74f1668cea1e733b434dec0d6dcf1f3ec64973d6` |
| 35 | 2024-09-04 | 120 | - | not in `users` | - | `0x08aa4326a03af42f45c8b82ec747430f5de51ebd` |
| 36 | 2024-09-09 | 100 | davydmusic.eth | not in `users` | - | `0xd6c09962e907428112069273d5c0dc861e7b1c57` |
| 37 | 2024-09-09 | 70 | - | not in `users` | - | `0x10c163364fe153cadf6532a5b34481eefb99d96d` |
| 38 | 2024-09-09 | 10 | sigueinventando.eth | not in `users` | - | `0x9288a0c657c43182af1e6ba714410a627214c4fd` |
| 39 | 2024-09-09 | 2,278 | prizem.eth | prizem | - | `0x65284960d4eadaf45e923430a59b7d3bf34db641` |
| 40 | 2024-09-09 | 10 | - | not in `users` | - | `0xcada053edaacae7e4b38bd5761fedc61ce61d7e8` |
| 41 | 2024-09-09 | 1,499 | gneric.eth | gnericvibes | - | `0x744cdf12d5d289db118ed9293c10cfa952169071` |
| 42 | 2024-09-09 | 10 | - | not in `users` | - | `0x381777f8e01fa59bfb26c339dec98595fa4e7e9e` |
| 43 | 2024-09-09 | 32 | - | not in `users` | - | `0x9f92e205fab7846e76903b087d4d98f3ba7a20e4` |
| 44 | 2024-09-09 | 2,310 | - | ezincrypto | - | `0xfab9a3d37999e12252b47468d2ffd4be15936012` |
| 45 | 2024-09-09 | 10 | gethype.eth | not in `users` | - | `0x6984abf56f07a9b77f9c86505662df02abd18ca9` |
| 46 | 2024-09-09 | 647 | fellenz.eth | fellenz | - | `0x82cb2305388c853ecfe9ea83a1604acf58466659` |
| 47 | 2024-09-09 | 10 | - | not in `users` | - | `0xd46b94375251d1a6caebae37953eaf2177e6de52` |
| 48 | 2024-09-09 | 10 | - | not in `users` | - | `0x7b10f92a052e8630ec398cafd7f14a5e39eeb960` |
| 49 | 2024-09-16 | 117 | - | not in `users` | - | `0x3c4cbade02a68f94d113005da721c46a5238cdfc` |
| 50 | 2024-09-16 | 1,122 | failoften.eth | failoften | - | `0xfda73b8459f66b6758d1809372df921365053af1` |
| 51 | 2024-09-16 | 10 | - | not in `users` | - | `0x4260614dc21676b1aa75dbe4a50a3b416c4c0cd6` |
| 52 | 2024-09-16 | 10 | hodlon.eth | not in `users` | - | `0x4e443cdaff5c09a467ec5ee7e8b230ba463cbbbb` |
| 53 | 2024-09-16 | 60 | - | not in `users` | - | `0xbd5f00d011f76918637807f553694e7f2eb02ea9` |
| 54 | 2024-09-23 | 60 | - | not in `users` | - | `0x156f8717a5c213cfcce01f7ab224bc983ce2f063` |
| 55 | 2024-09-27 | 76 | - | not in `users` | - | `0x81f2cb371985d4ecfe684011e489186bac647702` |
| 56 | 2024-09-27 | 34 | vicidflow.eth | not in `users` | - | `0xf027828a6d9a0618a2f419ab71db39cf2295f027` |
| 57 | 2024-09-27 | 10 | - | not in `users` | - | `0x8c44ba8c6d796d377ce13bc2b8c3def0939bbb4b` |
| 58 | 2024-09-27 | 50 | dansingjoy.eth | dansingjoy | - | `0xc11c6f47fe090a706ba82964b8a98f1682b244ff` |
| 59 | 2024-09-27 | 10 | - | not in `users` | - | `0xab5a7891e95bd14ff7c3a35b47b8aeef562d1444` |
| 60 | 2024-09-27 | 10 | - | not in `users` | - | `0xb940daa644b080087dd027c7e0cb68cb1ce22805` |
| 61 | 2024-10-03 | 60 | - | not in `users` | - | `0x6bb1040cdc05dbb2b9db70bbbc0266e01c52b325` |
| 62 | 2024-10-03 | 90 | - | not in `users` | - | `0xeae357bde3dc9ec3bbf81f4239760b37aa318405` |
| 63 | 2024-10-04 | 44 | - | not in `users` | - | `0xdf302faea9a46fdf157277e098ce1e63e9969aa7` |
| 64 | 2024-10-15 | 55 | - | not in `users` | - | `0x179edd4a88e493ec6ed6a367ecbe7635cc02314c` |
| 65 | 2024-10-15 | 182 | - | wallet-only row | - | `0xffa5e3849bd29a81b202e935d23f4b6ca27d58fe` |
| 66 | 2024-10-29 | 10 | - | not in `users` | - | `0x328f0790d9ac6d3f4b65b655dd2f1440488ec3a8` |
| 67 | 2024-11-19 | 55 | w1l5on.eth | not in `users` | - | `0x122b0eaa0a4252cefcb877f0bf608bae2cf7ca9e` |
| 68 | 2024-11-19 | 5 | - | not in `users` | - | `0xc5005787291c5bfbfbdee13dfba6a138744e64f6` |
| 69 | 2024-11-22 | 20 | - | not in `users` | - | `0x26b4a8e9c7ecc7e3b7d46ca83bee1aa9e0af35a1` |
| 70 | 2024-12-19 | 132 | - | not in `users` | - | `0xa36411680abbfd712e5f6c61df054b5cf5ae6810` |
| 71 | 2024-12-19 | 35 | - | not in `users` | - | `0xd23ac3a45b429cf276f16acf3036ef23b1f37cf5` |
| 72 | 2024-12-24 | 105 | - | not in `users` | - | `0x0c4952550465840736f161d2d6878b8c3b31f330` |
| 73 | 2024-12-24 | 33 | - | not in `users` | - | `0x444a327b63850aec4d9b7487d39ef4d3f3a7cdfd` |
| 74 | 2025-01-03 | 75 | - | not in `users` | - | `0x1105f52b534faf048cf5b35ab2bf1b302b9d57d2` |
| 75 | 2025-01-03 | 66 | - | mumbovibes | - | `0xc79797f76f059753c57d931fec7961ba437b38a7` |
| 76 | 2025-01-05 | 300 | - | wallet-only row | - | `0x38fbf3294dc874ce52f306b1bcb745d61ef028eb` |
| 77 | 2025-01-07 | 206 | - | visceralglitch | - | `0x3cc027125a697400b0c6255b3438f4bdbff9d7a6` |
| 78 | 2025-01-07 | 150 | jpsjpegs.eth | not in `users` | - | `0xcc749c4b3585b8cbb244afbb6c4c790dab4204e0` |
| 79 | 2025-01-09 | 50 | - | not in `users` | - | `0x684d203c535daea5cd85392faa50cc0cb231b979` |
| 80 | 2025-01-09 | 50 | - | not in `users` | - | `0x277acfa0b8aab0b891ab3429fdee800da3b18fe9` |
| 81 | 2025-01-09 | 50 | - | not in `users` | - | `0x0c1823a9c0928bc643473d049973e7428d92a5c6` |
| 82 | 2025-01-09 | 50 | - | not in `users` | - | `0x1dde560f2386bf497f04049a08e8fa40db9b2144` |
| 83 | 2025-01-09 | 50 | - | not in `users` | - | `0x9599dccd7cb2355d47ac0da60bad1c83b2dd4e0a` |
| 84 | 2025-01-09 | 50 | - | not in `users` | - | `0x8fb6c453de2b64705956c61199e1f6df45cb7a2d` |
| 85 | 2025-01-09 | 50 | - | not in `users` | - | `0xdaa70eac656777b11d7edccf67dd2dad8240bb8c` |
| 86 | 2025-01-09 | 50 | - | not in `users` | - | `0x8eec07693d06123af17eea6cab3757f4952c710b` |
| 87 | 2025-01-09 | 50 | vasiawow.eth | not in `users` | - | `0x475f1ada912ded076fe9369ff1366bfca4a69baa` |
| 88 | 2025-01-09 | 50 | - | not in `users` | - | `0xc8c80654ebc3df3b78c0282fcbd12f66ad8961a6` |
| 89 | 2025-01-09 | 50 | - | not in `users` | - | `0xe9f595099f1260eb723a5447bbc53ac9fd11cf4f` |
| 90 | 2025-01-09 | 50 | - | not in `users` | - | `0x007aefc84c5e47bcc0f6f1e7028196e18f574398` |
| 91 | 2025-01-28 | 355 | - | wallet-only row | - | `0x03726e10565402a1137960ba06681754be7fe05f` |
| 92 | 2025-02-10 | 172 | - | wallet-only row | - | `0x29f9ef8286dcc4f9a94340278db01f12c3483988` |
| 93 | 2025-02-10 | 468 | - | wallet-only row | - | `0xc96ab83c1b1605c9cf5ecc661a415e41423185d8` |
| 94 | 2025-02-10 | 247 | - | wallet-only row | - | `0xed78b6236c14c4088715cd90513c6c604275db96` |
| 95 | 2025-02-10 | 244 | desultor.eth | desultor | - | `0x1d95b0b6d3582feec7ef35d2ccf91564ded0cf7f` |
| 96 | 2025-02-10 | 60 | realgrl.eth | not in `users` | - | `0x4f6d0ca7e66d5e447862793f23904ba15f51f4de` |
| 97 | 2025-02-10 | 66 | - | not in `users` | - | `0xdfbc0b0819f841cdda9b418078b4304809600185` |
| 98 | 2025-02-10 | 50 | - | not in `users` | - | `0x297de1ccdebbe02873ee118f6888f511a4016cd4` |
| 99 | 2025-02-10 | 50 | - | not in `users` | - | `0x3c85652f1784d154840ae327e57d31c82bd9754b` |
| 100 | 2025-02-10 | 785 | songsofeden.eth | wallet-only row | - | `0xfcf77ac2cef5eb373d8eb9163f518126cce44f47` |
| 101 | 2025-02-10 | 78 | - | not in `users` | - | `0x5118c2b4e66eb91e83ccbedc021437a91e99f7c5` |
| 102 | 2025-02-10 | 163 | - | not in `users` | - | `0x5c4a053de47c69f033acec58c2bd1aa4d683e5aa` |
| 103 | 2025-02-10 | 44 | - | not in `users` | - | `0x6df1fd18aaa9f1dd745e6e3afc3ff8522a556889` |
| 104 | 2025-02-10 | 510 | - | not in `users` | - | `0x21bc394f9f7b52d632e2b22b5b5c6a4ab922d75b` |
| 105 | 2025-02-10 | 10 | - | not in `users` | - | `0x5ecc8a94c117eeb5c6233600927e941c2548d574` |
| 106 | 2025-02-10 | 10 | - | not in `users` | - | `0x8504e1841e5c51a3f20a4f4aef2b4306f974fd52` |
| 107 | 2025-02-10 | 10 | - | not in `users` | - | `0x85e767682094ace9b788597042c5bcdcfcf8a395` |
| 108 | 2025-02-10 | 600 | jose.metagame.wtf | joseacabrerav | - | `0x29185eb8cfd22aa719529217bfbade61677e0ad2` |
| 109 | 2025-02-17 | 25 | - | not in `users` | - | `0x9a499ed2f72f703655d4f4ac75afc072e4d519d4` |
| 110 | 2025-03-04 | 50 | - | not in `users` | - | `0xd3390619331cbd1a0afb9f9bbb2177f69a8a13d5` |
| 111 | 2025-03-13 | 25 | - | not in `users` | - | `0x161bf804f9e50ee203024335ce927dcb411ae946` |
| 112 | 2025-04-01 | 299 | - | wallet-only row | - | `0x547f8b793362df477a23af6ee05f8e4e291a2ee4` |
| 113 | 2025-05-04 | 1,000 | - | krembeats | - | `0x9e4281619db487c2f577e67a7174ff8f5c5e4706` |
| 114 | 2025-06-25 | 186 | - | wallet-only row | - | `0x6e11a90fd63617fa22978451076dfe1d0eafb907` |
| 115 | 2025-06-25 | 178 | - | anesi | - | `0xa4a8e3d3d9907767150be04c55b5095bf639529d` |
| 116 | 2025-06-25 | 136 | - | kosbaar | - | `0x698e5a259c7564fc209a31994d664cb919725383` |
| 117 | 2025-06-25 | 120 | - | not in `users` | - | `0x76d74cff93d1357c3edbab57ae37c317a183d900` |
| 118 | 2025-06-25 | 110 | - | not in `users` | - | `0xd4d92bc93ce1ce285d308b3953b47bb8311719d9` |
| 119 | 2025-06-25 | 110 | - | not in `users` | - | `0x4b6639f68cee82ac1ff0473003af04f8007ee2d1` |
| 120 | 2025-06-25 | 110 | - | not in `users` | - | `0x41fd6111b3a62cf126b57aacc620eac7c7ba3c5c` |
| 121 | 2025-07-09 | 246 | - | not in `users` | - | `0x6710287cee1a9d1a00251fdc9a12795ec7a86189` |
| 122 | 2025-12-09 | 50 | - | not in `users` | - | `0xa702ed4e6a82c8148cc6b1dc7e22f19e4339fc68` |
