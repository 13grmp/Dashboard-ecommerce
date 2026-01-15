import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { adminMiddleware } from '@/lib/auth/middleware';

// Obter detalhes de uma categoria específica (admin)
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return adminMiddleware(req, async (req, user) => {
    try {
      const categoryId = params.id;

      // Buscar a categoria
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
        include: {
          products: {
            where: { isActive: true },
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
              images: {
                where: { isMain: true },
                take: 1,
              },
            },
          },
          _count: {
            select: {
              products: true,
            },
          },
        },
      });

      if (!category) {
        return NextResponse.json(
          { error: 'Categoria não encontrada.' },
          { status: 404 }
        );
      }

      // Formatar a resposta
      const formattedCategory = {
        id: category.id,
        name: category.name,
        description: category.description,
        slug: category.slug,
        productCount: category._count.products,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
        products: category.products.map((product:any) => ({
          id: product.id,
          name: product.name,
          sku: product.sku,
          price: product.price,
          stock: product.stock,
          image: product.images.length > 0 ? product.images[0].url : null,
        })),
      };

      return NextResponse.json(formattedCategory);
    } catch (error) {
      console.error('Erro ao buscar detalhes da categoria:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar detalhes da categoria. Tente novamente mais tarde.' },
        { status: 500 }
      );
    }
  });
}

// Atualizar uma categoria (admin)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return adminMiddleware(req, async (req, user) => {
    try {
      const categoryId = params.id;
      const body = await req.json();
      const { name, description } = body;

      // Verificar se a categoria existe
      const existingCategory = await prisma.category.findUnique({
        where: { id: categoryId },
      });

      if (!existingCategory) {
        return NextResponse.json(
          { error: 'Categoria não encontrada.' },
          { status: 404 }
        );
      }

      // Validar dados
      if (!name) {
        return NextResponse.json(
          { error: 'Nome da categoria é obrigatório.' },
          { status: 400 }
        );
      }

      // Gerar slug a partir do nome (se o nome foi alterado)
      let slug = existingCategory.slug;
      if (name !== existingCategory.name) {
        slug = name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^\w\s]/g, '')
          .replace(/\s+/g, '-');

        // Verificar se já existe outra categoria com o mesmo slug
        const categoryWithSlug = await prisma.category.findFirst({
          where: {
            slug,
            id: { not: categoryId },
          },
        });

        if (categoryWithSlug) {
          return NextResponse.json(
            { error: 'Já existe outra categoria com este nome.' },
            { status: 409 }
          );
        }
      }

      // Atualizar a categoria
      const updatedCategory = await prisma.category.update({
        where: { id: categoryId },
        data: {
          name,
          description,
          slug,
        },
      });

      return NextResponse.json({
        message: 'Categoria atualizada com sucesso.',
        category: updatedCategory,
      });
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);
      return NextResponse.json(
        { error: 'Erro ao atualizar categoria. Tente novamente mais tarde.' },
        { status: 500 }
      );
    }
  });
}

// Excluir uma categoria (admin)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return adminMiddleware(req, async (req, user) => {
    try {
      const categoryId = params.id;

      // Verificar se a categoria existe
      const existingCategory = await prisma.category.findUnique({
        where: { id: categoryId },
        include: {
          _count: {
            select: {
              products: true,
            },
          },
        },
      });

      if (!existingCategory) {
        return NextResponse.json(
          { error: 'Categoria não encontrada.' },
          { status: 404 }
        );
      }

      // Verificar se a categoria tem produtos associados
      if (existingCategory._count.products > 0) {
        return NextResponse.json(
          { error: 'Não é possível excluir uma categoria com produtos associados.' },
          { status: 400 }
        );
      }

      // Excluir a categoria
      await prisma.category.delete({
        where: { id: categoryId },
      });

      return NextResponse.json({
        message: 'Categoria excluída com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);
      return NextResponse.json(
        { error: 'Erro ao excluir categoria. Tente novamente mais tarde.' },
        { status: 500 }
      );
    }
  });
}

