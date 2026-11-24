"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import CardTile from "./components/card-tile";
import {
  normalizeApiCard,
  type CardApiResponse,
  type YuGiOhCard,
} from "./data/cards";

const pageSize = 36;
const refreshInterval = 60_000;
const cardTypes = [
  "All types", "Effect Monster", "Flip Effect Monster", "Fusion Monster",
  "Link Monster", "Normal Monster", "Pendulum Effect Monster", "Ritual Monster",
  "Synchro Monster", "Token", "Trap Card", "Tuner Monster", "XYZ Monster",
  "Xyz Monster", "Spell Card",
];
const attributes = ["All attributes", "DARK", "LIGHT", "EARTH", "WATER", "FIRE", "WIND", "DIVINE"];
const races = [
  "All races", "Aqua", "Beast", "Beast-Warrior", "Creator-God", "Cyberse",
  "Dinosaur", "Divine-Beast", "Dragon", "Fairy", "Fiend", "Fish", "Insect",
  "Machine", "Plant", "Psychic", "Pyro", "Reptile", "Rock", "Sea Serpent",
  "Spellcaster", "Thunder", "Warrior", "Winged Beast", "Wyrm", "Zombie",
];

export default function Home() {
  const [apiCards, setApiCards] = useState<YuGiOhCard[]>([]);
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date>();
  const [search, setSearch] = useState("");
  const [archetype, setArchetype] = useState("");
  const [type, setType] = useState("");
  const [attribute, setAttribute] = useState("");
  const [race, setRace] = useState("");
  const [minAtk, setMinAtk] = useState("");
  const [maxAtk, setMaxAtk] = useState("");
  const [minDef, setMinDef] = useState("");
  const [maxDef, setMaxDef] = useState("");
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setRefreshKey((value) => value + 1), refreshInterval);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setApiError("");

      try {
        const response = await fetch("/api/cards?all=true", {
          cache: "no-store",
          signal: controller.signal,
        });
        const body: unknown = await response.json();
        if (!response.ok) {
          const message = (body as { error?: string }).error || `Card service returned ${response.status}.`;
          throw new Error(message);
        }
        if (!body || typeof body !== "object" || !Array.isArray((body as CardApiResponse).data)) {
          throw new Error("Card service returned an unexpected response.");
        }
        const result = body as CardApiResponse;
        setApiCards(result.data.map(normalizeApiCard));
        setLastUpdated(new Date());
        setApiError("");
      } catch (error) {
        if (controller.signal.aborted) return;
        setApiError(error instanceof Error ? error.message : "Could not load cards from YGOPRODeck.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 300);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [refreshKey, retry]);

  const filteredApiCards = useMemo(
    () => apiCards.filter((card) => {
      const matchesSearch = !search.trim() || `${card.name} ${card.archetype ?? ""}`.toLowerCase().includes(search.trim().toLowerCase());
      const matchesArchetype = !archetype || card.archetype === archetype;
      const matchesType = !type || card.type === type;
      const matchesAttribute = !attribute || card.attribute === attribute;
      const matchesRace = !race || card.race === race;
      const matchesStats =
        (!minAtk || (card.atk !== undefined && card.atk >= Number(minAtk))) &&
        (!maxAtk || (card.atk !== undefined && card.atk <= Number(maxAtk))) &&
        (!minDef || (card.def !== undefined && card.def >= Number(minDef))) &&
        (!maxDef || (card.def !== undefined && card.def <= Number(maxDef)));
      return matchesSearch && matchesArchetype && matchesType && matchesAttribute && matchesRace && matchesStats;
    }),
    [apiCards, archetype, attribute, maxAtk, maxDef, minAtk, minDef, race, search, type],
  );
  const archetypeOptions = useMemo(() =>
    [...new Set(apiCards.map((card) => card.archetype).filter((value): value is string => Boolean(value)))].sort((left, right) => left.localeCompare(right)),
  [apiCards]);
  const sortedCards = useMemo(() => {
    return [...filteredApiCards].sort((left, right) =>
      (left.archetype ?? "No archetype").localeCompare(right.archetype ?? "No archetype") ||
      left.name.localeCompare(right.name),
    );
  }, [filteredApiCards]);
  const paginatedCards = useMemo(() => sortedCards.slice(offset, offset + pageSize), [offset, sortedCards]);
  const groupedCards = useMemo(() => {
    const groups = new Map<string, YuGiOhCard[]>();
    for (const card of paginatedCards) {
      const group = card.archetype || "No archetype";
      groups.set(group, [...(groups.get(group) ?? []), card]);
    }
    return [...groups.entries()].map(([name, cards]) => ({ name, cards }));
  }, [paginatedCards]);

  function resetFilters() {
    setSearch("");
    setArchetype("");
    setType("");
    setAttribute("");
    setRace("");
    setMinAtk("");
    setMaxAtk("");
    setMinDef("");
    setMaxDef("");
    setOffset(0);
  }

  const firstResult = sortedCards.length > 0 ? offset + 1 : 0;
  const lastResult = Math.min(offset + pageSize, sortedCards.length);

  return (
    <main>
      <section className="hero">
        <div className="hero-sigil" aria-hidden="true"><span>遊</span></div>
        <div className="hero-content">
          <p className="eyebrow">The Duelist&apos;s Archive</p>
          <h1>Every card tells a story.</h1>
          <p>Explore the complete Yu-Gi-Oh! card database, uncover every archetype, and test your knowledge in Yugiohdle.</p>
          <div className="hero-actions">
            <a className="primary-button" href="#card-library">Explore the library</a>
            <Link className="secondary-button" href="/yugiohdle">Play Yugiohdle <span>↗</span></Link>
          </div>
          <div className="hero-caption"><span /> Live card data · refreshes every minute</div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="hero-card-back"><span>遊戯王</span><i>DUEL MONSTERS</i></div>
          <div className="hero-orbit orbit-one" />
          <div className="hero-orbit orbit-two" />
        </div>
      </section>

      <section className="library-section" id="card-library">
        <div className="section-heading">
          <div>
            <p className="eyebrow">YGOPRODeck card database</p>
            <h2>All cards, by archetype</h2>
          </div>
          <div className="library-status" aria-live="polite">
            <p className="result-count">
              {loading ? "Refreshing…" : `${paginatedCards.length} shown · ${sortedCards.length.toLocaleString()} matching cards`}
              {!loading && apiCards.length > 0 && ` · ${apiCards.length.toLocaleString()} API cards in archive`}
            </p>
            <p className={`connection-state ${apiError ? "disconnected" : lastUpdated ? "connected" : "connecting"}`}>
              <span />
              {apiError ? "Reconnecting" : lastUpdated ? `Live · updated ${lastUpdated.toLocaleTimeString()}` : "Connecting to YGOPRODeck"}
            </p>
          </div>
        </div>
        <div className="filter-panel">
          <label className="search-field">
            <span aria-hidden="true">⌕</span>
            <input value={search} onChange={(event) => { setSearch(event.target.value); setOffset(0); }} placeholder="Search cards live by name..." aria-label="Search cards live by name" />
          </label>
          <label>Archetype
            <select value={archetype} onChange={(event) => { setArchetype(event.target.value); setOffset(0); }}>
              <option value="">All archetypes</option>
              {archetypeOptions.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label>Card type
            <select value={type} onChange={(event) => { setType(event.target.value); setOffset(0); }}>
              {cardTypes.map((item) => <option key={item} value={item === "All types" ? "" : item}>{item}</option>)}
            </select>
          </label>
          <label>Attribute
            <select value={attribute} onChange={(event) => { setAttribute(event.target.value); setOffset(0); }}>
              {attributes.map((item) => <option key={item} value={item === "All attributes" ? "" : item}>{item}</option>)}
            </select>
          </label>
          <label>Monster race
            <select value={race} onChange={(event) => { setRace(event.target.value); setOffset(0); }}>
              {races.map((item) => <option key={item} value={item === "All races" ? "" : item}>{item}</option>)}
            </select>
          </label>
          <label>Min. ATK
            <input type="number" min="0" value={minAtk} onChange={(event) => { setMinAtk(event.target.value); setOffset(0); }} placeholder="Any" />
          </label>
          <label>Max. ATK
            <input type="number" min="0" value={maxAtk} onChange={(event) => { setMaxAtk(event.target.value); setOffset(0); }} placeholder="Any" />
          </label>
          <label>Min. DEF
            <input type="number" min="0" value={minDef} onChange={(event) => { setMinDef(event.target.value); setOffset(0); }} placeholder="Any" />
          </label>
          <label>Max. DEF
            <input type="number" min="0" value={maxDef} onChange={(event) => { setMaxDef(event.target.value); setOffset(0); }} placeholder="Any" />
          </label>
          <button className="clear-filters" type="button" onClick={resetFilters}>Clear filters</button>
        </div>

        {apiError && (
          <div className="api-error" role="alert">
            <p>Could not load live card data: {apiError}</p>
            <button type="button" onClick={() => setRetry((value) => value + 1)}>Try again</button>
          </div>
        )}
        {groupedCards.length ? (
          <div className="archetype-groups">
            {groupedCards.map(({ name, cards }) => (
              <section className="archetype-group" key={name}>
                <div className="archetype-group-heading"><h3>{name}</h3><span>{cards.length} {cards.length === 1 ? "card" : "cards"}</span></div>
                <div className="card-grid">{cards.map((card) => <CardTile card={card} key={card.id} />)}</div>
              </section>
            ))}
          </div>
        ) : !loading && !apiError ? (
          <div className="empty-state"><span>⌕</span><h3>No cards found</h3><p>Try a different search or adjust your filters.</p></div>
        ) : loading ? (
          <div className="empty-state"><span>✦</span><h3>Opening the archive</h3><p>Fetching current card records from YGOPRODeck…</p></div>
        ) : null}

        {sortedCards.length > pageSize && (
          <div className="pagination">
            <button type="button" disabled={loading || offset === 0} onClick={() => setOffset(Math.max(0, offset - pageSize))}>← Previous</button>
            <span>{firstResult.toLocaleString()}–{lastResult.toLocaleString()} of {sortedCards.length.toLocaleString()}</span>
            <button type="button" disabled={loading || lastResult >= sortedCards.length} onClick={() => setOffset(Math.min(offset + pageSize, Math.floor((sortedCards.length - 1) / pageSize) * pageSize))}>Next →</button>
          </div>
        )}
      </section>

      <section className="feature-callout yugiohdle-callout">
        <div><p className="eyebrow">Think you know your cards?</p><h2>Play Yugiohdle.</h2><p>Guess the mystery card by reading the clues from every attempt.</p></div>
        <div className="callout-actions"><Link className="primary-button" href="/yugiohdle">Start guessing <span>→</span></Link></div>
      </section>
    </main>
  );
}
