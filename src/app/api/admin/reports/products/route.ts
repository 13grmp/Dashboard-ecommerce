import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { adminMiddleware } from '@/lib/auth/middleware';

// Obter relatório de produtos (admin)
export async function GET(req: NextRequest) {
  return adminMiddleware(req, async (req, user) => {
    try {
      // Extrair parâmetros de consulta
      const url = new URL(req.url);
      const category = url.searchParams.get('category');
      const brand = url.searchParams.get('brand');
      const lowStock = url.searchParams.get('lowStock') === 'true';

      // Construir filtros
      const filters: any = {};

      if (category) {
        filters.categoryId = category;
      }

      if (brand) {
        filters.brandId = brand;
      }

      if (lowStock) {
        filters.stock = { lte: 5 };
      }

      // Estatísticas gerais de produtos
      const totalProducts = await prisma.product.count();
      const activeProducts = await prisma.product.count({
        where: { isActive: true },
      });
      const inactiveProducts = await prisma.product.count({
        where: { isActive: false },
      });
      const lowStockProducts = await prisma.product.count({
        where: {
          isActive: true,
          stock: { lte: 5 },
        },
      });
      const outOfStockProducts = await prisma.product.count({
        where: {
          isActive: true,
          stock: 0,
        },
      });

      // Produtos com filtros aplicados
      const products = await prisma.product.findMany({
        where: filters,
        include: {
          brand: true,
          category: true,
          images: {
            where: { isMain: true },
            take: 1,
          },
          _count: {
            select: {
              orderItems: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      // Calcular vendas para cada produto
      const productsWithSales = await Promise.all(
        products.map(async (product) => {
          const salesData = await prisma.orderItem.aggregate({
            where: {
              productId: product.id,
              order: {
                status: {
                  in: ['PAID', 'SHIPPED', 'DELIVERED'],
                },
              },
            },
            _sum: {
              quantity: true,
              price: true,
            },
          });

          return {
            id: product.id,
            name: product.name,
            sku: product.sku,
            price: product.price,
            stock: product.stock,
            isActive: product.isActive,
            brand: product.brand?.name,
            category: product.category?.name,
            image: product.images.length > 0 ? product.images[0].url : null,
            createdAt: product.createdAt,
            updatedAt: product.updatedAt,
            totalSold: salesData._sum.quantity || 0,
            totalRevenue: salesData._sum.price || 0,
            orderCount: product._count.orderItems,
          };
        })
      );

      // Produtos mais vendidos (geral)
      const topSellingProducts = await prisma.orderItem.groupBy({
        by: ['productId'],
        where: {
          order: {
            status: {
              in: ['PAID', 'SHIPPED', 'DELIVERED'],
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
        take: 10,
      });

      const topSellingDetails = await Promise.all(
        topSellingProducts.map(async (item) => {
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
            stock: product?.stock,
            brand: product?.brand?.name,
            category: product?.category?.name,
            image: product?.images.length ? product.images[0].url : null,
            quantitySold: item._sum.quantity,
          };
        })
      );

      // Produtos com baixo estoque
      const lowStockProductsList = await prisma.product.findMany({
        where: {
          isActive: true,
          stock: { lte: 5 },
        },
        include: {
          brand: true,
          category: true,
          images: {
            where: { isMain: true },
            take: 1,
          },
        },
        orderBy: { stock: 'asc' },
        take: 20,
      });

      // Produtos sem vendas
      const productsWithoutSales = await prisma.product.findMany({
        where: {
          isActive: true,
          orderItems: {
            none: {},
          },
        },
        include: {
          brand: true,
          category: true,
          images: {
            where: { isMain: true },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      // Distribuição por categoria
      const productsByCategory = await prisma.product.groupBy({
        by: ['categoryId'],
        where: { isActive: true },
        _count: true,
      });

      const categoryDistribution = await Promise.all(
        productsByCategory.map(async (item) => {
          const category = await prisma.category.findUnique({
            where: { id: item.categoryId },
          });

          return {
            categoryId: item.categoryId,
            categoryName: category?.name,
            productCount: item._count,
          };
        })
      );

      // Distribuição por marca
      const productsByBrand = await prisma.product.groupBy({
        by: ['brandId'],
        where: { isActive: true },
        _count: true,
      });

      const brandDistribution = await Promise.all(
        productsByBrand.map(async (item) => {
          const brand = await prisma.brand.findUnique({
            where: { id: item.brandId },
          });

          return {
            brandId: item.brandId,
            brandName: brand?.name,
            productCount: item._count,
          };
        })
      );

      return NextResponse.json({
        summary: {
          total: totalProducts,
          active: activeProducts,
          inactive: inactiveProducts,
          lowStock: lowStockProducts,
          outOfStock: outOfStockProducts,
        },
        products: productsWithSales,
        topSelling: topSellingDetails,
        lowStockProducts: lowStockProductsList.map((product) => ({
          id: product.id,
          name: product.name,
          sku: product.sku,
          price: product.price,
          stock: product.stock,
          brand: product.brand?.name,
          category: product.category?.name,
          image: product.images.length > 0 ? product.images[0].url : null,
        })),
        productsWithoutSales: productsWithoutSales.map((product) => ({
          id: product.id,
          name: product.name,
          sku: product.sku,
          price: product.price,
          stock: product.stock,
          brand: product.brand?.name,
          category: product.category?.name,
          image: product.images.length > 0 ? product.images[0].url : null,
          createdAt: product.createdAt,
        })),
        distribution: {
          byCategory: categoryDistribution,
          byBrand: brandDistribution,
        },
      });
    } catch (error) {
      console.error('Erro ao gerar relatório de produtos:', error);
      return NextResponse.json(
        { error: 'Erro ao gerar relatório de produtos. Tente novamente mais tarde.' },
        { status: 500 }
      );
    }
  });
}

