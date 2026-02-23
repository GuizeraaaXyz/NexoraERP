"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { Card } from "@/components/ui/kit";

const COLORS = ["#2563eb", "#f59e0b", "#16a34a"];

function monthKey(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(date);
}

export default function DashboardCharts({
  pedidosConfirmados,
}: {
  pedidosConfirmados: { created_at: string; total_liquido: number; status: string }[];
}) {
  const chartData = useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: 6 }).map((_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      return {
        key: `${date.getFullYear()}-${date.getMonth()}`,
        label: monthKey(date),
        pedidos: 0,
        faturamento: 0,
      };
    });

    pedidosConfirmados.forEach((pedido) => {
      const date = new Date(pedido.created_at);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const bucket = months.find((m) => m.key === key);
      if (bucket) {
        bucket.pedidos += 1;
        bucket.faturamento += Number(pedido.total_liquido || 0);
      }
    });

    return months;
  }, [pedidosConfirmados]);

  const statusData = useMemo(() => {
    const base = {
      rascunho: 0,
      confirmado: 0,
      cancelado: 0,
    };
    pedidosConfirmados.forEach((pedido) => {
      if (pedido.status in base) {
        base[pedido.status as keyof typeof base] += 1;
      }
    });
    return [
      { name: "Confirmado", value: base.confirmado },
      { name: "Rascunho", value: base.rascunho },
      { name: "Cancelado", value: base.cancelado },
    ];
  }, [pedidosConfirmados]);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">
          Pedidos e faturamento por período
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="pedidos"
                stroke="#2563eb"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="faturamento"
                stroke="#16a34a"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card>
        <h3 className="text-sm font-semibold text-slate-700 mb-4">
          Status dos pedidos
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={statusData} dataKey="value" innerRadius={48}>
                {statusData.map((entry, index) => (
                  <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card className="lg:col-span-3">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">
          Faturamento por período
        </h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="faturamento" fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
