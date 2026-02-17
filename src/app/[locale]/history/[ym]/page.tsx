import { redirect } from "next/navigation";

export default function HistoryYmRedirect({ params }: { params: { ym: string } }) {
  redirect(`/app/history/${params.ym}`);
}