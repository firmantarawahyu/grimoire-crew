---
inclusion: fileMatch
fileMatchPattern: ["packages/ui/**", "apps/web/**", "apps/crew-app/**"]
---

# Alchemist UI and Procedural Audio

## Visual direction

- 2D only: React, an `@xyflow/react` canvas, animated SVG, and CSS effects. No Three.js, WebGL, game engines, or Rust/GPUI.
- Theme: a dark alchemy grimoire. Parchment on ink, warm candlelight gold, arcane cyan and violet accents, blood red for breaches. Avoid the generic purple-gradient "AI" look.
- Styling: Tailwind CSS v4 with design tokens as CSS variables, shadcn/ui (Radix) primitives, Lucide icons.
- Tokens live in `packages/ui/src/styles.css`: the `--gc-*` palette plus shadcn's semantic variables mapped onto it. Use semantic classes (`bg-primary`, `text-muted-foreground`) or the palette classes (`text-candle`, `bg-arcane`), never raw hex values in components.
- Tailwind class detection is off by default (`source(none)`). Each stylesheet lists its own folders with `@source`. A new folder with components needs its own `@source` line, or its classes silently disappear.
- `packages/ui/src/styles.css` has no preflight reset. Only `apps/web` adds it, because the Crew bundle must not restyle the Crew dashboard. Wrap app pages in the `gc-root` class.
- Layout, three columns:
  - Left: Grimoire Palette (existing Kiro state, presets, core nodes).
  - Center: Living Rune Canvas, with mana pulses along active edges and a shield-deflect effect when a ward blocks.
  - Right: Vesper chat, Node Inspector, and the live Work Ledger and output.
- Header candlelight status:

  | State | Look |
  |---|---|
  | Idle | Warm gold flicker |
  | Conductor active | Cyan and violet glow |
  | Curse breach | Red with a subtle shake |

## Procedural audio (WebAudio API)

- All sound is synthesized at runtime from oscillators, noise buffers, and filters. No MP3, WAV, or OGG assets.
- Ambience: a soft hearth crackle and a rain bed, at low volume.
- Event cues: `agent_thinking`, `tool_called`, `ward_blocked`, `curse_breached`, `ritual_complete`. Each cue is shorter than one second and has a distinct pitch and timbre.
- Audio starts muted. Create or resume the `AudioContext` only after the first user gesture (browser autoplay policy). Provide a mute toggle and a volume slider, and remember the choice in `localStorage`.
- Use one shared `AudioContext` and disconnect nodes when a cue ends, so nothing leaks.

## Performance budget

- Target 60 fps and roughly 50 to 80 MB of RAM with a 30-node graph.
- Animate only `transform` and `opacity`. Prefer CSS animations to per-frame JavaScript. Pause decorative animation while the tab is hidden.
- Code-split heavy views such as the code inspector and ZIP export.

## Accessibility

- `prefers-reduced-motion: reduce` turns off shake, pulses, and flicker; static state colors remain.
- Every action is reachable by keyboard with a visible focus ring. Canvas nodes can be selected and moved from the keyboard.
- Text contrast meets WCAG AA (4.5:1) on the dark theme. State is never shown by color alone; pair colors with an icon or a label.
- Sound is never the only signal for an event.

## Kiro Crew host

- Inside `apps/crew-app`, follow the host theme from `useTheme()` and use `@kirocrew/app-sdk/ui` primitives where they fit, so the page feels native in the Crew dashboard.
