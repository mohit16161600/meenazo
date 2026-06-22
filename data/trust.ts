import type { Certification, TrustBadge, InstagramPost, DoctorInfo } from "@/types";

export const certifications: Certification[] = [
  { id: "c1", name: "GMP Certified", icon: "factory", description: "Good Manufacturing Practices" },
  { id: "c2", name: "ISO 9001", icon: "clipboard-check", description: "Quality management certified" },
  { id: "c3", name: "AYUSH Approved", icon: "leaf", description: "Ministry of AYUSH aligned" },
  { id: "c4", name: "FSSAI", icon: "badge-check", description: "Food safety certified" },
  { id: "c5", name: "Lab Tested", icon: "microscope", description: "Third-party verified" },
  { id: "c6", name: "100% Vegetarian", icon: "sprout", description: "Plant-based formulas" },
];

export const trustBadges: TrustBadge[] = [
  { icon: "lock", label: "100% Secure", sublabel: "Safe & encrypted payments" },
  { icon: "truck", label: "Free Shipping", sublabel: "On orders over ₹499" },
  { icon: "return", label: "Easy Returns", sublabel: "30-day return policy" },
  { icon: "leaf", label: "100% Authentic", sublabel: "Genuine Ayurvedic herbs" },
  { icon: "headset", label: "24×7 Support", sublabel: "Expert help anytime" },
];

export const instagramPosts: InstagramPost[] = [
  { id: "ig1", emoji: "🌿", gradient: ["#eaf3ee", "#cfe6d8"], likes: 1240, link: "https://instagram.com" },
  { id: "ig2", emoji: "🍵", gradient: ["#f6efe8", "#ecdcc8"], likes: 980, link: "https://instagram.com" },
  { id: "ig3", emoji: "🧘", gradient: ["#eef2f7", "#d3e1f0"], likes: 2310, link: "https://instagram.com" },
  { id: "ig4", emoji: "🌸", gradient: ["#f7eef4", "#f3e0ee"], likes: 1560, link: "https://instagram.com" },
  { id: "ig5", emoji: "🛡️", gradient: ["#fef6e7", "#fbedd0"], likes: 870, link: "https://instagram.com" },
  { id: "ig6", emoji: "💪", gradient: ["#eef2f7", "#bcd2ea"], likes: 1990, link: "https://instagram.com" },
];

// Attach branded dummy photos to each Instagram tile (matches id-named files).
for (const p of instagramPosts) {
  p.image = p.image ?? `/images/instagram/${p.id}.svg`;
}

export const doctorInfo: DoctorInfo = {
  eyebrow: "Expert advice",
  heading: "Meet the Ayurvedic doctor behind our formulas",
  name: "Dr. Ananya Sharma, BAMS",
  title: "Chief Ayurvedic Advisor",
  experience: "15 yrs experience",
  avatar: "👩‍⚕️",
  image: "/images/team/doctor.svg",
  bio: "Watch Dr. Ananya Sharma explain how we select authentic herbs, why standardised dosage matters, and how to build an Ayurvedic routine that actually fits your modern life.",
  videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
};
