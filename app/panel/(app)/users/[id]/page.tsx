"use client";
import { useParams } from "next/navigation";
import { ResourceForm } from "@/app/panel/_components/ResourceForm";
export default function Page() {
  const { id } = useParams<{ id: string }>();
  return <ResourceForm resourceName="users" id={id} />;
}
