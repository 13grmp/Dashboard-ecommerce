"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TopProductsTableProps {
  Product: Product[];
}

interface Product {
  category: string;
  id: number;
  image: string;
  name: string;
  price: string;
  quantitySold: number;
  sku: string;
}

export function TopProductsTable(props: TopProductsTableProps) {
  return (
    <>
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Produtos Mais Vendidos</CardTitle>
          <CardDescription>
            Os 5 produtos mais vendidos este mês
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead className="text-right">Vendas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {props.Product.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={product.image} alt={product.name} />
                        <AvatarFallback>{product.name.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <span>{product.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>{product.price}</TableCell>
                  <TableCell className="text-right">{product.quantitySold}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}

