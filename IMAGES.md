# Meenazo — image spec

Every image slot on the site: where the file goes, what size to export, and a
prompt you can paste into an AI image tool.

**Brand palette to keep in every prompt:** sage green `#5b8c6e`, mint `#eaf3ee`,
deep ink green `#1f2a24`, warm cream, gold accent `#e0a93f`.

**Add to the end of every prompt:**
`soft natural daylight, warm neutral background, muted sage-green and cream palette,
minimal props, shallow depth of field, premium wellness brand photography,
no text, no watermark, no logo, no lettering`

AI tools garble text and logos — always ask for none, then let the site render the
words over the image.

**Format:** export `.webp` (quality ~82) for photos. Falls back fine to `.jpg`.
Keep every file under ~250 KB; the hero under ~180 KB.

---

## 🔴 Priority 1 — do these first

### 1. Social share image (MISSING — nothing shows when the site is shared)

Right now a Meenazo link pasted into WhatsApp/Facebook/X shows **no preview
image**. This is the single highest-value image on the list.

| | |
|---|---|
| **Path** | `public/images/og-default.webp` |
| **Size** | **1200 × 630** (hard requirement — every platform crops to this) |
| **Note** | Keep the middle 1000×500 clear; edges get cropped on some apps. Tell me when it's in and I'll wire it into the metadata. |

> Prompt: A flat-lay of three amber glass Ayurvedic supplement bottles arranged on a
> cream linen surface, surrounded by dried tulsi leaves, ashwagandha root and a small
> brass bowl, generous empty space on the left third for text overlay, top-down view,
> soft natural daylight, warm neutral background, muted sage-green and cream palette,
> minimal props, shallow depth of field, premium wellness brand photography, no text,
> no watermark, no logo, no lettering

---

### 2. Hero art — 3 slides ⚠️ **now circle-cropped, must be SQUARE**

The hero was rebuilt: the art sits inside a **circular frame**. Old wide banners
will crop badly. Subject must be **centred with breathing room on all sides**.

| | |
|---|---|
| **Paths** | `public/images/banners/green.webp` · `immune.webp` · `strong.webp` |
| **Size** | **1200 × 1200 (1:1 square)** |
| **Crop** | Circle — keep the subject inside the middle 80%, nothing important in corners |

> **Slide 1 — everyday wellness**
> A relaxed Indian woman in her early 30s in a cream linen top, holding an amber
> supplement bottle at chest height, calm confident smile, soft green plants blurred
> behind her, centred square composition with space around the subject, soft natural
> daylight, warm neutral background, muted sage-green and cream palette, minimal props,
> shallow depth of field, premium wellness brand photography, no text, no watermark,
> no logo, no lettering

> **Slide 2 — immunity**
> A close-up of hands cupping fresh tulsi, giloy and amla around a small ceramic bowl
> of golden herbal powder, centred square composition, soft natural daylight, warm
> neutral background, muted sage-green and cream palette, minimal props, shallow depth
> of field, premium wellness brand photography, no text, no watermark, no logo, no lettering

> **Slide 3 — strength & vitality**
> An Indian man in his 30s in a plain sage-green t-shirt after a workout, towel over
> shoulder, holding a glass of herbal drink, warm calm expression, centred square
> composition, soft natural daylight, warm neutral background, muted sage-green and
> cream palette, minimal props, shallow depth of field, premium wellness brand
> photography, no text, no watermark, no logo, no lettering

---

### 3. Product photos ⚠️ **shoot these, don't generate them**

AI cannot reproduce your actual bottle shape, cap, or label artwork. A generated
"Slimpax" bottle would show a product you don't sell. **Photograph the real
bottles** — phone camera + window light + white sheet is genuinely enough.

