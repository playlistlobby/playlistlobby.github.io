// The dark web (a tab of the hideout computer): big orders the whole hideout fills together, shipped before 21:00 Danish time. For now two orders a day, the same every day, paid 1.5 times what the same drugs are worth.
// Pure data: the browser and the server both use it. The progress of a hideout is at darkweb/<owner>/<dayKey>/<orderId> (only the server writes it):
//   { got: { <item>: <how many the hideout has handed in> }, by: { <uid>: <how many items that member handed in> }, done?: true }
import { sellPrice } from "./items";
import { BAGMAND_SELL } from "./bagmand";
import { danishParts } from "./streets";

export interface DwLine { item: string; qty: number }
export interface DwOrder { id: string; title: string; lines: DwLine[] }
/** the dark web pays this much of what the same thing is worth (6ixty's price) */
export const DW_MULT = 1.5;
/** the orders have to be shipped before this hour (Danish time) every day */
export const DW_DEADLINE_HOUR = 21;
export const DW_ORDERS: DwOrder[] = [
  // fentanyl, cali weed blunts and 2cb (the drug made of opium and a shroom): about 2,700 blood in all
  { id: "a", title: "The big shipment", lines: [{ item: "fentcn", qty: 3 }, { item: "blunt_cali", qty: 1 }, { item: "twocb", qty: 3 }] },
  // 25 chud blunts and a ketamine: 750 + 255
  { id: "b", title: "The chud order", lines: [{ item: "blunt_chud", qty: 25 }, { item: "ketamine", qty: 1 }] },
];
/**
 * What an item is worth before the dark web adds its half: what 6ixty pays for it; for the things only bagmand buys (the opium drugs) what bagmand pays; a blunt rolled from
 * one of those is that plus the blunt wrap (2), which is how the other rolled things are priced.
 */
export const dwBase = (item: string): number => sellPrice(item) ?? BAGMAND_SELL[item] ?? (item.startsWith("blunt_") && BAGMAND_SELL[`${item.slice(6)}weed`] !== undefined ? BAGMAND_SELL[`${item.slice(6)}weed`] + 2 : 0);
/** what one of an item pays when it is handed in: 1.5 times its worth, rounded up */
export const dwUnitPay = (item: string): number => Math.ceil(dwBase(item) * DW_MULT);
/** what a whole order pays when it is filled */
export const dwTotal = (o: DwOrder): number => o.lines.reduce((n, l) => n + dwUnitPay(l.item) * l.qty, 0);
/** is the dark web open (before the deadline today), and how many ms are left */
export function dwOpen(now: number): { open: boolean; leftMs: number } {
  const p = danishParts(now);
  const into = (DW_DEADLINE_HOUR - p.h) * 3600 - p.mi * 60 - p.s;
  return { open: into > 0, leftMs: Math.max(0, into * 1000) };
}
export interface DwProgress { got?: Record<string, number>; by?: Record<string, number>; done?: boolean }
export const dwLeft = (o: DwOrder, p: DwProgress | null | undefined, item: string): number => Math.max(0, (o.lines.find((l) => l.item === item)?.qty ?? 0) - (Number(p?.got?.[item]) || 0));
export const dwFilled = (o: DwOrder, p: DwProgress | null | undefined): boolean => o.lines.every((l) => dwLeft(o, p, l.item) === 0);
