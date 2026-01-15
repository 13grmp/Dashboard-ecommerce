"use client";

import { useState } from "react";
import LiquidGlass from 'liquid-glass-react'
import { DashboardLayout } from "@/components/dashboard/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useProducts } from "@/hooks/use-api";
import { useAuthContext } from "@/components/providers/auth-provider";
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { z } from "zod"
import {
  Search,
  Filter,
  Plus,
  Package,
  AlertCircle,
  Eye,
  Edit,
  Trash2
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

export default function ProdutosPage() {
  const { isAdmin } = useAuthContext();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");

  const { data, error, isLoading } = useProducts({
    search: search || undefined,
    category: selectedCategory || undefined,
    brand: selectedBrand || undefined,
    limit: 20,
  });

  const products = data?.products || [];

  const FormSchema = z.object({
    username: z.string().min(2, {
      message: "Username must be at least 2 characters.",
    }),
  })

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      username: "",
    },
  })

  function onSubmit(data: z.infer<typeof FormSchema>) {
    toast("You submitted the following values", {
      description: (
        <pre className="mt-2 w-[320px] rounded-md bg-neutral-950 p-4">
          <code className="text-white">{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
    })
  }


  return (
    <DashboardLayout key={"produto"} title="Produto">

      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Produtos</h1>
            <p className="text-gray-600">
              Gerencie o catálogo de óculos da sua loja.
            </p>
          </div>
          {isAdmin() && (
            <>
              <Dialog>
                <DialogTrigger>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Produto
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Novo produto</DialogTitle>
                    <DialogDescription>
                      Informe os campos abaixo para adicionar um novo produto.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="">
                      <ScrollArea className="h-100">
                        <FormField
                          control={form.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem className="mb-3">
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input placeholder="shadcn" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem className="mb-3">
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input placeholder="shadcn" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem className="mb-3">
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input placeholder="shadcn" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem className="mb-3">
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input placeholder="shadcn" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem className="mb-3">
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input placeholder="shadcn" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem className="mb-3">
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input placeholder="shadcn" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </ScrollArea>
                      {/* <div>
                      <Label htmlFor="nome" className="mb-1"> Nome</Label>
                      <Input type="nome" placeholder="Nome" />
                      <Label htmlFor="descricao" className="mb-1 mt-3">Descrição</Label>
                      <Input type="descricao" placeholder="Descrição" />
                      <Label htmlFor="preco" className="mb-1 mt-3">Preço</Label>
                      <Input type="preco" placeholder="Preço" />
                      <Label htmlFor="estoque" className="mb-1 mt-3">Estoque</Label>
                      <Input type="estoque" placeholder="Estoque" />
                      <Label htmlFor="referencia" className="mb-1 mt-3"> Referência</Label>
                      <Input type="referencia" placeholder="Referência" />
                      <Label htmlFor="material" className="mb-1 mt-3">Material</Label>
                      <Input type="material" placeholder="Material" />
                      <Label htmlFor="genero" className="mb-1 mt-3">Gênero</Label>
                      <Input type="genero" placeholder="Gênero" />
                      <Label htmlFor="cor" className="mb-1 mt-3">Cor da Armação</Label>
                      <Input type="cor" placeholder="Cor da Armação" />
                      <Label htmlFor="tipoLente" className="mb-1 mt-3">Tipo da Lente</Label>
                      <Input type="tipoLente" placeholder="Tipo da Lente" />
                      <Label htmlFor="formato" className="mb-1 mt-3">Formato da Armação</Label>
                      <Input type="formato" placeholder="Formato da Armação" />
                      <Label htmlFor="categoria" className="mb-1 mt-3">Categoria</Label>
                      <Input type="cor" placeholder="Cor da Armação" />
                      <Label htmlFor="marca" className="mb-1 mt-3">Marca</Label>
                      <Input type="marca" placeholder="Marca" />
                    </div> */}
                      <DialogFooter>
                        <Button type="submit">Cadastrar</Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </>

          )}
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Nome ou SKU do produto..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Categoria</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todas as categorias</option>
                  <option value="oculos-sol">Óculos de Sol</option>
                  <option value="oculos-grau">Óculos de Grau</option>
                  <option value="lentes-contato">Lentes de Contato</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Marca</label>
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todas as marcas</option>
                  <option value="ray-ban">Ray-Ban</option>
                  <option value="oakley">Oakley</option>
                  <option value="prada">Prada</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-48 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
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
                  <h3 className="font-medium">Erro ao carregar produtos</h3>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Products Grid */}
        {!isLoading && !error && (
          <>
            <div className="flex justify-between items-center">
              <p className="text-gray-600">
                {products.length} produto(s) encontrado(s)
              </p>
            </div>

            {products.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhum produto encontrado
                  </h3>
                  <p className="text-gray-600">
                    Tente ajustar os filtros ou adicionar novos produtos.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <Card key={product.id} className="overflow-hidden">
                    <div className="aspect-square bg-gray-100 relative">
                      {product.images.length > 0 ? (
                        <img
                          src={product.images[0].url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-16 w-16 text-gray-400" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <Badge variant={product.isActive ? "default" : "secondary"}>
                          {product.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <h3 className="font-semibold text-lg line-clamp-2">
                          {product.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          SKU: {product.sku}
                        </p>
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold text-green-600">
                            R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                          <span className="text-sm text-gray-600">
                            Estoque: {product.stock}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-gray-500">
                          <span>{product.category?.name}</span>
                          <span>{product.brand?.name}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 mt-4">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                        {isAdmin() && (
                          <>
                            <Button variant="outline" size="sm" className="flex-1">
                              <Edit className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
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

