// The blue notice board in the basement (the Discord): the admin writes a title, a text and a link; everybody signed in reads discordBoard (rules), only this writes it.
import { Action } from "./util";
import { fail } from "../ctx";

const TITLE_MAX = 30, TEXT_MAX = 400, LINK_MAX = 200;

export const boardSet: Action = {
  async run(c, a) {
    if (!c.isAdmin) fail("Unknown action.");
    const title = String(a.title ?? "").replace(/\s+/g, " ").trim();
    const text = String(a.text ?? "").replace(/\r\n?/g, "\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
    const link = String(a.link ?? "").trim();
    if (title.length > TITLE_MAX) fail(`The title can be ${TITLE_MAX} letters at most.`);
    if (text.length > TEXT_MAX) fail(`The text can be ${TEXT_MAX} letters at most.`);
    if (/[\u0000-\u0009\u000b-\u001f\u007f]/.test(title + text + link)) fail("Bad text.");
    if (link && (link.length > LINK_MAX || !/^https?:\/\/[^\s<>"']{3,}$/i.test(link))) fail("The link has to start with https:// and can't have spaces.");
    c.extra["discordBoard"] = title || text || link ? { title, text, link, at: c.now, by: c.uid } : null;
    c.note = "wrote on the notice board";
    return {};
  },
};
