// The pets the pet merchant sells (made by scripts/bake-pets.mjs from Habbo's pet libraries): name -> how many colours it comes in.
// A pet's price is between 1000 and 2000 blood, from its name.
export const PET_COLORS: Record<string, number> = {
  "bear": 4,
  "bearbaby": 20,
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
  "spider": 18,
  "terrier": 7,
  "terrierbaby": 20,
  "turtle": 12,
  "velociraptor": 20
};
export const PET_TYPES: string[] = Object.keys(PET_COLORS);
export const petPrice = (type: string): number => {
  let h = 0;
  for (let i = 0; i < type.length; i++) h = (h * 31 + type.charCodeAt(i)) >>> 0;
  return 1000 + (h % 11) * 100;
};
