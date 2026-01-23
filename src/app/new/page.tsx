import { redirect } from "next/navigation";

export default function NewRedirect({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const params = new URLSearchParams();

  const ym = searchParams?.ym;
  if (typeof ym === "string" && ym) params.set("ym", ym);

  const qs = params.toString();
  redirect(qs ? `/app/new?${qs}` : "/app/new");
}
