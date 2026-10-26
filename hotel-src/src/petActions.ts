import { call } from "./db";
import type { Profile } from "./db";

export const buyPet = (p: Profile, type: string): Promise<{ type: string; palette: number; price: number }> => call(p, "petBuy", { type });
/** a pet in the pocket walks with you from now on */
export const releasePet = (p: Profile, slot: number): Promise<{ look: string }> => call(p, "petRelease", { slot });
/** the pet that walks with you goes back into the pocket */
export const pickUpPet = (p: Profile): Promise<unknown> => call(p, "petPickup", {});
