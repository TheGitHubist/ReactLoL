"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent, type KeyboardEvent } from "react";
import {
  normalizeApiCard,
  type CardApiResponse,
  type YuGiOhCard,
} from "../data/cards";

type Hint = {
  label: string;
  value: string;
  state: "correct" | "incorrect" | "neutral" | "higher" | "lower";
};

type GuessRow = {
  card: YuGiOhCard;
  hints: Hint[];
};

type MysteryCard = {
  id: string;
  type: string;
  frameType?: string;
  race: string;
  attribute?: string;
  archetype: string;
  level?: number;
  scale?: number;
  atk?: number;
  def?: number;
  linkval?: number;
};

type MysteryResponse = {
  data: [{
    id: number;
    type: string;
    frameType?: string;
    race: string;
    attribute?: string;
    archetype: string;
    level?: number;
    scale?: number;
    atk?: number;
    def?: number;
    linkval?: number;
  }];
};

function display(value: string | number | undefined) {
  return value === undefined || value === "" ? "—" : String(value);
}

function compareValue(label: string, value: string | number | undefined, targetValue: string | number | undefined): Hint {
  const missing = value === undefined || value === "";
  const targetMissing = targetValue === undefined || targetValue === "";
  if (missing && targetMissing) return { label, value: "—", state: "neutral" };
  if (value === targetValue) return { label, value: display(value), state: "correct" };

  if (typeof value === "number" && typeof targetValue === "number") {
    return {
      label,
      value: `${value} ${value < targetValue ? "↑" : "↓"}`,
      state: value < targetValue ? "higher" : "lower",
    };
  }
  return { label, value: display(value), state: "incorrect" };
}

function cardHints(guess: YuGiOhCard, answer: MysteryCard): Hint[] {
  return [
    compareValue("Type", guess.type, answer.type),
    compareValue("Attribute", guess.attribute, answer.attribute),
    compareValue("Race", guess.race, answer.race),
    compareValue("Level / Rank", guess.level, answer.level),
    compareValue("Scale", guess.scale, answer.scale),
    compareValue("ATK", guess.atk, answer.atk),
    compareValue("DEF", guess.def, answer.def),
    compareValue("Link", guess.linkval, answer.linkval),
    compareValue("Archetype", guess.archetype, answer.archetype),
    compareValue("Frame", guess.frameType, answer.frameType),
  ];
}

