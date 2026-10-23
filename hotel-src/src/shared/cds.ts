// The CDs: the one 6ixty sells (Freakme), the three mystery CDs (yellow, green, blue: one song each) and the full album (red).
// Pure data: the browser and the server both use it.

export interface AlbumTrack { id: string; title: string; by: string }
/** The full album, in playing order. The mp3 of a track is public/music/album-<id>.mp3 */
export const ALBUM_TRACKS: AlbumTrack[] = [
  { id: "02-11-pa-en-blodig-sondag", title: "02!11 på en blodig søndag", by: "Em" },
  { id: "200mg", title: "200mg", by: "Sonne" },
  { id: "blod-ud-af-naesen", title: "Blod ud af næsen", by: "Sonne, Em, Hxllxw" },
  { id: "blodig-oktober", title: "Blodig oktober", by: "Em" },
  { id: "fanta", title: "Fanta", by: "Em & Milo" },
  { id: "freakme", title: "Freakme", by: "Teen & Em" },
  { id: "mikkel-kessler", title: "Mikkel Kessler", by: "Kay" },
  { id: "penyata", title: "Penyata", by: "Em" },
  { id: "sexpige", title: "Sexpige", by: "Sonne" },
  { id: "sidste-sommer", title: "Sidste Sommer", by: "Em" },
  { id: "ahmingud", title: "Åhmingud", by: "Em" },
];
export const albumTrack = (id: string): AlbumTrack | undefined => ALBUM_TRACKS.find((t) => t.id === id);
export const albumIndexOf = (id: string): number => ALBUM_TRACKS.findIndex((t) => t.id === id);

/** What each CD item plays: the id of the track (or "album") and its name. */
export interface CdDef { track: string; title: string }
export const CD_ITEMS: Record<string, CdDef> = {
  cd: { track: "freakme", title: "Freakme" },
  cd_yellow: { track: "ahmingud", title: "Åhmingud" },
  cd_green: { track: "blodig-oktober", title: "Blodig oktober" },
  cd_blue: { track: "blod-ud-af-naesen", title: "Blod ud af næsen" },
  cd_album: { track: "album", title: "Full album" },
};
export const CD_ITEM_IDS: string[] = Object.keys(CD_ITEMS);
export const isCdItem = (item: string | undefined): boolean => !!item && Object.prototype.hasOwnProperty.call(CD_ITEMS, item);
/** the three mystery CDs: a buy gives one you haven't got, and after three buys there are none left */
export const MYSTERY_CDS = ["cd_yellow", "cd_green", "cd_blue"];
export const ALBUM_CD = "cd_album";
/** the key in `owned` once a CD is bought (never bought twice) */
export const cdOwnedKey = (item: string): string => `item_${item}`;

/** Real money, in øre (100 øre = 1 kr): the mystery CD costs 150 kr. (The full album is no longer sold; players who bought it keep it, and an old paid order is still handed over.) */
export const MYSTERY_PRICE_ORE = 15_000;
/** A test item for trying the real payment (only emil and the admin can buy it): 2.50 kr, because that is the least Stripe takes for a card payment in kroner. It hands over one cigarette. */
export const TEST_PRICE_ORE = 250;
export const TEST_BUYERS = ["emil@users.bobba.invalid"];
export type PayProduct = "mystery" | "album" | "test";
