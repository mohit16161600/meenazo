import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { IconHeart } from "@/components/ui/Icon";
import { ArtPlaceholder } from "@/components/ui/ArtPlaceholder";
import { instagramPosts } from "@/data/trust";

/** Social proof grid linking out to Instagram. */
export function InstagramGallery() {
  return (
    <section className="section-y bg-soft">
      <Container>
        <SectionHeader
          center
          eyebrow="@meenazo"
          title="Follow our journey"
          subtitle="Real rituals, herb stories and community wins — join us on Instagram."
        />

        <ul className="grid grid-cols-3 gap-3 sm:gap-4 md:grid-cols-6">
          {instagramPosts.map((post) => (
            <li key={post.id}>
              <a
                href={post.link}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`View Instagram post with ${post.likes.toLocaleString("en-IN")} likes`}
                className="group relative block aspect-square overflow-hidden rounded-brand shadow-brand transition-transform duration-300 hover:-translate-y-1"
              >
                <ArtPlaceholder
                  emoji={post.emoji}
                  gradient={post.gradient}
                  src={post.image}
                  alt="Meenazo on Instagram"
                  fit="cover"
                  fontSize={44}
                  className="h-full w-full transition-transform duration-300 group-hover:scale-110"
                />
                <span className="absolute inset-0 z-10 flex items-center justify-center gap-1.5 bg-ink/55 text-sm font-semibold text-white opacity-0 backdrop-blur-[1px] transition-opacity duration-300 group-hover:opacity-100">
                  <IconHeart filled size={14} className="text-white" />
                  {post.likes.toLocaleString("en-IN")}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
