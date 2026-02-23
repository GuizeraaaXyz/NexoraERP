"use client";

import dynamic from "next/dynamic";

const DashboardCharts = dynamic(
  () => import("./DashboardCharts"),
  { ssr: false }
);

export default function DashboardChartsClient({
  pedidosConfirmados,
}: {
  pedidosConfirmados: { created_at: string; total_liquido: number; status: string }[];
}) {
  return <DashboardCharts pedidosConfirmados={pedidosConfirmados} />;
}
