// The texts the game server sends in English, with their Danish (made by scripts/danish-plugin.mjs).
declare module "virtual:da-server" {
  const pairs: Array<[string, string]>;
  export default pairs;
}
