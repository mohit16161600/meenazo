import type { BlogPost } from "@/types";

const body = (intro: string) => `
<p>${intro}</p>
<h2>Understanding the Ayurvedic approach</h2>
<p>Ayurveda, the 5,000-year-old "science of life", views health as a dynamic balance between body, mind and environment. Rather than chasing symptoms, it seeks to restore equilibrium between the three doshas — Vata, Pitta and Kapha.</p>
<p>This holistic philosophy is why Ayurvedic formulations often combine multiple synergistic herbs, each chosen to support the body's own intelligence rather than override it.</p>
<h2>What modern research says</h2>
<p>A growing body of clinical research now validates what Ayurvedic practitioners have observed for millennia. Standardised extracts — like KSM-66® Ashwagandha — allow us to deliver consistent, research-backed potency in every dose.</p>
<blockquote>"The best of ancient wisdom, measured with modern science." — Dr. Ananya Sharma, BAMS</blockquote>
<h2>Building a daily routine</h2>
<p>Consistency is everything in Ayurveda. Choose formulations aligned to your constitution and concerns, take them at the recommended times, and give your body 4–6 weeks to respond. Pair supplements with mindful eating, movement and sleep for the best results.</p>
<h2>The bottom line</h2>
<p>Authentic, lab-tested Ayurvedic supplements can be a powerful addition to a balanced lifestyle. Always choose transparent, certified brands — and when in doubt, consult a qualified practitioner.</p>
`;

export const blogPosts: BlogPost[] = [
  {
    id: "b1",
    title: "Ashwagandha 101: The Complete Guide to the King of Adaptogens",
    slug: "ashwagandha-complete-guide",
    excerpt: "Everything you need to know about Ashwagandha — its benefits, the science behind KSM-66®, dosage and how to add it to your routine.",
    content: body("Ashwagandha has exploded in popularity, but what does the ancient adaptogen actually do — and how do you choose a quality supplement?"),
    emoji: "🌿",
    gradient: ["#eaf3ee", "#cfe6d8"],
    category: "Herbs",
    author: "Dr. Ananya Sharma",
    authorAvatar: "👩‍⚕️",
    date: "2026-06-10",
    readTime: "7 min read",
    tags: ["ashwagandha", "adaptogen", "stress", "sleep"],
    seoTitle: "Ashwagandha 101: Complete Guide to Benefits & Dosage | Meenazo",
    seoDescription: "A complete, doctor-written guide to Ashwagandha — benefits, KSM-66® science, dosage and how to build it into your daily routine.",
  },
  {
    id: "b2",
    title: "5 Ayurvedic Herbs to Naturally Support Healthy Blood Sugar",
    slug: "ayurvedic-herbs-blood-sugar",
    excerpt: "From Gymnema to Jamun, discover the time-tested herbs Ayurveda uses to support healthy blood-sugar metabolism.",
    content: body("Managing blood sugar is about more than diet alone. Ayurveda offers a treasury of herbs traditionally used to support healthy glucose metabolism."),
    emoji: "🩸",
    gradient: ["#eaf3ee", "#dceee4"],
    category: "Diabetes",
    author: "Dr. Ananya Sharma",
    authorAvatar: "👩‍⚕️",
    date: "2026-05-28",
    readTime: "6 min read",
    tags: ["diabetes", "blood sugar", "gymnema", "herbs"],
  },
  {
    id: "b3",
    title: "The Ayurvedic Guide to Sustainable Weight Management",
    slug: "ayurvedic-weight-management",
    excerpt: "Forget crash diets. Learn how Ayurveda approaches metabolism, digestion (Agni) and sustainable weight balance.",
    content: body("Sustainable weight management in Ayurveda starts with one concept: Agni, your digestive fire. Here's how to work with it, not against it."),
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
    excerpt: "Build resilient, year-round immunity with this classic Ayurvedic trio and simple daily rituals.",
    content: body("Strong immunity isn't built overnight. Ayurveda focuses on Ojas — your vital essence — and offers herbs to nurture it season after season."),
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
    excerpt: "Discover your unique Ayurvedic constitution and how it shapes the foods, herbs and routines that suit you best.",
    content: body("At the heart of Ayurveda lies the concept of the three doshas. Understanding yours is the first step to truly personalised wellness."),
    emoji: "⚖️",
    gradient: ["#eef2f7", "#e3ecf5"],
    category: "Basics",
    author: "Dr. Rohan Mehta",
    authorAvatar: "👨‍⚕️",
    date: "2026-04-12",
    readTime: "9 min read",
    tags: ["dosha", "vata", "pitta", "kapha", "basics"],
  },
  {
    id: "b6",
    title: "Shatavari for Women: Hormonal Balance Through Every Life Stage",
    slug: "shatavari-for-women",
    excerpt: "Why Shatavari is called the 'queen of herbs' and how it supports women's wellness from youth to menopause.",
    content: body("Shatavari, meaning 'she who possesses a hundred husbands', is Ayurveda's premier rejuvenating herb for women's health."),
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
