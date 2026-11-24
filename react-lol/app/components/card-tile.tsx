import Link from "next/link";
import FavoriteButton from "./favorite-button";
import type { YuGiOhCard } from "../data/cards";

export default function CardTile({ card }: { card: YuGiOhCard }) {
  const href = `/cards/${card.id}`;
  const image = card.cardImages?.[0]?.image_url_small ?? card.cardImages?.[0]?.image_url;
  const frame = card.frameType ?? (card.type.includes("Spell") ? "spell" : card.type.includes("Trap") ? "trap" : card.type.toLowerCase().split(" ")[0]);

  return (
    <article className="trading-card">
      <Link className="trading-card-link" href={href}>
        <div className={`trading-card-art frame-${frame}`}>
          <span className="card-placeholder" aria-hidden="true">✦</span>
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt={card.name} onError={(event) => { event.currentTarget.style.display = "none"; }} />
          ) : null}
          {card.level !== undefined && card.type.includes("Monster") && (
            <span className="card-level">{Array.from({ length: card.level }, (_, index) => <i key={index} />)}</span>
          )}
        </div>
        <div className="trading-card-info">
          <p>{card.archetype ?? "No archetype"}</p>
          <h3>{card.name}</h3>
          <span>{card.type}</span>
          <div className="card-stats">
            {card.attribute && <span>{card.attribute}</span>}
            {card.atk !== undefined && <span>ATK {card.atk}</span>}
            {card.def !== undefined && <span>DEF {card.def}</span>}
          </div>
        </div>
      </Link>
      <FavoriteButton card={card} />
    </article>
  );
}
