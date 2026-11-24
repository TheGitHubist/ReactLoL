"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  normalizeApiCard,
  type CardApiResponse,
  type YuGiOhCard,
} from "../data/cards";
import FavoriteButton from "./favorite-button";

const refreshInterval = 60_000;

export default function CardDetails({ id }: { id: string }) {
  const [card, setCard] = useState<YuGiOhCard>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date>();

  useEffect(() => {
    const timer = window.setInterval(() => setRefreshKey((value) => value + 1), refreshInterval);
    return () => window.clearInterval(timer);
  }, [id]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setError("");
      fetch(`/api/cards?id=${encodeURIComponent(id)}`, {
        cache: "no-store",
        signal: controller.signal,
      })
        .then(async (response) => {
          const body: unknown = await response.json();
          if (!response.ok) {
            const message = (body as { error?: string }).error;
            throw new Error(message || `Card service returned ${response.status}.`);
          }
          if (!body || typeof body !== "object" || !Array.isArray((body as CardApiResponse).data)) {
            throw new Error("Card service returned an unexpected response.");
          }
          const found = (body as CardApiResponse).data[0];
          if (!found) throw new Error("No card with that ID was found.");
          setCard(normalizeApiCard(found));
          setSelectedImage(0);
          setLastUpdated(new Date());
        })
        .catch((caught: unknown) => {
          if (!controller.signal.aborted) {
            setError(caught instanceof Error ? caught.message : "Could not load this card.");
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [id, refreshKey]);

  if (error) return <main className="not-found"><p className="eyebrow">Card unavailable</p><h1>{error}</h1><Link className="primary-button" href="/">Return to the archive</Link></main>;
  if (loading || (card && card.id !== id)) return <main className="card-detail-page"><p className="eyebrow">Opening the archive...</p></main>;
  if (!card) return <main className="not-found"><p className="eyebrow">Card unavailable</p><h1>This card is not in the archive.</h1><Link className="primary-button" href="/">Return to the archive</Link></main>;

  const images = card.cardImages ?? [];
  const selectedImageUrl = images[selectedImage]?.image_url;
  const frame = card.frameType ?? (card.type.includes("Spell") ? "spell" : card.type.includes("Trap") ? "trap" : "effect");
  const price = card.cardPrices?.[0];

  return (
    <main className="card-detail-page">
      <Link className="back-link" href="/">← Back to the archive</Link>
      <div className={`card-detail-layout frame-${frame}`}>
        <div className="detail-card-frame">
          <div className="detail-art-placeholder"><span>✦</span></div>
          {selectedImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={selectedImageUrl} alt={`${card.name} artwork ${selectedImage + 1}`} onError={(event) => { event.currentTarget.style.display = "none"; }} />
          ) : null}
          {images.length > 1 && (
            <div className="card-image-gallery" aria-label="Card artwork variants">
              {images.map((image, index) => (
                <button
                  type="button"
                  className={index === selectedImage ? "selected" : ""}
                  key={image.id}
                  onClick={() => setSelectedImage(index)}
                  aria-label={`Show artwork ${index + 1}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image.image_url_small ?? image.image_url} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>
        <article className="card-detail-copy">
          <p className="eyebrow">{card.archetype ?? "Yu-Gi-Oh! Card"} · {card.humanReadableCardType ?? card.type}</p>
          <div className="card-title-row"><h1>{card.name}</h1><FavoriteButton card={card} /></div>
          {lastUpdated && (
            <p className="detail-live-status"><span /> Live API · updated {lastUpdated.toLocaleTimeString()}</p>
          )}
          <p className="card-id">CARD ID · {card.id}</p>
          <div className="detail-meta">
            {card.attribute && <span>{card.attribute}</span>}
            {card.race && <span>{card.race}</span>}
            {card.level !== undefined && <span>{frame === "xyz" ? "RANK" : "LEVEL"} {card.level}</span>}
            {card.scale !== undefined && <span>SCALE {card.scale}</span>}
            {card.linkval !== undefined && <span>LINK {card.linkval}</span>}
          </div>
          {card.typeline && <p className="card-typeline">[{card.typeline.join(" / ")}]</p>}
          <p className="detail-description">{card.description}</p>
          {card.pendDesc && <p className="detail-description"><strong>Pendulum effect</strong><br />{card.pendDesc}</p>}
          {card.monsterDesc && <p className="detail-description"><strong>Monster effect</strong><br />{card.monsterDesc}</p>}
          {card.atk !== undefined && (
            <div className="detail-stats">
              <span>ATK <strong>{card.atk}</strong></span>
              {card.def !== undefined && <span>DEF <strong>{card.def}</strong></span>}
              {card.linkmarkers?.length ? <span>LINK MARKERS <strong>{card.linkmarkers.join(", ")}</strong></span> : null}
            </div>
          )}
          {price && (
            <details className="card-data-section">
              <summary>Market prices</summary>
              <dl className="price-list">
                {Object.entries(price).map(([source, value]) => <div key={source}><dt>{source.replaceAll("_", " ")}</dt><dd>{value || "—"}</dd></div>)}
              </dl>
            </details>
          )}
          {card.cardSets?.length ? (
            <details className="card-data-section">
              <summary>Printings ({card.cardSets.length})</summary>
              <div className="printing-list">
                {card.cardSets.map((set) => (
                  <div key={`${set.set_code}-${set.set_rarity}`}>
                    <strong>{set.set_name}</strong>
                    <span>{set.set_code} · {set.set_rarity}</span>
                  </div>
                ))}
              </div>
            </details>
          ) : null}
          {card.banlistInfo && (
            <div className="detail-meta banlist-meta">
              {card.banlistInfo.ban_tcg && <span>TCG: {card.banlistInfo.ban_tcg}</span>}
              {card.banlistInfo.ban_ocg && <span>OCG: {card.banlistInfo.ban_ocg}</span>}
              {card.banlistInfo.ban_goat && <span>GOAT: {card.banlistInfo.ban_goat}</span>}
            </div>
          )}
          {card.miscInfo?.length ? (
            <details className="card-data-section">
              <summary>Database metadata</summary>
              <dl className="price-list">
                {card.miscInfo[0].tcg_date && <div><dt>TCG release</dt><dd>{card.miscInfo[0].tcg_date}</dd></div>}
                {card.miscInfo[0].ocg_date && <div><dt>OCG release</dt><dd>{card.miscInfo[0].ocg_date}</dd></div>}
                {card.miscInfo[0].konami_id && <div><dt>Konami ID</dt><dd>{card.miscInfo[0].konami_id}</dd></div>}
                {card.miscInfo[0].formats?.length && <div><dt>Formats</dt><dd>{card.miscInfo[0].formats.join(", ")}</dd></div>}
                {card.miscInfo[0].treated_as && <div><dt>Treated as</dt><dd>{card.miscInfo[0].treated_as}</dd></div>}
              </dl>
            </details>
          ) : null}
          {card.ygoprodeckUrl && <a className="source-link" href={card.ygoprodeckUrl} target="_blank" rel="noreferrer">View YGOPRODeck entry ↗</a>}
          <Link className="secondary-button" href="/">Back to collection <span>→</span></Link>
        </article>
      </div>
    </main>
  );
}
