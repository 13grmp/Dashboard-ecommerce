"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

const data = [
  { name: "Jan", vendas: 4000 },
  { name: "Fev", vendas: 3000 },
  { name: "Mar", vendas: 5000 },
  { name: "Abr", vendas: 4500 },
  { name: "Mai", vendas: 6000 },
  { name: "Jun", vendas: 5500 },
  { name: "Jul", vendas: 7000 },
  { name: "Ago", vendas: 6500 },
  { name: "Set", vendas: 8000 },
  { name: "Out", vendas: 7500 },
  { name: "Nov", vendas: 9000 },
  { name: "Dez", vendas: 10000 },
];

export function SalesChart() {
  return (
    <Card className="col-span-4">
      <CardHeader>
        <h1>Ajustar</h1>
        <CardTitle>Vendas Mensais</CardTitle>
        <CardDescription>
          Visão geral das vendas nos últimos 12 meses
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{
              top: 10,
              right: 30,
              left: 0,
              bottom: 0,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="vendas"
              stroke="#8884d8"
              fill="#8884d8"
              fillOpacity={0.2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

