"use client";

import { createContext, useContext } from "react";
import { canEditField, editableFields } from "@/lib/panelRoles";

/**
 * The signed-in panel user's role, made available to every client component
 * below the shell.
 *
 * The API is the security boundary — it strips fields a role may not write no
 * matter what the browser sends. This context exists purely so the UI can stop
 * *showing* controls that would be silently discarded on save: a Store Manager
 * seeing a price field they can edit and an SEO editor seeing one they cannot
 * should not look identical.
 */
const PanelRoleContext = createContext<string>("");

export function PanelRoleProvider({
  role,
  children,
}: {
  role: string;
  children: React.ReactNode;
}) {
  return <PanelRoleContext.Provider value={role}>{children}</PanelRoleContext.Provider>;
}

export function usePanelRole(): string {
  return useContext(PanelRoleContext);
}

/** Convenience hook: can the current role write this field on this resource? */
export function useCanEditField(resource: string): (key: string) => boolean {
  const role = usePanelRole();
  return (key: string) => canEditField(role, resource, key);
}

/**
 * True when the role only has a subset of this resource's fields — such a role
 * may edit what it owns but must not create or delete records, since it cannot
 * supply the fields it isn't allowed to see.
 */
export function useIsScoped(): (resource: string) => boolean {
  const role = usePanelRole();
  return (resource: string) => editableFields(role, resource) !== null;
}
