"use client";

import { DashboardLayout } from "@/components/dashboard/layout";
import { StatsCard } from "@/components/dashboard/stats-card";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { TopProductsTable } from "@/components/dashboard/top-products-table";
import { useStats } from "@/hooks/use-api";
import { useAuthContext } from "@/components/providers/auth-provider";
import {
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  AlertCircle
} from "lucide-react";


export default function Dashboard() {
  const { user, isAdmin } = useAuthContext();
  const { data: stats, error, isLoading, refetch } = useStats();

  console.log("Stats:", stats);
  console.log("user", user, "e", isAdmin());

  // Se não for admin, mostrar mensagem
  if (!isAdmin()) {
    return (
      <DashboardLayout title="a">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Acesso Restrito
            </h2>
            <p className="text-gray-600">
              Você precisa de permissões de administrador para acessar esta página.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="a">

      <div className="space-y-6">

        {/* Header */}
        <div>
          
          <h1 className="text-3xl font-bold text-gray-900">
            Bem-vindo, {user?.name}!
          </h1>
          <p className="text-gray-600">
            Aqui está um resumo da sua loja de óculos.
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <div>
                <h3 className="text-red-800 font-medium">Erro ao carregar dados</h3>
                <p className="text-red-600 text-sm mt-1">{error}</p>
                <button
                  onClick={refetch}
                  className="text-red-600 text-sm underline mt-2"
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <h2>Período: {stats.period}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard
                description="usuario"
                title="Total de Usuários"
                value={stats.users.total?.toString() || "0"}
                icon={Users}
              //  trend={{value:12,positive:true}}
              />
              <StatsCard
                description="produtos"
                title="Produtos"
                value={stats.products.total?.toString() || "0"}
                icon={Package}
              //   trend={{value:12,positive:true}}
              />
              <StatsCard
                description="pedidos"
                title="Pedidos"
                value={stats.sales.completedOrders?.toString() || "0"}
                icon={ShoppingCart}
              // trend={{value:12,positive:true}}
              />
              <StatsCard
                description="receitatotal"
                title="Receita Total"
                value={`R$ ${stats.sales.total?.toLocaleString() || "0,0"}`}
                icon={DollarSign}
              //trend={{value:12,positive:true}}
              />
            </div>

            {/* Charts and Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SalesChart />
              <TopProductsTable Product={stats.sales.topProducts} />
            </div>

            {/* Recent Orders */}
            {stats.orders && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Pedidos Recentes
                  </h3>
                  <div>
                    <h5>Périodo: {stats.period}</h5>
                  </div>
                </div>

                <div className="p-6">
                  <div className="space-y-4">
                    {stats.orders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">
                            Pedido #{order.orderNumber.slice(0, 8)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {order?.nomeUsuario || 'Cliente'} • {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">
                            R$ {order.total}
                          </p>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${order.status === 'PAID' ? 'bg-green-100 text-green-800' :
                            order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                              order.status === 'SHIPPED' ? 'bg-blue-100 text-blue-800' :
                                order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                                  'bg-red-100 text-red-800'
                            }`}>
                            {order.status === 'PAID' ? 'Pago' :
                              order.status === 'PENDING' ? 'Pendente' :
                                order.status === 'SHIPPED' ? 'Enviado' :
                                  order.status === 'DELIVERED' ? 'Entregue' :
                                    'Cancelado'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

