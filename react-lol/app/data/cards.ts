export type CardImage = {
  id: number;
  image_url: string;
  image_url_small?: string;
  image_url_cropped?: string;
};

export type CardSet = {
  set_name: string;
  set_code: string;
  set_rarity: string;
  set_rarity_code: string;
  set_price: string;
};

export type CardPrices = {
  cardmarket_price: string;
  tcgplayer_price: string;
  ebay_price: string;
  amazon_price: string;
  coolstuffinc_price: string;
};

export type CardMiscInfo = {
  tcg_date?: string;
  ocg_date?: string;
  formats?: string[];
  treated_as?: string;
  beta_name?: string;
  konami_id?: number;
};

export type YuGiOhCard = {
  id: string;
  name: string;
  type: string;
  description: string;
  frameType?: string;
  humanReadableCardType?: string;
  typeline?: string[];
  race?: string;
  attribute?: string;
  archetype?: string;
  pendDesc?: string;
  monsterDesc?: string;
  level?: number;
  scale?: number;
  atk?: number;
  def?: number;
  linkval?: number;
  linkmarkers?: string[];
  cardImages?: CardImage[];
  cardSets?: CardSet[];
  cardPrices?: CardPrices[];
  miscInfo?: CardMiscInfo[];
  banlistInfo?: {
    ban_tcg?: string;
    ban_ocg?: string;
    ban_goat?: string;
  };
  ygoprodeckUrl?: string;
};

export type ApiCard = Omit<YuGiOhCard, "id" | "description" | "frameType" | "typeline" | "cardImages" | "cardSets" | "cardPrices" | "ygoprodeckUrl"> & {
  id: number;
  desc: string;
  frameType: string;
  typeline?: string[];
  card_images?: CardImage[];
  card_sets?: CardSet[];
  card_prices?: CardPrices[];
  misc_info?: CardMiscInfo[];
  pend_desc?: string;
  monster_desc?: string;
  banlist_info?: {
    ban_tcg?: string;
    ban_ocg?: string;
    ban_goat?: string;
  };
  ygoprodeck_url?: string;
  atk?: number | null;
  def?: number | null;
  level?: number | null;
};

export type CardApiResponse = {
  data: ApiCard[];
  meta?: {
    current_rows: number;
    total_rows: number;
    rows_remaining: number;
    total_pages: number;
    pages_remaining: number;
    next_page?: string;
    next_page_offset?: number;
  };
};

export type CardApiError = { error: string };

export function normalizeApiCard(card: ApiCard): YuGiOhCard {
  return {
    id: String(card.id),
    name: card.name,
    type: card.type,
    description: card.desc,
    frameType: card.frameType,
    humanReadableCardType: card.humanReadableCardType,
    typeline: card.typeline,
    race: card.race,
    attribute: card.attribute,
    archetype: card.archetype,
    pendDesc: card.pend_desc,
    monsterDesc: card.monster_desc,
    level: card.level ?? undefined,
    scale: card.scale,
    atk: card.atk ?? undefined,
    def: card.def ?? undefined,
    linkval: card.linkval,
    linkmarkers: card.linkmarkers,
    cardImages: card.card_images,
    cardSets: card.card_sets,
    cardPrices: card.card_prices,
    miscInfo: card.misc_info,
    banlistInfo: card.banlist_info,
    ygoprodeckUrl: card.ygoprodeck_url,
  };
}
