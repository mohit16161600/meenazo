import { Container } from "@/components/ui/Container";
import { ArtPlaceholder } from "@/components/ui/ArtPlaceholder";
import { doctorInfo } from "@/data/trust";

/**
 * Home "Doctor" section — a dark, premium two-column card.
 * Left: the doctor image panel.
 * Right: eyebrow, heading, bio and a doctor meta row.
 */
export function DoctorVideo() {
  return (
    <section className="section-y">
      <Container>
        <div
          className="rounded-brand overflow-hidden shadow-brand-lg text-white grid grid-cols-1 lg:grid-cols-2"
          style={{ background: "linear-gradient(145deg, #1f2a24, #2f4438)" }}
        >
          {/* Image panel */}
          <div
            className="relative min-h-[280px] sm:min-h-[360px] lg:min-h-[440px]"
            style={{ background: "linear-gradient(160deg, #2f4438, #3f6b51)" }}
          >
            <ArtPlaceholder
              emoji={doctorInfo.avatar}
              src={doctorInfo.image}
              alt={doctorInfo.name}
              fit="cover"
              fontSize={150}
              className="absolute inset-0 h-full w-full"
            />
          </div>

          {/* Copy panel */}
          <div className="p-8 sm:p-10 lg:p-14 flex flex-col justify-center">
            <span className="eyebrow text-brand-light">{doctorInfo.eyebrow}</span>
            <h2 className="mt-2 text-white">{doctorInfo.heading}</h2>
            <p className="mt-4 text-white/75 leading-relaxed max-w-xl">
              {doctorInfo.bio}
            </p>

            <div className="mt-8 flex items-center gap-4 border-t border-white/10 pt-6">
              <ArtPlaceholder
                emoji={doctorInfo.avatar}
                src={doctorInfo.image}
                alt={doctorInfo.name}
                fit="cover"
                fontSize={28}
                sizes="56px"
                className="h-14 w-14 shrink-0 rounded-full bg-white/10"
              />
              <div>
                <p className="font-bold text-white leading-tight">{doctorInfo.name}</p>
                <p className="text-sm text-brand-light">
                  {doctorInfo.title} · {doctorInfo.experience}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
