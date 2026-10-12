import { h, toast } from "./dom";
import { Gender, randomFigure } from "../catalog";
import { renderAvatar } from "../avatarService";
import { saveFigure } from "../db";
import { logAction } from "../logger";
import { playSfx } from "../sfx";
import { createRoom, defFromTemplate, ROOM_TEMPLATES, RoomTemplate } from "../rooms";
import { ensureTextures, renderRoomPreview } from "../roomRender";
import type { Ctx } from "../main";

/**
 * First run: step 1 choose an avatar (a randomizer over the free clothes, plus a boy/girl tab), step 2 choose one of three rooms.
 * Each step only shows up if it's still needed, so a player who quit half way carries on where they stopped.
 * Resolves once the player has an avatar and a room; the caller then drops them into their room.
 */
export function runOnboarding(region: HTMLElement, ctx: Ctx, needAvatar: boolean, needRoom: boolean): Promise<void> {
  return new Promise((resolve) => {
    let step: "avatar" | "room" = needAvatar ? "avatar" : "room";
    let disposed = false;

    const page = h("div", { class: "onb" });
    region.replaceChildren(page);

    const stepDots = (n: 1 | 2) =>
      h("div", { class: "onb-steps", "aria-label": `Step ${n} of 2` }, h("span", { class: n === 1 ? "on" : "" }), h("span", { class: n === 2 ? "on" : "" }));

    // ---- step 1: avatar ----------------------------------------------------------------------------
    function showAvatar(): void {
      const profile = ctx.profile;
      let gender: Gender = profile.gender;
      let figure = randomFigure(gender);
      let dir = 2;
      let token = 0;
      const canvas = h("canvas", { class: "onb-avatar", width: 64, height: 110 });
      const genderEl = h("div", { class: "seg onb-gender" });
      const next = h("button", { class: "btn primary onb-next" }, "Next: pick your room");

      function draw(): void {
        const mine = ++token;
        renderAvatar({ figure, dir, headDir: dir }).then((img) => {
          if (disposed || mine !== token || !img) return;
          const c = canvas.getContext("2d")!;
          c.clearRect(0, 0, canvas.width, canvas.height);
          c.drawImage(img, 0, 0);
        });
      }
      function renderGender(): void {
        genderEl.replaceChildren(...(["M", "F"] as Gender[]).map((g) =>
          h("button", {
            class: "tab" + (gender === g ? " on" : ""),
            onclick: () => {
              if (gender === g) return;
              gender = g;
              figure = randomFigure(g);
              renderGender();
              draw();
            },
          }, g === "M" ? "Boy" : "Girl")));
      }
      next.addEventListener("click", async () => {
        next.setAttribute("disabled", "");
        try {
          await saveFigure(profile, figure, gender);
          logAction(profile, "look", "created their character");
          playSfx("camera", 0.35);
          if (needRoom) { step = "room"; show(); } else finish();
        } catch (err) {
          toast((err as Error).message || "Couldn't save your avatar.", "err");
          next.removeAttribute("disabled");
        }
      });
      if (!needRoom) next.textContent = "Done";

      page.replaceChildren(
        h("div", { class: "onb-card" },
          h("div", { class: "onb-head" }, h("h1", {}, "Choose your avatar"), needRoom ? stepDots(1) : null),
          h("p", { class: "muted onb-sub" }, `Hi ${profile.name}! Shuffle until you like what you see. You can change everything later in Character.`),
          genderEl,
          h("div", { class: "onb-stage" }, canvas),
          h("div", { class: "row center onb-tools" },
            h("button", { class: "btn small", title: "Turn left", onclick: () => { dir = (dir + 7) % 8; draw(); } }, "⟲"),
            h("button", { class: "btn onb-dice", onclick: () => { figure = randomFigure(gender); draw(); } }, "🎲 Randomize"),
            h("button", { class: "btn small", title: "Turn right", onclick: () => { dir = (dir + 1) % 8; draw(); } }, "⟳")),
          next));
      renderGender();
      draw();
    }

    // ---- step 2: room ------------------------------------------------------------------------------
    function showRoom(): void {
      const profile = ctx.profile;
      let chosen: RoomTemplate | null = null;
      const cards = new Map<string, HTMLElement>();
      const go = h("button", { class: "btn primary onb-next", disabled: true }, "Choose a room first");

      const list = h("div", { class: "onb-rooms" }, ...ROOM_TEMPLATES.map((tpl) => {
        const preview = h("div", { class: "onb-room-preview" }, h("span", { class: "muted" }, "…"));
        const card = h("button", {
          class: "onb-room",
          type: "button",
          onclick: () => {
            chosen = tpl;
            cards.forEach((c, id) => c.classList.toggle("on", id === tpl.id));
            go.removeAttribute("disabled");
            go.textContent = `Move into ${tpl.name}`;
          },
        }, preview, h("div", { class: "onb-room-name" }, tpl.name), h("div", { class: "hint" }, `${tpl.w}×${tpl.h} · ${tpl.blurb}`));
        cards.set(tpl.id, card);
        const def = defFromTemplate(tpl, { uid: profile.uid, name: profile.name });
        void ensureTextures(def.theme).then(() => {
          if (disposed || !preview.isConnected) return;
          preview.replaceChildren(renderRoomPreview(def, 300));
        });
        return card;
      }));

      go.addEventListener("click", async () => {
        if (!chosen) return;
        go.setAttribute("disabled", "");
        try {
          await createRoom(profile, chosen);
          logAction(profile, "room", `set up their room (${chosen.name})`);
          playSfx("camera", 0.35);
          finish();
        } catch (err) {
          toast((err as Error).message || "Couldn't create your room.", "err");
          go.removeAttribute("disabled");
        }
      });

      page.replaceChildren(
        h("div", { class: "onb-card wide" },
          h("div", { class: "onb-head" }, h("h1", {}, "Choose your room"), needAvatar ? stepDots(2) : null),
          h("p", { class: "muted onb-sub" }, "This is your space. You'll start here every time you log in, and you can redecorate it later. The door on the wall takes you to the public room and to other players' rooms."),
          list,
          h("div", { class: "row center" },
            needAvatar ? h("button", { class: "btn", onclick: () => { step = "avatar"; show(); } }, "Back") : null,
            go)));
    }

    function show(): void {
      if (step === "avatar") showAvatar();
      else showRoom();
    }

    function finish(): void {
      disposed = true;
      resolve();
    }

    show();
  });
}

