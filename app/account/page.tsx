"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "@/context/AuthContext";
import { useWishlistStore } from "@/lib/store/wishlistStore";
import { useHydrated } from "@/hooks/useHydrated";
import { orderService } from "@/services/orderService";
import { addressService } from "@/services/addressService";
import { formatDate } from "@/utils/format";

interface QuickLink {
  href: string;
  icon: string;
  title: string;
  description: string;
}

const quickLinks: QuickLink[] = [
  {
    href: "/account/orders",
    icon: "package",
    title: "My Orders",
    description: "Track shipments and review past purchases.",
  },
  {
    href: "/wishlist",
    icon: "heart",
    title: "Wishlist",
    description: "Your saved remedies, ready when you are.",
  },
  {
    href: "/account/addresses",
    icon: "map-pin",
    title: "Saved Addresses",
    description: "Manage where your orders are delivered.",
  },
  {
    href: "/account/profile",
    icon: "user",
    title: "Profile",
    description: "Update your name, phone and contact details.",
  },
];

function StatCard({
  icon,
  label,
  value,
  loading,
}: {
  icon: string;
  label: string;
  value: number;
  loading?: boolean;
}) {
  return (
    <div className="card-surface p-5 flex items-center gap-4">
      <span className="grid place-items-center h-12 w-12 rounded-full bg-mint text-brand shrink-0" aria-hidden>
        <Icon name={icon} size={22} />
      </span>
      <div className="min-w-0">
        {loading ? (
          <Skeleton className="h-7 w-12 mb-1" />
        ) : (
          <p className="text-2xl font-extrabold text-ink tabular-nums">{value}</p>
        )}
        <p className="text-sm text-muted">{label}</p>
      </div>
    </div>
  );
}

export default function AccountOverviewPage() {
  const { user } = useAuth();
  const hydrated = useHydrated();
  const wishlistCount = useWishlistStore((s) => s.ids.length);

  const [orderCount, setOrderCount] = useState(0);
  const [addressCount, setAddressCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    orderService
      .list(user?.id)
      .then((orders) => {
        if (cancelled) return;
        setOrderCount(orders.length);
        setAddressCount(addressService.list().length);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return (
    <div className="flex flex-col gap-8 animate-fadeIn">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon="package" label="Total orders" value={orderCount} loading={loading} />
        <StatCard
          icon="heart"
          label="Wishlist items"
          value={hydrated ? wishlistCount : 0}
          loading={!hydrated}
        />
        <StatCard icon="map-pin" label="Saved addresses" value={addressCount} loading={loading} />
      </div>

      {/* Quick links */}
      <div>
        <h2 className="text-xl font-bold text-ink mb-4">Quick links</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="card-surface card-hover p-5 flex items-start gap-4 group"
            >
              <span
                className="grid place-items-center h-11 w-11 rounded-full bg-soft text-brand shrink-0 group-hover:bg-mint transition-colors"
                aria-hidden
              >
                <Icon name={link.icon} size={20} />
              </span>
              <div className="min-w-0">
                <p className="font-bold text-ink flex items-center gap-1">
                  {link.title}
                  <Icon
                    name="arrow-right"
                    size={16}
                    className="text-brand transition-transform group-hover:translate-x-0.5"
                  />
                </p>
                <p className="text-sm text-muted mt-0.5">{link.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Account meta */}
      <div className="card-surface p-6 bg-gradient-to-br from-mint to-soft border-0">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-bold text-ink">{user?.name}</p>
            <p className="text-sm text-muted">{user?.email}</p>
            {user?.createdAt && (
              <p className="text-xs text-muted mt-1">Member since {formatDate(user.createdAt)}</p>
            )}
          </div>
          <Button href="/shop" variant="dark" size="sm">
            Continue shopping
          </Button>
        </div>
      </div>
    </div>
  );
}
