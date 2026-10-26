// The pets the pet merchant sells (made by scripts/bake-pets.mjs from Habbo's pet libraries): name -> how many colours it comes in.
// A pet's price is between 1000 and 2000 blood, from its name (half or double for some: see PET_PRICE_MULT).
export const PET_COLORS: Record<string, number> = {
  "bear": 4,
  "bunnydepressed": 0,
  "bunnyeaster": 5,
  "bunnyevil": 0,
  "bunnylove": 0,
  "cat": 25,
  "chicken": 5,
  "croco": 1,
  "curseddragon": 3,
  "demonmonkey": 1,
  "dog": 25,
  "dragon": 11,
  "dragondog": 5,
  "frog": 19,
  "haloompa": 10,
  "kittenbaby": 21,
  "lion": 13,
  "monkey": 15,
  "pig": 7,
  "pigeonevil": 0,
  "pigeongood": 0,
  "pigletbaby": 21,
  "puppybaby": 21,
  "rhino": 8,
  "terrier": 7,
  "turtle": 12,
  "velociraptor": 20
};
export const PET_TYPES: string[] = Object.keys(PET_COLORS);
/** some pets are half price, some cost twice as much (the rest are as they come: 1000 to 2000) */
export const PET_PRICE_MULT: Record<string, number> = {
  chicken: 0.5, pigeongood: 0.5, pigeonevil: 0.5, frog: 0.5, turtle: 0.5, bunnydepressed: 0.5, kittenbaby: 0.5,
  dragon: 2, curseddragon: 2, lion: 2, velociraptor: 2, demonmonkey: 2, dragondog: 2, rhino: 2,
};
export const petPrice = (type: string): number => {
  let h = 0;
  for (let i = 0; i < type.length; i++) h = (h * 31 + type.charCodeAt(i)) >>> 0;
  return Math.round(((1000 + (h % 11) * 100) * (PET_PRICE_MULT[type] ?? 1)) / 50) * 50;
};
