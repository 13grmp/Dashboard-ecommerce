"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useOrders } from "@/hooks/use-api";
import { useAuthContext } from "@/components/providers/auth-provider";
import { 
  ShoppingCart, 
  AlertCircle,
  Eye,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";

export default function VendasPage() {
  const { isAdmin } = useAuthContext();
  const [selectedStatus, setSelectedStatus] = useState("");
  
  const { data, error, isLoading } = useOrders({
    status: selectedStatus || undefined,
    limit: 50,
  });

  const orders = data?.orders || [];

  console.log("Orders:", data);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="h-4 w-4" />;
      case 'PAID': return <CheckCircle className="h-4 w-4" />;
      case 'SHIPPED': return <Truck className="h-4 w-4" />;
      case 'DELIVERED': return <Package className="h-4 w-4" />;
      case 'CANCELLED': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Pendente';
      case 'PAID': return 'Pago';
      case 'SHIPPED': return 'Enviado';
      case 'DELIVERED': return 'Entregue';
      case 'CANCELLED': return 'Cancelado';
      default: return status;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'PENDING': return 'outline';
      case 'PAID': return 'default';
      case 'SHIPPED': return 'secondary';
      case 'DELIVERED': return 'default';
      case 'CANCELLED': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <DashboardLayout title="aa">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vendas e Pedidos</h1>
          <p className="text-gray-600">
            Acompanhe todos os pedidos e vendas da sua loja.
          </p>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status do Pedido</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos os status</option>
                  <option value="PENDING">Pendente</option>
                  <option value="PAID">Pago</option>
                  <option value="SHIPPED">Enviado</option>
                  <option value="DELIVERED">Entregue</option>
                  <option value="CANCELLED">Cancelado</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center text-red-600">
                <AlertCircle className="h-5 w-5 mr-2" />
                <div>
                  <h3 className="font-medium">Erro ao carregar pedidos</h3>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Orders List */}
        {!isLoading && !error && (
          <>
            <div className="flex justify-between items-center">
              <p className="text-gray-600">
                {orders.length} pedido(s) encontrado(s)
              </p>
            </div>

            {orders.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhum pedido encontrado
                  </h3>
                  <p className="text-gray-600">
                    Não há pedidos com os filtros selecionados.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <Card key={order.id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">
                            Pedido #{order.id.slice(0, 8)}
                          </h3>
                          <p className="text-gray-600">
                            Cliente: {order.user?.name || 'N/A'} ({order.user?.email || 'N/A'})
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(order.createdAt).toLocaleString('pt-BR')}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant={getStatusVariant(order.status)} className="mb-2">
                            <span className="flex items-center gap-1">
                              {getStatusIcon(order.status)}
                              {getStatusText(order.status)}
                            </span>
                          </Badge>
                          <p className="text-lg font-bold">
                            R$ {order.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="border-t pt-4">
                        <h4 className="font-medium mb-2">Itens do Pedido:</h4>
                        <div className="space-y-2">
                          {order.items.map((item) => (
                            <div key={item.id} className="flex justify-between items-center text-sm">
                              <span>
                                {item.product?.name || 'Produto'} x {item.quantity}
                              </span>
                              <span>
                                R$ {(item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          ))}
                        </div>
                        
                        <div className="border-t mt-2 pt-2 text-sm">
                          <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span>R$ {(order.total - order.shippingCost + order.discount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                          {order.shippingCost > 0 && (
                            <div className="flex justify-between">
                              <span>Frete:</span>
                              <span>R$ {order.shippingCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                          )}
                          {order.discount > 0 && (
                            <div className="flex justify-between text-green-600">
                              <span>Desconto:</span>
                              <span>-R$ {order.discount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-bold border-t pt-1">
                            <span>Total:</span>
                            <span>R$ {order.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 mt-4">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Ver Detalhes
                        </Button>
                        {isAdmin() && order.status === 'PAID' && (
                          <Button variant="outline" size="sm">
                            <Truck className="h-4 w-4 mr-1" />
                            Marcar como Enviado
                          </Button>
                        )}
                        {isAdmin() && order.status === 'SHIPPED' && (
                          <Button variant="outline" size="sm">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Marcar como Entregue
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