export default function YugiohdlePage() {
  const [round, setRound] = useState(0);
  const [answer, setAnswer] = useState<MysteryCard>();
  const [solvedCard, setSolvedCard] = useState<YuGiOhCard>();
  const [guesses, setGuesses] = useState<GuessRow[]>([]);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<YuGiOhCard[]>([]);
  const [loadingAnswer, setLoadingAnswer] = useState(true);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [won, setWon] = useState(false);
  const [error, setError] = useState("");
  const [searchError, setSearchError] = useState("");
  const hintStages = answer
    ? [
      { guesses: 6, label: "Archetype", value: answer.archetype },
      { guesses: 12, label: "Card type", value: answer.type },
      { guesses: 18, label: "Race", value: answer.race },
    ]
    : [];

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoadingAnswer(true);
      setAnswer(undefined);
      setError("");
      try {
        const response = await fetch("/api/yugiohdle", { cache: "no-store", signal: controller.signal });
        const body: unknown = await response.json();
        if (!response.ok) {
          const message = (body as { error?: string }).error;
          throw new Error(message || `Yugiohdle returned ${response.status}.`);
        }
        if (!body || typeof body !== "object" || !Array.isArray((body as MysteryResponse).data) || !(body as MysteryResponse).data[0]) {
          throw new Error("Yugiohdle returned an unexpected card.");
        }
        const card = (body as MysteryResponse).data[0];
        setAnswer({
          id: String(card.id),
          type: card.type,
          frameType: card.frameType,
          race: card.race,
          attribute: card.attribute,
          archetype: card.archetype,
          level: typeof card.level === "number" ? card.level : undefined,
          scale: typeof card.scale === "number" ? card.scale : undefined,
          atk: typeof card.atk === "number" ? card.atk : undefined,
          def: typeof card.def === "number" ? card.def : undefined,
          linkval: typeof card.linkval === "number" ? card.linkval : undefined,
        });
      } catch (caught) {
        if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : "Could not start a new round.");
      } finally {
        if (!controller.signal.aborted) setLoadingAnswer(false);
      }
    }, 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [round]);

  useEffect(() => {
    const term = query.trim();
    if (!term || won) {
      const timer = window.setTimeout(() => {
        setSuggestions([]);
        setLoadingSearch(false);
        setSearchError("");
      }, 0);
      return () => window.clearTimeout(timer);
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoadingSearch(true);
      setSearchError("");
      try {
        const params = new URLSearchParams({ name: term, num: "50", offset: "0" });
        const response = await fetch(`/api/cards?${params}`, { cache: "no-store", signal: controller.signal });
        const body: unknown = await response.json();
        if (!response.ok) {
          const message = (body as { error?: string }).error;
          if (response.status === 400 && message?.toLowerCase().includes("no card matching")) {
            setSuggestions([]);
            return;
          }
          throw new Error(message || `Card service returned ${response.status}.`);
        }
        if (!body || typeof body !== "object" || !Array.isArray((body as CardApiResponse).data)) {
          throw new Error("Card search returned an unexpected response.");
        }
        const alreadyGuessed = new Set(guesses.map(({ card }) => card.id));
        setSuggestions((body as CardApiResponse).data
          .map(normalizeApiCard)
          .filter((card) => !alreadyGuessed.has(card.id)));
      } catch (caught) {
        if (!controller.signal.aborted) setSearchError(caught instanceof Error ? caught.message : "Could not search cards.");
      } finally {
        if (!controller.signal.aborted) setLoadingSearch(false);
      }
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [guesses, query, won]);

  function submitGuess(card: YuGiOhCard) {
    if (!answer || won) return;
    if (guesses.some((guess) => guess.card.id === card.id)) {
      setSearchError("You already guessed that card.");
      return;
    }
    setGuesses((current) => [...current, { card, hints: cardHints(card, answer) }]);
    setQuery("");
    setSuggestions([]);
    setSearchError("");
    if (card.id === answer.id) {
      setSolvedCard(card);
      setWon(true);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (suggestions[0]) submitGuess(suggestions[0]);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") setSuggestions([]);
  }

  function newRound() {
    setGuesses([]);
    setSolvedCard(undefined);
    setQuery("");
    setSuggestions([]);
    setWon(false);
    setError("");
    setRound((value) => value + 1);
  }

  return (
    <main className="yugiohdle-page">
      <div className="yugiohdle-header">
        <Link className="back-link" href="/">← Card library</Link>
        <p className="eyebrow">The card guessing challenge</p>
        <h1>Yugiohdle</h1>
        <p>Guess the mystery card. Each attempt reveals which traits match.</p>
      </div>

      {error ? (
        <div className="api-error yugiohdle-error" role="alert">
          <p>Could not load a mystery card: {error}</p>
          <button type="button" onClick={newRound}>Try again</button>
        </div>
      ) : loadingAnswer ? (
        <div className="empty-state yugiohdle-loading"><span>✦</span><h2>Shuffling the archive…</h2><p>Selecting a random card from the live database.</p></div>
      ) : (
        <>
          <form className="yugiohdle-search" onSubmit={handleSubmit}>
            <label htmlFor="card-guess">Your guess</label>
            <div className="yugiohdle-search-box">
              <input
                autoComplete="off"
                id="card-guess"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={won ? "You found the card!" : "Start typing a card name..."}
                disabled={won}
              />
              <button type="submit" className="primary-button" disabled={won || !suggestions.length}>Guess</button>
              {suggestions.length > 0 && !won && (
                <ul className="yugiohdle-suggestions" role="listbox" aria-label="Card search results">
                  {suggestions.map((card) => (
                    <li key={card.id}>
                      <button type="button" role="option" aria-selected={false} onClick={() => submitGuess(card)}>
                        <span>{card.name}</span><small>{card.type}</small>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <p className="guess-search-status" aria-live="polite">
              {loadingSearch ? "Searching the live card database…" : searchError || (suggestions.length ? `${suggestions.length} matching cards · choose one or press Enter` : query.trim() ? "No matching cards found." : "Normal Monsters are excluded from the mystery card pool.")}
            </p>
          </form>

          {!won && (
            <section className="card-hint-panel" aria-live="polite" aria-label="Mystery card hints">
              <div className="card-hint-heading"><span aria-hidden="true">✦</span><div><p className="eyebrow">Mystery card</p><h2>Unlock clues</h2></div></div>
              <div className="card-hint-list">
                {hintStages.map((hint) => (
                  <div className={`card-hint ${guesses.length >= hint.guesses ? "revealed" : "locked"}`} key={hint.guesses}>
                    <span className="card-hint-threshold">{hint.guesses} guesses</span>
                    {guesses.length >= hint.guesses
                      ? <><span className="card-hint-label">{hint.label}</span><strong>{hint.value || "Not listed"}</strong></>
                      : <span className="card-hint-lock">Hint locked</span>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {won && solvedCard && (
            <section className="yugiohdle-win" aria-live="polite">
              {solvedCard.cardImages?.[0]?.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={solvedCard.cardImages[0].image_url} alt={solvedCard.name} />
              ) : <span className="yugiohdle-card-placeholder">✦</span>}
              <div><p className="eyebrow">Correct answer</p><h2>{solvedCard.name}</h2><p>Solved in {guesses.length} {guesses.length === 1 ? "guess" : "guesses"}.</p></div>
              <button type="button" className="primary-button" onClick={newRound}>Play another round</button>
            </section>
          )}

          {!won && <p className="guess-count">{guesses.length} {guesses.length === 1 ? "guess" : "guesses"} so far</p>}
          {guesses.length > 0 && (
            <div className="guess-table-scroll">
              <table className="guess-table">
                <thead><tr><th>Card</th>{guesses[0].hints.map((hint) => <th key={hint.label}>{hint.label}</th>)}</tr></thead>
                <tbody>
                  {[...guesses].reverse().map(({ card, hints }) => (
                    <tr key={card.id}>
                      <th scope="row">{card.name}</th>
                      {hints.map((hint) => (
                        <td key={hint.label} className={`hint-${hint.state}`} title={hint.state === "higher" ? "The answer is higher" : hint.state === "lower" ? "The answer is lower" : undefined}>
                          <span>{hint.value}</span>
                          {(hint.state === "higher" || hint.state === "lower") && <small>{hint.state === "higher" ? "Higher" : "Lower"}</small>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </main>
  );
}
