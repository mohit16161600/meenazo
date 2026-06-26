import type { BlogPost } from "@/types";

/**
 * Each article has its own hand-written body. We keep the HTML simple (p, h2,
 * h3, ul/ol, blockquote, strong, a) because <ArticleBody> styles those tags
 * directly (no @tailwindcss/typography).
 */

export const blogPosts: BlogPost[] = [
  {
    id: "b1",
    title: "Ashwagandha 101: The Complete Guide to the King of Adaptogens",
    slug: "ashwagandha-complete-guide",
    excerpt:
      "Everything you need to know about Ashwagandha — its benefits, the science behind KSM-66®, how much to take and how to add it to your routine.",
    content: `
<p>If there is one Ayurvedic herb that has crossed over into mainstream wellness, it's Ashwagandha. Walk into any pharmacy today and you'll find it on the shelf next to the multivitamins. But most people buy it without knowing what it actually does — or how to tell a good one from a useless one.</p>
<p>This guide cuts through the noise. Here's what Ashwagandha is, what the research really says, and how to use it sensibly.</p>

<h2>What is Ashwagandha?</h2>
<p><strong>Withania somnifera</strong> — Ashwagandha — has been used in Ayurveda for over 3,000 years as a <em>rasayana</em>, a rejuvenating tonic. The Sanskrit name roughly translates to "smell of a horse", a nod to both its earthy aroma and the strength it was traditionally believed to impart.</p>
<p>In modern terms, it's classed as an <strong>adaptogen</strong>: a plant that helps the body resist and adapt to stress, rather than acting like a stimulant or a sedative.</p>

<h2>What the research actually shows</h2>
<p>Ashwagandha is one of the better-studied herbs in Ayurveda. Human trials — small, but growing — point to a few consistent themes:</p>
<ul>
  <li><strong>Stress and cortisol:</strong> several placebo-controlled studies report meaningful reductions in perceived stress and morning cortisol.</li>
  <li><strong>Sleep quality:</strong> participants often fall asleep faster and report more restful sleep, which is why we suggest taking it at night.</li>
  <li><strong>Strength and recovery:</strong> trials in active adults show modest gains in muscle strength and recovery when paired with resistance training.</li>
</ul>
<p>It is not a miracle pill, and anyone promising overnight results is selling hype. Think of it as a steady, cumulative support — most people notice the difference around week three or four.</p>

<h2>Why "KSM-66®" matters</h2>
<p>Here's the part the label rarely explains. The strength of any herbal supplement depends on its <strong>extract</strong>, not just the herb. KSM-66® is a branded, full-spectrum root extract standardised to a high concentration of withanolides — the active compounds — using a water-based process that avoids alcohol or chemical solvents.</p>
<blockquote>The herb on the label means little. The extract — the part, the potency, the standardisation — is what determines whether it works.</blockquote>
<p>When you compare supplements, look for root-only extracts (not leaf), a stated withanolide percentage, and third-party testing.</p>

<h2>How to take it</h2>
<ol>
  <li><strong>Dose:</strong> most clinical studies use 300–600 mg of a standardised root extract per day.</li>
  <li><strong>Timing:</strong> if you're using it for sleep and stress, take it in the evening with warm milk or water — the classic Ayurvedic pairing.</li>
  <li><strong>Consistency:</strong> give it 4–6 weeks. Adaptogens work on your baseline, not your afternoon.</li>
</ol>

<h2>Who should be careful</h2>
<p>Ashwagandha is generally well tolerated, but skip it or check with a doctor first if you're pregnant, have a thyroid condition, take sedatives, or have an autoimmune disorder. It's a tonic, not a free-for-all.</p>

<p>Used well, Ashwagandha is one of the most reliable tools Ayurveda offers a stressed, under-slept modern life. Choose a properly standardised extract, be consistent, and let it do its quiet work.</p>
`,
    emoji: "🌿",
    gradient: ["#eaf3ee", "#cfe6d8"],
    category: "Herbs",
    author: "Dr. Ananya Sharma",
    authorAvatar: "👩‍⚕️",
    date: "2026-06-10",
    readTime: "7 min read",
    tags: ["ashwagandha", "adaptogen", "stress", "sleep"],
    seoTitle: "Ashwagandha 101: Complete Guide to Benefits & Dosage | Meenazo",
    seoDescription:
      "A complete, doctor-written guide to Ashwagandha — benefits, KSM-66® science, dosage and how to build it into your daily routine.",
  },
  {
    id: "b2",
    title: "5 Ayurvedic Herbs to Naturally Support Healthy Blood Sugar",
    slug: "ayurvedic-herbs-blood-sugar",
    excerpt:
      "From Gymnema to Jamun, the time-tested herbs Ayurveda uses to support healthy blood-sugar metabolism — and how to use them alongside your diet.",
    content: `
<p>Blood sugar is a daily balancing act, and Ayurveda has been thinking about it for a very long time. The classical texts describe <em>Madhumeha</em> — literally "honey urine" — and prescribe a combination of diet, movement and specific herbs to support healthy metabolism.</p>
<p>None of these replace your prescribed medication. But as everyday support alongside a sensible diet, these five herbs have earned their place.</p>

<h2>1. Gymnema (Gurmar) — the "sugar destroyer"</h2>
<p>The Hindi name <strong>Gurmar</strong> literally means "sugar destroyer". Chew a fresh leaf and, remarkably, sweet food briefly tastes like nothing — the compound gymnemic acid temporarily blocks sweet receptors on the tongue. Traditionally it's used to support healthy glucose absorption and reduce sugar cravings.</p>

<h2>2. Jamun (Indian Blackberry)</h2>
<p>The seed of the jamun fruit is a monsoon-season staple in Indian households for a reason. Jamun seed powder is one of the most commonly used Ayurvedic supports for healthy blood-sugar metabolism, and it's cheap and widely available.</p>

<h2>3. Bitter Gourd (Karela)</h2>
<p>Nobody loves the taste — that's rather the point. In Ayurveda, the bitter (<em>tikta</em>) taste is associated with balancing Kapha and supporting metabolism. A small glass of fresh karela juice on an empty stomach is a traditional morning ritual.</p>

<h2>4. Fenugreek (Methi)</h2>
<p>Soak a teaspoon of methi seeds overnight, drink the water in the morning, and chew the softened seeds. The soluble fibre slows the absorption of sugars, which helps smooth out the spikes after a meal.</p>

<h2>5. Turmeric (Haldi)</h2>
<p>Curcumin, turmeric's headline compound, is studied mainly for its anti-inflammatory action — and chronic low-grade inflammation is tightly linked to metabolic health. Pair it with a pinch of black pepper, which dramatically improves absorption.</p>

<blockquote>Herbs support the work; they don't replace it. Diet, movement and sleep do the heavy lifting.</blockquote>

<h2>Putting it together</h2>
<ul>
  <li>Start your day with soaked methi or a little karela juice.</li>
  <li>Walk for 15 minutes after your largest meal — one of the most effective things you can do.</li>
  <li>Use a standardised supplement when you want consistent dosing rather than guessing with raw powders.</li>
</ul>

<h2>A word of caution</h2>
<p>If you're already on blood-sugar medication, these herbs can add to its effect. That's not necessarily bad, but it means you should monitor your readings and talk to your doctor before combining them — never stop prescribed treatment on your own.</p>

<p>Used thoughtfully and consistently, this Ayurvedic toolkit is a gentle, time-tested companion to a healthy metabolic routine.</p>
`,
    emoji: "🩸",
    gradient: ["#eaf3ee", "#dceee4"],
    category: "Diabetes",
    author: "Dr. Rohan Mehta",
    authorAvatar: "👨‍⚕️",
    date: "2026-05-28",
    readTime: "6 min read",
    tags: ["diabetes", "blood sugar", "gymnema", "herbs"],
  },
  {
    id: "b3",
    title: "The Ayurvedic Guide to Sustainable Weight Management",
    slug: "ayurvedic-weight-management",
    excerpt:
      "Forget crash diets. How Ayurveda approaches metabolism, digestion (Agni) and weight that actually stays off.",
    content: `
<p>Most diets fail for the same reason: they treat weight as a maths problem and ignore the person doing the maths. Ayurveda takes the opposite view. Before it talks about food, it talks about <strong>Agni</strong> — your digestive fire — and the simple idea that <em>you are not what you eat, you are what you digest</em>.</p>

<h2>Start with Agni, not the scale</h2>
<p>When Agni is strong, food is broken down cleanly and turned into nourishment. When it's weak or erratic, even healthy food turns into <em>ama</em> — a sticky metabolic residue Ayurveda blames for sluggishness, bloating and stubborn weight. So the first move isn't eating less; it's digesting better.</p>

<h2>Five habits that actually move the needle</h2>
<ol>
  <li><strong>Make lunch your largest meal.</strong> Agni peaks at midday, just as the sun does. A heavy dinner at 10pm is the metabolic equivalent of swimming against the tide.</li>
  <li><strong>Sip warm water through the day.</strong> Cold drinks dampen Agni; warm water, ideally with a little ginger, keeps it lit.</li>
  <li><strong>Stop at "satisfied", not "full".</strong> Ayurveda suggests leaving roughly a quarter of your stomach empty so digestion has room to work.</li>
  <li><strong>Favour bitter, astringent and pungent tastes.</strong> Think leafy greens, lentils, ginger, turmeric — these balance Kapha, the dosha most linked to weight gain.</li>
  <li><strong>Move every single day.</strong> It needn't be punishing. A brisk walk and some sun do more over a year than a crash routine does in a month.</li>
</ol>

<h2>Herbs that support the process</h2>
<p>These don't "burn fat" — be wary of anything that claims to — but they support digestion and metabolism so your habits can work:</p>
<ul>
  <li><strong>Triphala:</strong> a gentle three-fruit blend taken at night to support regular, complete elimination.</li>
  <li><strong>Guggul:</strong> a classical resin traditionally used to support healthy metabolism and lipid levels.</li>
  <li><strong>Ginger &amp; black pepper:</strong> kitchen spices that gently kindle Agni before meals.</li>
</ul>

<blockquote>Sustainable weight isn't lost in a month and kept by willpower. It's the quiet by-product of digestion you've actually fixed.</blockquote>

<h2>Why crash diets backfire</h2>
<p>Severe restriction spikes Vata — the dosha of movement and anxiety — which is exactly why extreme diets leave you wired, cold and ravenous. The weight returns because the underlying terrain was never addressed. Ayurveda's slower path looks less impressive on week one and far better on month six.</p>

<h2>The realistic takeaway</h2>
<p>Fix your digestion, eat with the sun, move daily, and let a few well-chosen herbs support the work. It's not glamorous, but it's the version that lasts. As always, check with a practitioner before starting new herbs, especially if you have existing health conditions.</p>
`,
    emoji: "⚖️",
    gradient: ["#f6efe8", "#f0e4d6"],
    category: "Weight Loss",
    author: "Dr. Rohan Mehta",
    authorAvatar: "👨‍⚕️",
    date: "2026-05-14",
    readTime: "8 min read",
    tags: ["weight loss", "metabolism", "agni", "digestion"],
  },
  {
    id: "b4",
    title: "Boost Your Immunity the Ayurvedic Way: Giloy, Tulsi & Amla",
    slug: "boost-immunity-ayurvedic-way",
    excerpt:
      "Build resilient, year-round immunity with this classic Ayurvedic trio and a few simple daily rituals.",
    content: `
<p>Ayurveda doesn't think of immunity as a switch you flip when you feel a cold coming on. It calls your underlying vitality <strong>Ojas</strong> — the refined essence of good digestion, good sleep and a calm mind — and treats immunity as something you build season after season, not panic-buy in winter.</p>
<p>Three herbs sit at the heart of that work. Here's how to use them.</p>

<h2>Giloy (Guduchi) — the "root of immortality"</h2>
<p><strong>Tinospora cordifolia</strong> earned the Sanskrit name <em>Amrita</em>, "the nectar of immortality". It's a classic <em>rasayana</em> used to support the body's natural defences and recovery, particularly after seasonal illness. Giloy is most often taken as a juice, a decoction (kadha) or a standardised tablet.</p>

<h2>Tulsi (Holy Basil) — the plant in the courtyard</h2>
<p>There's a reason Tulsi grows in a pot at the centre of so many Indian homes. Beyond the ritual, it's a respected adaptogen traditionally used to support the respiratory system and the body's response to everyday stress. A few fresh leaves in your morning tea is one of the simplest health habits going.</p>

<h2>Amla (Indian Gooseberry) — vitamin C that survives the heat</h2>
<p>Amla is one of the richest natural sources of vitamin C, and unusually, its antioxidants are heat-stable — so it holds up in cooking and processing far better than most. In Ayurveda it cools excess Pitta and is a cornerstone of <strong>Chyawanprash</strong>, the famous immunity jam.</p>

<h2>A simple daily ritual</h2>
<ul>
  <li><strong>Morning:</strong> warm water, a spoon of amla, and a few tulsi leaves in your tea.</li>
  <li><strong>Through the day:</strong> a small piece of fresh ginger with a pinch of rock salt before meals to keep digestion brisk.</li>
  <li><strong>Seasonal changes:</strong> a short course of giloy when the weather turns — the moments your defences are most tested.</li>
</ul>

<blockquote>Strong immunity isn't a supplement you take when you're already sick. It's the dividend of a body that sleeps, digests and rests well all year.</blockquote>

<h2>Don't forget the basics</h2>
<p>Herbs are the supporting cast. The lead roles still belong to <strong>sleep, sunlight, movement and managing stress</strong> — the four things that build Ojas faster than any tablet. Get those right and the herbs have something to build on.</p>

<p>Make this trio a quiet daily habit rather than an emergency measure, and your immunity becomes something you maintain, not something you chase. Check with a practitioner before starting new herbs if you're pregnant or managing a health condition.</p>
`,
    emoji: "🛡️",
    gradient: ["#fef6e7", "#fbedd0"],
    category: "Immunity",
    author: "Dr. Ananya Sharma",
    authorAvatar: "👩‍⚕️",
    date: "2026-04-30",
    readTime: "5 min read",
    tags: ["immunity", "giloy", "tulsi", "amla"],
  },
  {
    id: "b5",
    title: "Understanding Your Dosha: A Beginner's Guide to Vata, Pitta & Kapha",
    slug: "understanding-your-dosha",
    excerpt:
      "Discover your unique Ayurvedic constitution and how it shapes the foods, herbs and routines that suit you best.",
    content: `
<p>Ask an Ayurvedic practitioner a health question and they'll often answer with a question of their own: "What's your <em>prakriti</em>?" Your prakriti is your constitution — the particular blend of three energies, or <strong>doshas</strong>, you were born with. Understanding yours is the first real step from generic advice to advice that fits.</p>

<h2>The three doshas in plain language</h2>
<h3>Vata — air &amp; space</h3>
<p>The energy of movement. Vata types tend to be quick, creative, light-framed and easily cold. When balanced: lively and imaginative. When out of balance: anxious, restless, dry skin, irregular digestion.</p>
<h3>Pitta — fire &amp; water</h3>
<p>The energy of transformation. Pitta types are sharp, driven, warm-bodied and natural organisers. When balanced: focused and confident. When out of balance: irritable, overheated, prone to acidity and inflammation.</p>
<h3>Kapha — earth &amp; water</h3>
<p>The energy of structure. Kapha types are calm, steady, strong and loyal. When balanced: grounded and nurturing. When out of balance: sluggish, prone to weight gain, congestion and a reluctance to change.</p>

<h2>Most of us are a blend</h2>
<p>Pure single-dosha types are rare. Far more common is a dominant pairing — Vata-Pitta, Pitta-Kapha, and so on. The goal is never to "fix" your dosha; it's to recognise your natural tendencies and gently counterbalance them when life pushes them too far.</p>

<blockquote>You don't change your constitution. You learn to live with it skilfully — like a sailor who can't change the wind but always adjusts the sail.</blockquote>

<h2>Balancing by opposites</h2>
<p>The governing principle is wonderfully simple: <strong>like increases like, and opposites balance</strong>.</p>
<ul>
  <li><strong>Vata</strong> (cold, dry, mobile) settles with warm, moist, grounding routines — cooked meals, oil massage, regular sleep.</li>
  <li><strong>Pitta</strong> (hot, sharp) settles with cooling, calming choices — sweet fruits, coconut, time in nature, less competition.</li>
  <li><strong>Kapha</strong> (heavy, slow) settles with stimulation — vigorous movement, lighter spiced food, new experiences.</li>
</ul>

<h2>A quick self-check</h2>
<p>Notice your patterns when you're stressed. Do you spin out and can't sleep (Vata), get short-tempered and overheated (Pitta), or shut down and withdraw (Kapha)? Your stress response is often the clearest window into your dominant dosha.</p>

<p>This is a starting map, not a diagnosis. For a proper constitutional assessment — and herbs matched to it — a qualified Ayurvedic practitioner is worth the visit. But even this basic awareness changes how you read your own body.</p>
`,
    emoji: "🧭",
    gradient: ["#eef2f7", "#e3ecf5"],
    category: "Basics",
    author: "Dr. Ananya Sharma",
    authorAvatar: "👩‍⚕️",
    date: "2026-04-12",
    readTime: "9 min read",
    tags: ["dosha", "vata", "pitta", "kapha", "basics"],
  },
  {
    id: "b6",
    title: "Shatavari for Women: Hormonal Balance Through Every Life Stage",
    slug: "shatavari-for-women",
    excerpt:
      "Why Shatavari is called the 'queen of herbs' and how it supports women's wellness from youth to menopause.",
    content: `
<p>If Ashwagandha is the king of Ayurvedic tonics, Shatavari is its queen. <strong>Asparagus racemosus</strong> has been the go-to herb for women's health in Ayurveda for centuries — a cooling, nourishing <em>rasayana</em> used to support hormonal balance through every stage of life.</p>

<h2>What's in a name</h2>
<p>The name Shatavari is often translated as "she who possesses a hundred husbands" — a poetic, slightly cheeky reference to its traditional reputation for supporting vitality and reproductive wellness. Less romantically, the plant's deep root system is what's harvested and used.</p>

<h2>How it supports women through life</h2>
<h3>The reproductive years</h3>
<p>Shatavari is traditionally used to support a regular cycle and ease the discomfort that comes with it. Its cooling nature is considered especially helpful for Pitta-related irritability and heat in the days before a period.</p>
<h3>Motherhood</h3>
<p>One of its most established traditional uses is as a galactagogue — a herb to support healthy lactation in new mothers. It's a classic ingredient in postnatal Ayurvedic preparations across India.</p>
<h3>Perimenopause and beyond</h3>
<p>As natural oestrogen declines, the body tends toward dryness and heat — exactly the qualities Shatavari counters. It's traditionally used to support comfort and moisture through the menopausal transition.</p>

<blockquote>Shatavari doesn't override the body's rhythms. It nourishes the terrain so those rhythms can find their own balance.</blockquote>

<h2>How to take it</h2>
<ul>
  <li><strong>Form:</strong> available as powder (churna), tablets, or in classical preparations like Shatavari Gulam.</li>
  <li><strong>Classic pairing:</strong> a teaspoon of the powder stirred into warm milk with a little honey — the traditional way to deliver its nourishing, building quality.</li>
  <li><strong>Consistency:</strong> like most rasayanas, it works gradually over weeks, not days.</li>
</ul>

<h2>Who should check first</h2>
<p>Shatavari is generally gentle, but because it has a mild hormone-supporting reputation, anyone with a hormone-sensitive condition, or who is on hormonal medication, should speak to a doctor before starting. The same goes if you tend toward heavy congestion or water retention, as its building nature can be a touch much for high-Kapha constitutions.</p>

<p>For most women, though, Shatavari is one of the most trusted, time-honoured allies Ayurveda offers — a quiet, steady support that meets you wherever you are in life.</p>
`,
    emoji: "🌸",
    gradient: ["#f7eef4", "#f3e0ee"],
    category: "Women's Health",
    author: "Dr. Ananya Sharma",
    authorAvatar: "👩‍⚕️",
    date: "2026-03-22",
    readTime: "6 min read",
    tags: ["shatavari", "women", "hormones"],
  },
];

// Attach a branded dummy cover image to each post (matches slug-named files).
for (const b of blogPosts) {
  b.image = b.image ?? `/images/blog/${b.slug}.svg`;
}

export function getBlogBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((b) => b.slug === slug);
}
export function getRelatedBlogs(slug: string, limit = 3): BlogPost[] {
  const current = getBlogBySlug(slug);
  if (!current) return blogPosts.slice(0, limit);
  return blogPosts
    .filter((b) => b.slug !== slug)
    .sort((a, b) => (a.category === current.category ? -1 : 1))
    .slice(0, limit);
}
