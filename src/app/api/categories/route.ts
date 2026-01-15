import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Listar todas as categorias
export async function GET(req: NextRequest) {
  try {
    const categories = await prisma.category.findMany({
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
    const formattedCategories = categories.map((category) => ({
      id: category.id,
      name: category.name,
      description: category.description,
      slug: category.slug,
      productCount: category._count.products,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    }));

    return NextResponse.json(formattedCategories);
  } catch (error) {
    console.error('Erro ao listar categorias:', error);
    return NextResponse.json(
      { error: 'Erro ao listar categorias. Tente novamente mais tarde.' },
      { status: 500 }
    );
  }
}

