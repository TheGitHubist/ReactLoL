"use client";

import { useEffect, useState } from "react";
import {
  COLLECTIONS_CHANGED,
  FAVORITES_KEY,
  readCardCollection,
  saveCollection,
} from "../data/collections";
import type { YuGiOhCard } from "../data/cards";

export default function FavoriteButton({ card }: { card: YuGiOhCard }) {
  const [favorite, setFavorite] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const sync = () => {
      try {
        setFavorite(readCardCollection(FAVORITES_KEY).some((item) => item.id === card.id));
        setError("");
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not read favorites.");
      }
    };
    sync();
    window.addEventListener(COLLECTIONS_CHANGED, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(COLLECTIONS_CHANGED, sync);
      window.removeEventListener("storage", sync);
    };
  }, [card.id]);

  function toggleFavorite() {
    try {
      const current = readCardCollection(FAVORITES_KEY);
      const next = favorite
        ? current.filter((item) => item.id !== card.id)
        : [...current.filter((item) => item.id !== card.id), card];
      saveCollection(FAVORITES_KEY, next);
      setFavorite(!favorite);
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update favorites.");
    }
  }

  return (
    <button
      type="button"
      className={`favorite-toggle ${favorite ? "is-favorite" : ""}`}
      onClick={toggleFavorite}
      aria-pressed={favorite}
      aria-label={`${favorite ? "Remove from" : "Add to"} favorites: ${card.name}`}
      title={error || (favorite ? "Remove from favorites" : "Add to favorites")}
    >
      {favorite ? "★" : "☆"}
    </button>
  );
}
