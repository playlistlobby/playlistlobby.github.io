// The pets the pet merchant sells (made by scripts/bake-pets.mjs from Habbo's pet libraries): name -> how many colours it comes in.
// A pet's price is between 1000 and 2000 blood, from its name.
export const PET_COLORS: Record<string, number> = {
  "bear": 4,
  "bearbaby": 0,
  "bunnydepressed": 0,
  "bunnyeaster": 0,
  "bunnyevil": 0,
  "bunnylove": 0,
  "cat": 25,
  "chicken": 0,
  "cow": 0,
  "croco": 1,
  "curseddragon": 0,
  "demonmonkey": 0,
  "dog": 25,
  "dragon": 0,
  "dragondog": 0,
  "fools": 0,
  "frog": 0,
  "gnome": 0,
  "haloompa": 0,
  "horse": 0,
  "kittenbaby": 0,
  "lion": 13,
  "monkey": 0,
  "monster": 0,
  "monsterplant": 0,
  "pig": 7,
  "pigeonevil": 0,
  "pigeongood": 0,
  "pigletbaby": 0,
  "pterosaur": 0,
  "puppybaby": 0,
  "rhino": 8,
  "spider": 0,
  "terrier": 7,
  "terrierbaby": 0,
  "turtle": 0,
  "velociraptor": 0
};
export const PET_TYPES: string[] = Object.keys(PET_COLORS);
export const petPrice = (type: string): number => {
  let h = 0;
  for (let i = 0; i < type.length; i++) h = (h * 31 + type.charCodeAt(i)) >>> 0;
  return 1000 + (h % 11) * 100;
};
