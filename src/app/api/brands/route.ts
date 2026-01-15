import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Listar todas as marcas
export async function GET(req: NextRequest) {
  try {
    const brands = await prisma.brand.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            products: {
              where: { isActive: true },
            },
          },
        },
      },
    });

    // Formatar a resposta para incluir a contagem de produtos
    const formattedBrands = brands.map((brand) => ({
      id: brand.id,
      name: brand.name,
      description: brand.description,
      logo: brand.logo,
      productCount: brand._count.products,
      createdAt: brand.createdAt,
      updatedAt: brand.updatedAt,
    }));

    return NextResponse.json(formattedBrands);
  } catch (error) {
    console.error('Erro ao listar marcas:', error);
    return NextResponse.json(
      { error: 'Erro ao listar marcas. Tente novamente mais tarde.' },
      { status: 500 }
    );
  }
}

