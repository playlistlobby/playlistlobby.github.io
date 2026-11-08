// playlist.mag: the shop and projects pages start their data requests in the page head, before the scripts have even loaded
// (see the small inline script in each index.html). The page's own script picks the running request up here, once.
// If the request was for another API address than api.js has (e.g. while testing locally), it is ignored and the page asks again itself.
import { API_BASE } from "./api.js";
export function take(key) {
  const e = window.__early && window.__early[key];
  if (!e) return null;
  delete window.__early[key];
  return e.base === undefined || e.base === API_BASE ? e.p : null;
}
