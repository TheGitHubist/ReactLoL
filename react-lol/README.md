# Duelist Archive

A Yu-Gi-Oh! TCG/OCG card archive built with Next.js and live card data from YGOPRODeck. Browse the complete database, alphabetically grouped and paginated by archetype; search dynamically, save favorite cards, inspect card records, personalize a duelist profile, and play Yugiohdle.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Features

- Search and page through the full YGOPRODeck database, grouped alphabetically by archetype. Search updates live as you type; filter by card type, attribute, race, ATK, and DEF.
- Card pages show all available artwork variants, effect text, stats, printings, market prices, banlist information, and the source record.
- Favorite any database card and find it on the **Favorites** page.
- Play **Yugiohdle**: guess a random card with an archetype, excluding Normal Monsters. Type, attribute, race, level, ATK, DEF, archetype, and frame feedback help narrow each guess; extra archetype, card type, and race hints unlock after 6, 12, and 18 guesses.
- Personalize a duelist profile saved in the current browser.

The app's `/api/cards`, `/api/archetypes`, and `/api/yugiohdle` routes proxy YGOPRODeck's public API without caching. While the catalog is open, it refreshes the full card list every 60 seconds. Favorites and the duelist profile are saved in the current browser. Artwork is loaded from the image URLs returned by the API.
