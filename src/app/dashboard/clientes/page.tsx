"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUsers } from "@/hooks/use-api";
import { useAuthContext } from "@/components/providers/auth-provider";
import { 
  Search, 
  Users, 
  AlertCircle,
  Eye,
  Edit,
  UserCheck,
  UserX,
  Mail,
  Phone
} from "lucide-react";

export default function ClientesPage() {
  const { isAdmin } = useAuthContext();
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  
  const { data, error, isLoading } = useUsers({
    search: search || undefined,
    role: selectedRole || undefined,
    limit: 50,
  });

  const users = data?.users || [];

  // Se não for admin, mostrar mensagem
  if (!isAdmin()) {
    return (
      <DashboardLayout>
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
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-600">
            Gerencie os usuários e clientes da sua loja.
          </p>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="h-5 w-5 mr-2" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Nome ou email do cliente..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de Usuário</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos os tipos</option>
                  <option value="CUSTOMER">Clientes</option>
                  <option value="ADMIN">Administradores</option>
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
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center text-red-600">
                <AlertCircle className="h-5 w-5 mr-2" />
                <div>
                  <h3 className="font-medium">Erro ao carregar clientes</h3>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Users List */}
        {!isLoading && !error && (
          <>
            <div className="flex justify-between items-center">
              <p className="text-gray-600">
                {users.length} cliente(s) encontrado(s)
              </p>
            </div>

            {users.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhum cliente encontrado
                  </h3>
                  <p className="text-gray-600">
                    Tente ajustar os filtros de busca.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {users.map((user) => (
                  <Card key={user.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold text-lg">
                              {user.name?.charAt(0).toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {user.name || 'Nome não informado'}
                            </h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span className="flex items-center">
                                <Mail className="h-4 w-4 mr-1" />
                                {user.email}
                              </span>
                              {user.phone && (
                                <span className="flex items-center">
                                  <Phone className="h-4 w-4 mr-1" />
                                  {user.phone}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Cadastrado em: {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                            {user.role === 'ADMIN' ? (
                              <span className="flex items-center">
                                <UserCheck className="h-3 w-3 mr-1" />
                                Administrador
                              </span>
                            ) : (
                              <span className="flex items-center">
                                <Users className="h-3 w-3 mr-1" />
                                Cliente
                              </span>
                            )}
                          </Badge>
                          
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              Ver
                            </Button>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* User Stats */}
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Total de Pedidos:</span>
                            <span className="ml-2 font-medium">
                              {user.orders?.length || 0}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Total Gasto:</span>
                            <span className="ml-2 font-medium">
                              R$ {(user.orders?.reduce((total: number, order: any) => total + order.total, 0) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Último Pedido:</span>
                            <span className="ml-2 font-medium">
                              {user.orders?.length > 0 
                                ? new Date(user.orders[0].createdAt).toLocaleDateString('pt-BR')
                                : 'Nunca'
                              }
                            </span>
                          </div>
                        </div>
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

