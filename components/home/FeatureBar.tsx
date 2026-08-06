import { Container } from "@/components/ui/Container";
import { Emblem } from "@/components/ui/Emblem";
import { features } from "@/data/benefits";

/** Trust feature strip shown under the hero (free delivery, lab tested, etc.). */
export function FeatureBar() {
  return (
    <Container>
      <ul className="grid grid-cols-2 gap-x-6 gap-y-8 border-b border-line py-8 md:grid-cols-4">
        {features.map((feature) => (
          <li key={feature.title} className="flex items-center gap-3.5">
            <Emblem
              image={feature.image}
              icon={feature.icon}
              rounded="rounded-full"
              className="h-12 w-12"
            />
            <div>
              <p className="text-sm font-bold text-ink sm:text-[15px]">{feature.title}</p>
              <p className="text-xs text-muted sm:text-[13px]">{feature.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </Container>
  );
}
