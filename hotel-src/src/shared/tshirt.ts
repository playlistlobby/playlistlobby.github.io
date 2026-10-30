// The t-shirt shop at the album event: a real t-shirt pre-ordered for real money (200 kr). Only for players who are on the event stage right now.
// The name, address, email and phone number given when buying are only used to post the shirt: they are stored under tshirtOrders/<payment> (only the admin can read them).

/** 200 kr, in øre */
export const TSHIRT_PRICE_ORE = 20_000;
export const TSHIRT_SIZES = ["S", "M", "L", "XL"] as const;
export type TshirtSize = (typeof TSHIRT_SIZES)[number];

/** the three designs: A and B are pictures the admin can change (public/tshirt/design-a.png, design-b.png, or what he uploaded under tshirtDesigns/<id>), "me" has the player's own character on a blank shirt */
export const TSHIRT_DESIGNS = [
  { id: "a", name: "6 mafia", hint: "The landlord, 6ixty and bagmand." },
  { id: "b", name: "trykker bands", hint: "6ixty with the blood going up." },
  { id: "me", name: "custom", hint: "Your character on a blank shirt." },
] as const;
export type TshirtDesign = (typeof TSHIRT_DESIGNS)[number]["id"];
export const isTshirtDesign = (v: unknown): v is TshirtDesign => TSHIRT_DESIGNS.some((d) => d.id === v);

export interface TshirtOrder { design: TshirtDesign; name: string; email: string; phone: string; street: string; zip: string; city: string; country: string; size: TshirtSize }

const clean = (v: unknown, min: number, max: number, what: string): string => {
  const s = typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f<>]/g, "").replace(/\s+/g, " ").trim() : "";
  if (s.length < min) throw new Error(`Fill in ${what}.`);
  if (s.length > max) throw new Error(`${what[0].toUpperCase()}${what.slice(1)} is too long.`);
  return s;
};

/** checks what the player typed (the browser and the server both use it); throws a message that can be shown */
export function cleanTshirtOrder(raw: unknown): TshirtOrder {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  if (!isTshirtDesign(o.design)) throw new Error("Pick a design.");
  const size = String(o.size ?? "");
  if (!(TSHIRT_SIZES as readonly string[]).includes(size)) throw new Error("Pick a size.");
  const zip = clean(o.zip, 3, 10, "your postcode");
  if (!/^[A-Za-z0-9 -]{3,10}$/.test(zip)) throw new Error("That postcode doesn't look right.");
  const email = clean(o.email, 5, 100, "your email");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw new Error("That email doesn't look right.");
  const phone = clean(o.phone, 6, 20, "your phone number");
  if (!/^\+?[0-9 ()-]{6,20}$/.test(phone) || phone.replace(/\D/g, "").length < 6) throw new Error("That phone number doesn't look right.");
  return { design: o.design, name: clean(o.name, 3, 60, "your full name"), email, phone, street: clean(o.street, 4, 80, "your street and number"), zip, city: clean(o.city, 2, 50, "your city"), country: clean(o.country, 2, 40, "your country"), size: size as TshirtSize };
}
