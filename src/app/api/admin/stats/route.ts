import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { adminMiddleware } from '@/lib/auth/middleware';


// Obter estatísticas para o dashboard administrativo
export async function GET(req: NextRequest) {
  return adminMiddleware(req, async (req, user) => {
    try {
      // Extrair parâmetros de consulta
      const url = new URL(req.url);
      const period = url.searchParams.get('period') || 'all';

      // Definir o período de consulta
      const now = new Date();
      let startDate = new Date();

      switch (period) {
        case '7days':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30days':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90days':
          startDate.setDate(now.getDate() - 90);
          break;
        case '1year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        case 'all':
          startDate = new Date(0); // Início dos tempos
          break;
        default:
          startDate.setDate(now.getDate() - 30);
      }

      // Estatísticas de usuários
      const totalUsers = await prisma.user.count();
      const newUsers = await prisma.user.count({
        where: {
          createdAt: {
            gte: startDate,
          },
        },
      });

      // Estatísticas de produtos
      const totalProducts = await prisma.product.count();
      const activeProducts = await prisma.product.count({
        where: {
          isActive: true,
        },
      });
      const lowStockProducts = await prisma.product.count({
        where: {
          isActive: true,
          stock: {
            lte: 5,
          },
        },
      });

      // Estatísticas de vendas
      const salesData = await prisma.order.aggregate({
        where: {
          status: {
            in: ['PENDING', 'SHIPPED', 'DELIVERED'],
          },
          createdAt: {
            gte: startDate,
          },
        },
        _sum: {
          total: true,
        },
        _count: true,
      });

      const orderEsq = await prisma.user.count({
        where: {
          createdAt: {
            gte: startDate,
          },
        },
      });

      const totalSales = Number(salesData._sum?.total) || 0;
      const completedOrders = Number(salesData._count) || 0;

      // Calcular o valor médio dos pedidos
      const averageOrderValue = completedOrders > 0 ? totalSales / completedOrders : 0;

      // Obter os produtos mais vendidos
      const topProducts = await prisma.orderItem.groupBy({
        by: ['productId'],
        where: {
          order: {
            status: {
              in: ['PENDING', 'SHIPPED', 'DELIVERED'],
            },
            createdAt: {
              gte: startDate,
            },
          },
        },
        _sum: {
          quantity: true,
        },
        orderBy: {
          _sum: {
            quantity: 'desc',
          },
        },
        take: 5,
      });

      const orders = await prisma.order.findMany({
        where: {
          updatedAt: {
            gte: startDate,
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
        include: {
          user: true,
        },
      });

      const result = orders.map((order: typeof orders[number]) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        total: order.total,
        shippingCost: order.shippingCost,
        discount: order.discount,
        createdAt: order.createdAt,
        updateAt: order.updatedAt,
        nomeUsuario: order.user ? order.user.name : null,
      }));

      // Pronto, 'result' tem tudo estruturado.


      // Buscar detalhes dos produtos mais vendidos
      const topProductsDetails = await Promise.all(
        topProducts.map(async (item: any) => {
          const product = await prisma.product.findUnique({
            where: { id: item.productId },
            include: {
              images: {
                where: { isMain: true },
                take: 1,
              },
            },
          });

          const productCategory = await prisma.category.findUnique({
            where: { id: product?.categoryId },
          });

          return {
            id: product?.id,
            name: product?.name,
            sku: product?.sku,
            price: product?.price,
            image: product?.images.length ? product.images[0].url : null,
            quantitySold: item._sum.quantity,
            category: productCategory ? productCategory.name : 'Sem categoria',
          };
        })
      );

      // Obter dados de vendas por dia para o gráfico usando Prisma
      const salesByDay = await prisma.order.groupBy({
        by: ['createdAt'],
        where: {
          status: {
            in: ['PENDING', 'SHIPPED', 'DELIVERED']
          },
          createdAt: {
            gte: startDate
          }
        },
        _sum: {
          total: true
        },
        _count: true,
        orderBy: {
          createdAt: 'asc'
        }
      });

      const formattedSalesByDay = salesByDay.map((sale) => ({
        date: sale.createdAt.toISOString().split('T')[0],
        total: Number(sale._sum.total || 0),
        count: sale._count,
      }));

      return NextResponse.json({
        users: {
          total: totalUsers,
          new: newUsers,
        },
        products: {
          total: totalProducts,
          active: activeProducts,
          lowStock: lowStockProducts,
        },
        orders: result,
        sales: {
          total: totalSales,
          completedOrders,
          averageOrderValue,
          topProducts: topProductsDetails,
          byDay: formattedSalesByDay,
        },
        period,
        startDate,
        endDate: now,
      });


    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return NextResponse.json(
        { error: 'Erro ao obter estatísticas. Tente novamente mais tarde.' },
        { status: 500 }
      );
    }
  });
}

