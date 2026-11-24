import type { YuGiOhCard } from "./cards";

export const FAVORITES_KEY = "yugioh-favorites";
export const COLLECTIONS_CHANGED = "duelist-collections-changed";

export function readCardCollection(key: string): YuGiOhCard[] {
  const saved = window.localStorage.getItem(key);
  if (!saved) return [];
  const parsed: unknown = JSON.parse(saved);
  if (!Array.isArray(parsed)) throw new Error("The saved card collection has an invalid format.");
  const cards = parsed as YuGiOhCard[];
  return key === FAVORITES_KEY ? cards.filter((card) => /^\d+$/.test(card.id)) : cards;
}

export function saveCollection(key: string, value: unknown) {
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event(COLLECTIONS_CHANGED));
}