| | |
|---|---|
| **Paths** | `public/images/Slimpax.jpg` · `Diasuddhi.jpg` · `joshveda.png` (existing) |
| **Add more as** | `slimpax-2.webp`, `slimpax-3.webp`, … (tell me and I'll wire the gallery) |
| **Size** | **1200 × 1200 (1:1)** |
| **Background** | Pure white or transparent PNG — cards render with `object-contain`, so a busy background looks wrong |
| **How many** | 4–5 per product: front label, back/ingredients, capsule detail, in-hand scale shot, lifestyle |

Each product currently has **exactly one image**, so the gallery and zoom on the
product page have nothing to show. This is the biggest content gap on the site.

**AI is fine for the lifestyle shot only** — hands, table, herbs, no visible bottle:

> A pair of hands placing a small unbranded amber glass bottle on a wooden table beside
> dried herbs and a linen cloth, bottle turned so no label is visible, soft natural
> daylight, warm neutral background, muted sage-green and cream palette, minimal props,
> shallow depth of field, premium wellness brand photography, no text, no watermark,
> no logo, no lettering

---

## 🟡 Priority 2 — visible on the homepage

### 4. Category tiles — 3 active

Rebuilt as **tall portrait tiles** with the label sitting on the art.

| | |
|---|---|
| **Paths** | `public/images/categories/diabetes.svg` · `weight-loss.svg` · `mens-health.svg` |
| **Size** | **900 × 1200 (3:4 portrait)** |
| **Note** | Bottom 40% gets a dark gradient for the label — keep faces/detail in the **upper two-thirds** |
| **Extension** | Code currently auto-points at `.svg`. Save as `.webp` and tell me — it's a one-line change in `data/categories.ts` |

> **Diabetes Care:** A bowl of fresh bitter gourd, jamun berries and gymnema leaves on
> a cream stone surface, vertical composition with the produce in the upper half, soft
> natural daylight, warm neutral background, muted sage-green and cream palette, minimal
> props, shallow depth of field, premium wellness brand photography, no text, no
> watermark, no logo, no lettering

> **Weight Loss:** A measuring tape coiled beside green tea leaves, garcinia fruit and
> triphala berries on a cream linen cloth, vertical composition with objects in the
> upper half, soft natural daylight, warm neutral background, muted sage-green and cream
> palette, minimal props, shallow depth of field, premium wellness brand photography,
> no text, no watermark, no logo, no lettering

> **Men's Health:** Ashwagandha root, safed musli and a dark shilajit resin jar arranged
> on a slate surface with a linen cloth, vertical composition with objects in the upper
> half, soft natural daylight, warm neutral background, muted sage-green and cream
> palette, minimal props, shallow depth of field, premium wellness brand photography,
> no text, no watermark, no logo, no lettering

---

### 5. Blog covers — 6 posts

| | |
|---|---|
| **Path** | `public/images/blog/` — **file name anything**, it is written out per post |
| **Size** | **1600 × 900 (16:9)** — cards crop to 16:10, post page uses 16:9 |
| **Slugs** | `ashwagandha-complete-guide` · `ayurvedic-herbs-blood-sugar` · `ayurvedic-weight-management` · `boost-immunity-ayurvedic-way` · `shatavari-for-women` · `understanding-your-dosha` |
| **Wiring** | Each post in `data/blog.ts` has its own `image: "/images/blog/<your-file>.webp"` line — drop the file in and point that line at it. No slug matching. |

> Template (swap the herb): A styled arrangement of **{ashwagandha root / jamun and bitter
> gourd / green tea and garcinia / tulsi and giloy / shatavari root / five ayurvedic herbs
> in small bowls}** on a cream linen surface with a mortar and pestle, wide horizontal
> composition, soft natural daylight, warm neutral background, muted sage-green and cream
> palette, minimal props, shallow depth of field, premium wellness brand photography,
> no text, no watermark, no logo, no lettering

---

### 6. Instagram grid — 6 tiles

| | |
|---|---|
| **Path** | `public/images/instagram/ig1.svg` … `ig6.svg` |
| **Size** | **800 × 800 (1:1)** |
| **Best** | Use your **real Instagram posts** — a fake feed that doesn't match your account looks off the moment someone clicks through |

---

## 🟢 Priority 3 — About / Contact

### 7. About page

| Slot | Path (new) | Size |
|---|---|---|
| Story image | `public/images/about/story.webp` | **1600 × 1200 (4:3)** |
| Values / mission | `public/images/about/values.webp` | **1000 × 1000 (1:1)** |

> A traditional Indian herbal apothecary workspace — brass scales, glass jars of dried
> herbs, a mortar and pestle on a worn wooden table, warm and authentic, soft natural
> daylight, warm neutral background, muted sage-green and cream palette, minimal props,
> shallow depth of field, premium wellness brand photography, no text, no watermark,
> no logo, no lettering

### 8. Contact page banner

| | |
|---|---|
| **Path** | `public/images/contact/office.webp` |
| **Size** | **1600 × 900 (16:9)** |

---

## ⛔ Do NOT generate these

These three slots take **real** photos or nothing. Generating them creates
fabricated evidence for a health product — that is an ASCI / Drugs & Magic
Remedies Act problem in India, not just an ethics one.

| Slot | Why | What to do instead |
|---|---|---|
| **Before / after** (`public/images/before-after/ba1-before.png` …, 800 × 1200) | AI "results" are invented proof of efficacy for a medicine | Real, consented customer photos with dates — or delete the section (say the word, I'll remove it) |
| **Doctor photo** (`public/images/team/dp.webp`, 400 × 400) | "Dr. Ananya Sharma, BAMS" currently has a placeholder. An AI face for a doctor who doesn't exist is a fake medical endorsement | Real advisor's photo + real name/registration — or remove the section |
| **Customer review faces** | Fabricated reviewer identities | Keep the current emoji/initial avatars, or use real consented photos |

---

## The 6 shot types used on this site

Every slot below is one of these. Getting the *type* right matters more than the
prompt wording — a packshot where a lifestyle shot belongs looks wrong no matter
how good the image is.

| Type | What it is | Where it works | Rules |
|---|---|---|---|
| **A · Lifestyle portrait** | A real person using or holding the product, looking natural | Hero | Subject centred, eye contact or calm downward gaze, product held at chest height, plenty of empty space around them |
| **B · Flat-lay** | Shot straight down onto a surface, objects arranged | Social share, blog covers | Top-down only (no angle), leave one third empty for text |
| **C · Packshot** | The product alone, cleanly lit, no distractions | Product gallery | Pure white or transparent background, product fills ~80% of frame, no shadows on the backdrop |
| **D · Ingredient still-life** | Raw herbs, roots, powders, bowls — no packaging at all | Category tiles, blog | Detail in the **upper two-thirds** for portrait tiles (bottom gets a dark gradient) |
| **E · Environment / documentary** | A place and its texture — workspace, shelves, hands working | About, contact | Feels unposed; wide enough to read the room |
| **F · Headshot** | One person, shoulders up, plain background | Doctor, team | Real people only — never generated |

---

## Cheat sheet

| Slot | Type | Size | Ratio |
|---|---|---|---|
| Social share (og) | **B** flat-lay | 1200 × 630 | 1.91:1 |
| Hero slide 1 | **A** lifestyle portrait | 1200 × 1200 | 1:1 ⬅ **changed** |
| Hero slide 2 | **D** ingredient still-life | 1200 × 1200 | 1:1 |
| Hero slide 3 | **A** lifestyle portrait | 1200 × 1200 | 1:1 |
| Product — main | **C** packshot | 1200 × 1200 | 1:1 |
| Product — back / capsule detail | **C** packshot | 1200 × 1200 | 1:1 |
| Product — in-hand / lifestyle | **A** lifestyle | 1200 × 1200 | 1:1 |
| Category tiles ×3 | **D** ingredient still-life | 900 × 1200 | 3:4 |
| Blog covers ×6 | **B** or **D** | 1600 × 900 | 16:9 |
| Instagram ×6 | **A** lifestyle (real posts) | 800 × 800 | 1:1 |
| About story | **E** environment | 1600 × 1200 | 4:3 |
| About values | **D** or **E** | 1000 × 1000 | 1:1 |
| Contact banner | **E** environment | 1600 × 900 | 16:9 |
| Before/after ×3 pairs | real photos only | 800 × 1200 | 2:3 |
| Doctor avatar | **F** headshot (real) | 400 × 400 | 1:1 |

**Which ones AI can do:** A, B, D, E — as long as no branded packaging is visible.
**Which ones it can't:** C (your real bottle and label) and F (a real person).

**When the files are ready:** drop them in the paths above and tell me. I'll wire
the extensions, add the social-share metadata, and switch the product page to a
multi-image gallery.
