# thoughts 'n' feelings

> *"i have only really done things with html and i havent even given it any structure  
> well i dont really know if i want to right now, but we will see to that  
> one thing i do wanna do is that i want to make this pretty with css so we will be DOING THAT SHIT FRFR"*  
> — Original Repository Manifesto

---

A fully responsive, highly polished interactive website styled with an immersive **retro-futuristic ASCII art and book-like aesthetic**. Designed as an infinite-scroll continuous digital codex and journal where vertical parchment sheets fold, crease, and reveal spine borders as you traverse through thoughts, feelings, and philosophical inscriptions.

---

### Tech Stack & Architecture:

- **Scroll Momentum Engine:** [Lenis](https://github.com/darkroomengineering/lenis) smooth scrolling synchronized directly with the GSAP ticker for weighted momentum.
- **Physics & Motion:** [GSAP 3](https://greensock.com/gsap/) + [ScrollTrigger](https://greensock.com/scrolltrigger/) orchestrating chapter unfolds, accordion folio expansions, decrypt text scrambles, and smooth viewport reveals.
- **Background Atmosphere:** [Vanta.js](https://www.vantajs.com/) 3D Net ([Three.js](https://threejs.org/)) overlaid with a custom **real-time Canvas ASCII Matrix Shader** responding dynamically to mouse coordinates and scroll velocity.
- **Interactive Micro-Interactions (React.bit style):**
  - Spotlight cursor tracking glow
  - Scramble / decrypt typewriter text reveals on hover
  - Foldable / expandable GSAP accordion folio sheets with spine crease markers
  - Interactive Web Audio API synthesizer for mechanical typewriter clicks and low-frequency warm CRT ambient hum (zero external audio files needed)
  - Interactive "Inscribe Folio" terminal modal with live ASCII preview, `localStorage` persistence, and instant JSON / Markdown codex export
  - Phosphor CRT scanlines, flicker, and curvature toggle
  - Palette themes: Parchment Gold, Emerald Mainframe, Amber DEC VT220, Cyber Cyan

---

### Getting Started

To run locally in development mode:

```bash
npm run dev
```

To build for production:

```bash
npm run build
```

To preview the production build:

```bash
npm run preview
```

---

### Inscribed Thoughts & Authors:
- **absurdharsh** ([Instagram](https://www.instagram.com/absurdnigga))
- **Ishika's Theorem** on the trophic chain of consumption
- **Clare Harner** (*"Do not stand at my grave and weep"*, 1934)
