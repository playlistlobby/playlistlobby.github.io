// The dark web (a tab of the hideout computer): big orders the whole hideout fills together. For now two orders a day, the same every day.
// Pure data: the browser and the server both use it. The progress of a hideout is at darkweb/<owner>/<dayKey>/<orderId> (only the server writes it):
//   { got: { <item>: <how many the hideout has handed in> }, by: { <uid>: <how many items that member handed in> }, done?: true }
import { sellPrice } from "./items";
import { BAGMAND_SELL } from "./bagmand";

export interface DwLine { item: string; qty: number }
export interface DwOrder { id: string; title: string; lines: DwLine[] }
/** the dark web pays this much of what 6ixty pays for the same thing */
export const DW_MULT = 1.5;
export const DW_ORDERS: DwOrder[] = [
  // fentanyl, cali weed blunts and 2cb (the drug made of opium and a shroom)
  { id: "a", title: "The big shipment", lines: [{ item: "fentcn", qty: 15 }, { item: "blunt_cali", qty: 5 }, { item: "twocb", qty: 6 }] },
  { id: "b", title: "The chud order", lines: [{ item: "blunt_chud", qty: 10 }] },
];
/**
 * What an item is worth before the dark web adds its half: what 6ixty pays for it; for the things only bagmand buys (the opium drugs) what bagmand pays; a blunt rolled from
 * one of those is that plus the blunt wrap (2), which is how the other rolled things are priced.
 */
export const dwBase = (item: string): number => sellPrice(item) ?? BAGMAND_SELL[item] ?? (item.startsWith("blunt_") && BAGMAND_SELL[`${item.slice(6)}weed`] !== undefined ? BAGMAND_SELL[`${item.slice(6)}weed`] + 2 : 0);
/** what one of an item pays when it is handed in (1.5 times its worth, rounded up) */
export const dwUnitPay = (item: string): number => Math.ceil(dwBase(item) * DW_MULT);
export interface DwProgress { got?: Record<string, number>; by?: Record<string, number>; done?: boolean }
export const dwLeft = (o: DwOrder, p: DwProgress | null | undefined, item: string): number => Math.max(0, (o.lines.find((l) => l.item === item)?.qty ?? 0) - (Number(p?.got?.[item]) || 0));
export const dwFilled = (o: DwOrder, p: DwProgress | null | undefined): boolean => o.lines.every((l) => dwLeft(o, p, l.item) === 0);
