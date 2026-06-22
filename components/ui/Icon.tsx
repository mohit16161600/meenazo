import type { SVGProps, ReactElement } from "react";
import { cn } from "@/utils/cn";

/**
 * Professional inline SVG icon set (Lucide-style, 24×24, currentColor).
 * Replaces emoji "icons" across the UI. Stroke icons inherit color via
 * `text-*`; solid icons (heart-filled, star, social, whatsapp) use fill.
 */
export interface IconProps {
  className?: string;
  size?: number;
  strokeWidth?: number;
}

function Svg({
  children,
  size = 24,
  strokeWidth = 1.8,
  className,
  filled,
  ...rest
}: SVGProps<SVGSVGElement> & { size?: number; strokeWidth?: number; filled?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke={filled ? "none" : "currentColor"}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("inline-block shrink-0", className)}
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

/* ----------------------------- UI chrome ----------------------------- */
export const IconSearch = (p: IconProps) => (
  <Svg {...p}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></Svg>
);
export const IconUser = (p: IconProps) => (
  <Svg {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></Svg>
);
export const IconHeart = ({ filled, ...p }: IconProps & { filled?: boolean }) => (
  <Svg {...p} filled={filled}>
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.5 4.04 3 5.5l7 7Z" />
  </Svg>
);
export const IconBag = (p: IconProps) => (
  <Svg {...p}><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></Svg>
);
export const IconMenu = (p: IconProps) => (
  <Svg {...p}><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" /></Svg>
);
export const IconClose = (p: IconProps) => (
  <Svg {...p}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></Svg>
);
export const IconChevronDown = (p: IconProps) => (<Svg {...p}><path d="m6 9 6 6 6-6" /></Svg>);
export const IconChevronLeft = (p: IconProps) => (<Svg {...p}><path d="m15 18-6-6 6-6" /></Svg>);
export const IconChevronRight = (p: IconProps) => (<Svg {...p}><path d="m9 18 6-6-6-6" /></Svg>);
export const IconArrowUp = (p: IconProps) => (<Svg {...p}><path d="m5 12 7-7 7 7" /><path d="M12 19V5" /></Svg>);
export const IconArrowRight = (p: IconProps) => (<Svg {...p}><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></Svg>);
export const IconStar = ({ filled = true, ...p }: IconProps & { filled?: boolean }) => (
  <Svg {...p} filled={filled} strokeWidth={1.5}>
    <path d="M12 2.5l2.95 5.98 6.6.96-4.77 4.65 1.12 6.57L12 17.55l-5.9 3.11 1.12-6.57L2.45 9.44l6.6-.96L12 2.5Z" />
  </Svg>
);
export const IconPlay = ({ filled = true, ...p }: IconProps & { filled?: boolean }) => (
  <Svg {...p} filled={filled}><path d="M7 4.5v15l12-7.5-12-7.5Z" /></Svg>
);
export const IconCheck = (p: IconProps) => (<Svg {...p}><path d="M20 6 9 17l-5-5" /></Svg>);
export const IconPlus = (p: IconProps) => (<Svg {...p}><path d="M12 5v14" /><path d="M5 12h14" /></Svg>);
export const IconMinus = (p: IconProps) => (<Svg {...p}><path d="M5 12h14" /></Svg>);
export const IconShare = (p: IconProps) => (
  <Svg {...p}><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 13.5 6.8 4M15.4 6.5 8.6 10.5" /></Svg>
);
export const IconCopy = (p: IconProps) => (
  <Svg {...p}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h8" /></Svg>
);
export const IconMapPin = (p: IconProps) => (
  <Svg {...p}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></Svg>
);
export const IconPhone = (p: IconProps) => (
  <Svg {...p}><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L8.1 9.6a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.4c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2Z" /></Svg>
);
export const IconMail = (p: IconProps) => (
  <Svg {...p}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /></Svg>
);

/* ----------------------------- Trust / feature ----------------------------- */
export const IconTruck = (p: IconProps) => (
  <Svg {...p}><path d="M3 6a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v9H3V6Z" /><path d="M14 9h4l3 3v3h-7V9Z" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></Svg>
);
export const IconFlask = (p: IconProps) => (
  <Svg {...p}><path d="M9 3h6" /><path d="M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 18l-5-9V3" /><path d="M7 15h10" /></Svg>
);
export const IconReturn = (p: IconProps) => (
  <Svg {...p}><path d="M3 8a9 9 0 1 1-1 4" /><path d="M3 3v5h5" /></Svg>
);
export const IconHeadset = (p: IconProps) => (
  <Svg {...p}><path d="M4 13v-1a8 8 0 0 1 16 0v1" /><path d="M4 13h2a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-4Z" /><path d="M20 13h-2a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-4Z" /><path d="M20 17a4 4 0 0 1-4 4h-3" /></Svg>
);
export const IconShield = (p: IconProps) => (
  <Svg {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /></Svg>
);
export const IconShieldCheck = (p: IconProps) => (
  <Svg {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></Svg>
);
export const IconLeaf = (p: IconProps) => (
  <Svg {...p}><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" /><path d="M2 21c0-3 1.85-5.36 5.08-6" /></Svg>
);
export const IconSprout = (p: IconProps) => (
  <Svg {...p}><path d="M7 20h10" /><path d="M12 20V9" /><path d="M12 9C12 6 9.5 4 6 4c0 3.5 2.5 5 6 5Z" /><path d="M12 11c0-2.5 2.5-4.5 6-4.5 0 3-2.5 4.5-6 4.5Z" /></Svg>
);
export const IconLock = (p: IconProps) => (
  <Svg {...p}><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></Svg>
);
export const IconBadgeCheck = (p: IconProps) => (
  <Svg {...p}><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" /><path d="m9 12 2 2 4-4" /></Svg>
);
export const IconFactory = (p: IconProps) => (
  <Svg {...p}><path d="M2 20h20" /><path d="M4 20V11l5 3V11l5 3V8l6 4v8" /><path d="M9 20v-4" /><path d="M14 20v-4" /></Svg>
);
export const IconClipboardCheck = (p: IconProps) => (
  <Svg {...p}><rect x="8" y="2" width="8" height="4" rx="1" /><path d="M9 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-3" /><path d="m9 14 2 2 4-4" /></Svg>
);
export const IconMicroscope = (p: IconProps) => (
  <Svg {...p}><path d="M6 18h8" /><path d="M3 22h18" /><path d="M14 22a7 7 0 1 0 0-14" /><path d="M9 14h2" /><path d="M8 14a3 3 0 0 1-1-2V6a2 2 0 1 1 4 0v6a3 3 0 0 1-1 2" /></Svg>
);
export const IconStethoscope = (p: IconProps) => (
  <Svg {...p}><path d="M4 3v5a4 4 0 0 0 8 0V3" /><path d="M4 3H3M12 3h1" /><path d="M8 15a5 5 0 0 0 10 0v-2" /><circle cx="18" cy="11" r="2" /></Svg>
);
export const IconScale = (p: IconProps) => (
  <Svg {...p}><path d="M12 3v18" /><path d="M7 21h10" /><path d="m5 6 14-2" /><path d="M5 6 2.5 12a3 3 0 0 0 5 0L5 6Z" /><path d="m19 4 2.5 6a3 3 0 0 1-5 0L19 4Z" /></Svg>
);
export const IconSun = (p: IconProps) => (
  <Svg {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></Svg>
);
export const IconInfinity = (p: IconProps) => (
  <Svg {...p}><path d="M6.5 8a4 4 0 1 0 0 8c2.5 0 3.8-2 5.5-4s3-4 5.5-4a4 4 0 1 1 0 8c-2.5 0-3.8-2-5.5-4S9 8 6.5 8Z" /></Svg>
);
export const IconHeartPulse = (p: IconProps) => (
  <Svg {...p}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.5 4.04 3 5.5l7 7Z" /><path d="M3.2 12h3l1.5-3 2.5 5 1.6-3h3" /></Svg>
);
export const IconAward = (p: IconProps) => (
  <Svg {...p}><circle cx="12" cy="9" r="6" /><path d="m8.5 13.5-1 7L12 18l4.5 2.5-1-7" /></Svg>
);
export const IconSparkles = (p: IconProps) => (
  <Svg {...p}><path d="M12 4l1.6 4.4L18 10l-4.4 1.6L12 16l-1.6-4.4L6 10l4.4-1.6L12 4Z" /><path d="M5 15l.7 1.8L7.5 17.5 5.7 18.2 5 20l-.7-1.8L2.5 17.5l1.8-.7L5 15Z" /></Svg>
);
export const IconTrash = (p: IconProps) => (
  <Svg {...p}><path d="M4 7h16" /><path d="M10 11v6M14 11v6" /><path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" /><path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" /></Svg>
);
export const IconCreditCard = (p: IconProps) => (
  <Svg {...p}><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></Svg>
);
export const IconWallet = (p: IconProps) => (
  <Svg {...p}><path d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v2" /><path d="M3 7v10a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1v-3" /><path d="M21 11h-5a2 2 0 0 0 0 4h5v-4Z" /></Svg>
);
export const IconCash = (p: IconProps) => (
  <Svg {...p}><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /><path d="M6 12h.01M18 12h.01" /></Svg>
);
export const IconPackage = (p: IconProps) => (
  <Svg {...p}><path d="M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5M12 22V12" /></Svg>
);
export const IconInfo = (p: IconProps) => (
  <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 16v-4M12 8h.01" /></Svg>
);
export const IconAlert = (p: IconProps) => (
  <Svg {...p}><path d="M10.3 3.3 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.3a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 17h.01" /></Svg>
);
export const IconBell = (p: IconProps) => (
  <Svg {...p}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" /></Svg>
);
export const IconLogout = (p: IconProps) => (
  <Svg {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></Svg>
);
export const IconEdit = (p: IconProps) => (
  <Svg {...p}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" /></Svg>
);
export const IconSettings = (p: IconProps) => (
  <Svg {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 0 1-4 0v-.1A1.7 1.7 0 0 0 6.8 19l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H3a2 2 0 0 1 0-4h.1A1.7 1.7 0 0 0 5 6.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 2.9-1.2V3a2 2 0 0 1 4 0v.1A1.7 1.7 0 0 0 17.2 5l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.9H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" /></Svg>
);
export const IconHome = (p: IconProps) => (
  <Svg {...p}><path d="m3 10 9-7 9 7" /><path d="M5 9v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9" /><path d="M9 21v-6h6v6" /></Svg>
);
export const IconClock = (p: IconProps) => (
  <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Svg>
);
export const IconCheckCircle = (p: IconProps) => (
  <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="m8.5 12 2.5 2.5 4.5-5" /></Svg>
);
export const IconTag = (p: IconProps) => (
  <Svg {...p}><path d="M3 3h7l11 11-7 7L3 10V3Z" /><circle cx="7.5" cy="7.5" r="1.5" /></Svg>
);
export const IconGift = (p: IconProps) => (
  <Svg {...p}><rect x="3" y="8" width="18" height="4" rx="1" /><path d="M12 8v13M5 12v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8" /><path d="M12 8S10 3 7.5 3 5 6 5 6s2.5 2 7 2c4.5 0 7-2 7-2s0-3-2.5-3S12 8 12 8Z" /></Svg>
);
export const IconArrowLeft = (p: IconProps) => (
  <Svg {...p}><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></Svg>
);
export const IconExternal = (p: IconProps) => (
  <Svg {...p}><path d="M15 3h6v6" /><path d="M10 14 21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></Svg>
);
export const IconChat = (p: IconProps) => (
  <Svg {...p}><path d="M21 11.5a8.5 8.5 0 0 1-12.5 7.5L3 21l2-5.5A8.5 8.5 0 1 1 21 11.5Z" /></Svg>
);

/* ----------------------------- Social / chat ----------------------------- */
export const IconWhatsApp = (p: IconProps) => (
  <Svg {...p} filled>
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm5.95 14.11c-.25.7-1.45 1.34-2 1.42-.5.07-1.16.1-1.87-.12-.43-.14-.98-.32-1.69-.62-2.97-1.28-4.9-4.27-5.05-4.47-.15-.2-1.2-1.6-1.2-3.05 0-1.45.76-2.16 1.03-2.46.27-.3.59-.37.78-.37.2 0 .39 0 .56.01.18.01.42-.07.66.5.25.59.84 2.04.91 2.19.07.15.12.32.02.52-.1.2-.15.32-.3.5-.15.17-.31.39-.44.52-.15.15-.3.3-.13.6.17.3.76 1.25 1.63 2.03 1.12.99 2.06 1.3 2.36 1.45.3.15.47.12.64-.07.17-.2.74-.86.94-1.16.2-.3.39-.25.66-.15.27.1 1.71.81 2 .96.3.15.5.22.56.35.07.12.07.7-.18 1.4Z" />
  </Svg>
);
export const IconInstagram = (p: IconProps) => (
  <Svg {...p}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="3.8" /><circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none" /></Svg>
);
export const IconFacebook = (p: IconProps) => (
  <Svg {...p}><path d="M17 2h-3a5 5 0 0 0-5 5v3H6v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3V2Z" /></Svg>
);
export const IconYouTube = (p: IconProps) => (
  <Svg {...p}><rect x="2" y="5" width="20" height="14" rx="4" /><path d="m10 9 5 3-5 3V9Z" fill="currentColor" stroke="none" /></Svg>
);
export const IconTwitterX = (p: IconProps) => (
  <Svg {...p} filled><path d="M16.5 3h3.2l-7 8 8.2 11h-6.4l-5-6.6-5.7 6.6H1.6l7.5-8.7L1 3h6.6l4.5 6 4.4-6Zm-1.1 16h1.8L8.7 4.8H6.8L15.4 19Z" /></Svg>
);

/* ----------------------------- Dynamic registry ----------------------------- */
const registry: Record<string, (p: IconProps) => ReactElement> = {
  search: IconSearch,
  user: IconUser,
  heart: IconHeart,
  bag: IconBag,
  cart: IconBag,
  truck: IconTruck,
  flask: IconFlask,
  return: IconReturn,
  headset: IconHeadset,
  shield: IconShield,
  "shield-check": IconShieldCheck,
  leaf: IconLeaf,
  sprout: IconSprout,
  lock: IconLock,
  check: IconCheck,
  "badge-check": IconBadgeCheck,
  factory: IconFactory,
  "clipboard-check": IconClipboardCheck,
  microscope: IconMicroscope,
  stethoscope: IconStethoscope,
  scale: IconScale,
  sun: IconSun,
  infinity: IconInfinity,
  "heart-pulse": IconHeartPulse,
  award: IconAward,
  sparkles: IconSparkles,
  star: IconStar,
  play: IconPlay,
  "map-pin": IconMapPin,
  phone: IconPhone,
  mail: IconMail,
  trash: IconTrash,
  "credit-card": IconCreditCard,
  wallet: IconWallet,
  cash: IconCash,
  cod: IconCash,
  package: IconPackage,
  box: IconPackage,
  info: IconInfo,
  alert: IconAlert,
  warning: IconAlert,
  bell: IconBell,
  logout: IconLogout,
  edit: IconEdit,
  settings: IconSettings,
  home: IconHome,
  clock: IconClock,
  "check-circle": IconCheckCircle,
  tag: IconTag,
  gift: IconGift,
  "arrow-left": IconArrowLeft,
  "arrow-right": IconArrowRight,
  "arrow-up": IconArrowUp,
  external: IconExternal,
  chat: IconChat,
  message: IconChat,
  close: IconClose,
  plus: IconPlus,
  minus: IconMinus,
  copy: IconCopy,
  "chevron-down": IconChevronDown,
  "chevron-left": IconChevronLeft,
  "chevron-right": IconChevronRight,
  // social
  whatsapp: IconWhatsApp,
  instagram: IconInstagram,
  facebook: IconFacebook,
  youtube: IconYouTube,
  twitter: IconTwitterX,
  x: IconTwitterX,
};

/**
 * Render an icon by semantic name. Falls back to rendering the raw string
 * (e.g. an emoji) when the name isn't a known icon — so legacy emoji data
 * keeps working safely.
 */
export function Icon({
  name,
  className,
  size = 24,
  strokeWidth,
}: { name: string } & IconProps) {
  const Cmp = registry[name?.toLowerCase?.()];
  if (Cmp) return <Cmp className={className} size={size} strokeWidth={strokeWidth} />;
  return (
    <span className={className} style={{ fontSize: size, lineHeight: 1 }} aria-hidden>
      {name}
    </span>
  );
}
