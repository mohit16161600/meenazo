"use client";

import { useState } from "react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icon";
import { ArtPlaceholder } from "@/components/ui/ArtPlaceholder";
import { doctorInfo } from "@/data/trust";

/**
 * Home "Doctor video" section — a dark, premium two-column card.
 * Left: a gradient player panel with the doctor avatar and a pulsing play button.
 * Right: eyebrow, heading, bio, a CTA and a doctor meta row.
 * Clicking the play button or the CTA opens a modal with a 16:9 video embed.
 */
export function DoctorVideo() {
  const [open, setOpen] = useState(false);

  return (
    <section className="section-y">
      <Container>
        <div
          className="rounded-brand overflow-hidden shadow-brand-lg text-white grid grid-cols-1 lg:grid-cols-2"
          style={{ background: "linear-gradient(145deg, #1f2a24, #2f4438)" }}
        >
          {/* Player panel */}
          <div
            className="relative min-h-[280px] sm:min-h-[360px] lg:min-h-[440px] flex items-center justify-center p-8"
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

            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Play doctor introduction video"
              className="absolute inset-0 z-10 m-auto h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-white text-brand-dark flex items-center justify-center shadow-brand-lg animate-pulseRing transition-transform hover:scale-105 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
            >
              <Icon name="play" size={32} className="ml-1 text-brand-dark" />
            </button>
          </div>

          {/* Copy panel */}
          <div className="p-8 sm:p-10 lg:p-14 flex flex-col justify-center">
            <span className="eyebrow text-brand-light">{doctorInfo.eyebrow}</span>
            <h2 className="mt-2 text-white">{doctorInfo.heading}</h2>
            <p className="mt-4 text-white/75 leading-relaxed max-w-xl">
              {doctorInfo.bio}
            </p>

            <div className="mt-7">
              <Button onClick={() => setOpen(true)}>Watch the full video</Button>
            </div>

            <div className="mt-8 flex items-center gap-4 border-t border-white/10 pt-6">
              <span
                className="h-14 w-14 shrink-0 rounded-full bg-white/10 flex items-center justify-center text-3xl"
                aria-hidden
              >
                {doctorInfo.avatar}
              </span>
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

      <Modal open={open} onClose={() => setOpen(false)} size="xl" className="overflow-hidden">
        <div className="relative w-full" style={{ aspectRatio: "16 / 9" }}>
          <iframe
            src={doctorInfo.videoUrl}
            title={`${doctorInfo.name} — ${doctorInfo.heading}`}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </Modal>
    </section>
  );
}
