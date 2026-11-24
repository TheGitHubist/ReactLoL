import { notFound } from "next/navigation";
import CardDetails from "../../components/card-details";

export const instant = false;

export default async function CardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  return <CardDetails id={id} />;
}
