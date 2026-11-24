"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import CardTile from "../components/card-tile";
import {
  COLLECTIONS_CHANGED,
  FAVORITES_KEY,
  readCardCollection,
  saveCollection,
} from "../data/collections";
import type { YuGiOhCard } from "../data/cards";

export default function FavoritesPage() {
  const [cards, setCards] = useState<YuGiOhCard[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const sync = () => {
      try {
        setCards(readCardCollection(FAVORITES_KEY));
        setError("");
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not load favorites.");
      }
    };
    sync();
    window.addEventListener(COLLECTIONS_CHANGED, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(COLLECTIONS_CHANGED, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  function removeFavorite(id: string) {
    try {
      const remaining = cards.filter((card) => card.id !== id);
      saveCollection(FAVORITES_KEY, remaining);
      setCards(remaining);
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update favorites.");
    }
  }

  return (
    <main className="collection-page">
      <div className="section-heading">
        <div><p className="eyebrow">Your personal collection</p><h1>Favorite cards</h1></div>
        <Link className="secondary-button" href="/yugiohdle">Play Yugiohdle</Link>
      </div>
      <p className="collection-description">Cards you mark with a star are kept here on this browser.</p>
      {error && <p className="form-error" role="alert">{error}</p>}
      {cards.length ? (
        <div className="card-grid">
          {cards.map((card) => (
            <div className="collection-card-entry" key={card.id}>
              <CardTile card={card} />
              <button type="button" className="remove-card" onClick={() => removeFavorite(card.id)}>Remove favorite</button>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state"><span>☆</span><h2>No favorites yet.</h2><p>Star cards in the library or on a card tile to save them here.</p><Link className="primary-button" href="/">Browse the card library</Link></div>
      )}
    </main>
  );
}
