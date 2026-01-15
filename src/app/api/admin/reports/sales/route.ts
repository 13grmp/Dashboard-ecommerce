import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { adminMiddleware } from '@/lib/auth/middleware';

// Obter relatório de vendas (admin)
export async function GET(req: NextRequest) {
  return adminMiddleware(req, async (req, user) => {
    try {
      // Extrair parâmetros de consulta
      const url = new URL(req.url);
      const startDateParam = url.searchParams.get('startDate');
      const endDateParam = url.searchParams.get('endDate');
      const groupBy = url.searchParams.get('groupBy') || 'day';

      // Validar e converter datas
      let startDate = new Date();
      let endDate = new Date();

      if (startDateParam) {
        startDate = new Date(startDateParam);
        if (isNaN(startDate.getTime())) {
          return NextResponse.json(
            { error: 'Data inicial inválida.' },
            { status: 400 }
          );
        }
      } else {
        // Padrão: 30 dias atrás
        startDate.setDate(startDate.getDate() - 30);
      }

      if (endDateParam) {
        endDate = new Date(endDateParam);
        if (isNaN(endDate.getTime())) {
          return NextResponse.json(
            { error: 'Data final inválida.' },
            { status: 400 }
          );
        }
      }

      // Validar o agrupamento
      const validGroupings = ['day', 'week', 'month', 'year'];
      if (!validGroupings.includes(groupBy)) {
        return NextResponse.json(
          { error: 'Agrupamento inválido. Use day, week, month ou year.' },
          { status: 400 }
        );
      }

      // Definir a expressão SQL para o agrupamento
      let dateGroupExpression = '';
      switch (groupBy) {
        case 'day':
          dateGroupExpression = 'DATE(o."createdAt")';
          break;
        case 'week':
          dateGroupExpression = 'DATE_TRUNC(\'week\', o."createdAt")::date';
          break;
        case 'month':
          dateGroupExpression = 'DATE_TRUNC(\'month\', o."createdAt")::date';
          break;
        case 'year':
          dateGroupExpression = 'DATE_TRUNC(\'year\', o."createdAt")::date';
          break;
      }

      // Obter dados de vendas agrupados
      const salesByPeriod = await prisma.$queryRaw`
        SELECT 
          ${dateGroupExpression} as period,
          SUM(o.total) as total,
          COUNT(*) as count
        FROM "Order" o
        WHERE 
          o.status IN ('PAID', 'SHIPPED', 'DELIVERED')
          AND o."createdAt" >= ${startDate}
          AND o."createdAt" <= ${endDate}
        GROUP BY period
        ORDER BY period ASC
      `;

      // Obter vendas por categoria
      const salesByCategory = await prisma.$queryRaw`
        SELECT 
          c.name as category,
          SUM(oi.quantity) as quantity,
          SUM(oi.price * oi.quantity) as total
        FROM "OrderItem" oi
        JOIN "Product" p ON oi."productId" = p.id
        JOIN "Category" c ON p."categoryId" = c.id
        JOIN "Order" o ON oi."orderId" = o.id
        WHERE 
          o.status IN ('PAID', 'SHIPPED', 'DELIVERED')
          AND o."createdAt" >= ${startDate}
          AND o."createdAt" <= ${endDate}
        GROUP BY c.name
        ORDER BY total DESC
      `;

      // Obter vendas por marca
      const salesByBrand = await prisma.$queryRaw`
        SELECT 
          b.name as brand,
          SUM(oi.quantity) as quantity,
          SUM(oi.price * oi.quantity) as total
        FROM "OrderItem" oi
        JOIN "Product" p ON oi."productId" = p.id
        JOIN "Brand" b ON p."brandId" = b.id
        JOIN "Order" o ON oi."orderId" = o.id
        WHERE 
          o.status IN ('PAID', 'SHIPPED', 'DELIVERED')
          AND o."createdAt" >= ${startDate}
          AND o."createdAt" <= ${endDate}
        GROUP BY b.name
        ORDER BY total DESC
      `;

      // Obter produtos mais vendidos
      const topProducts = await prisma.orderItem.groupBy({
        by: ['productId'],
        where: {
          order: {
            status: {
              in: ['PAID', 'SHIPPED', 'DELIVERED'],
            },
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
        _sum: {
          quantity: true,
          price: true,
        },
        orderBy: {
          _sum: {
            quantity: 'desc',
          },
        },
        take: 10,
      });

      // Buscar detalhes dos produtos mais vendidos
      const topProductsDetails = await Promise.all(
        topProducts.map(async (item:any) => {
          const product = await prisma.product.findUnique({
            where: { id: item.productId },
            include: {
              brand: true,
              category: true,
              images: {
                where: { isMain: true },
                take: 1,
              },
            },
          });

          return {
            id: product?.id,
            name: product?.name,
            sku: product?.sku,
            price: product?.price,
            brand: product?.brand?.name,
            category: product?.category?.name,
            image: product?.images.length ? product.images[0].url : null,
            quantitySold: item._sum.quantity,
            totalSales: item._sum.price,
          };
        })
      );

      // Calcular totais
      const totals = await prisma.order.aggregate({
        where: {
          status: {
            in: ['PAID', 'SHIPPED', 'DELIVERED'],
          },
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: {
          total: true,
          shippingCost: true,
          discount: true,
        },
        _count: true,
      });

      // Calcular o valor médio dos pedidos
      const averageOrderValue = totals._count > 0 ? totals._sum.total / totals._count : 0;

      return NextResponse.json({
        period: {
          startDate,
          endDate,
          groupBy,
        },
        totals: {
          orders: totals._count,
          sales: totals._sum.total,
          shipping: totals._sum.shippingCost,
          discount: totals._sum.discount,
          averageOrderValue,
        },
        salesByPeriod,
        salesByCategory,
        salesByBrand,
        topProducts: topProductsDetails,
      });
    } catch (error) {
      console.error('Erro ao gerar relatório de vendas:', error);
      return NextResponse.json(
        { error: 'Erro ao gerar relatório de vendas. Tente novamente mais tarde.' },
        { status: 500 }
      );
    }
  });
}

