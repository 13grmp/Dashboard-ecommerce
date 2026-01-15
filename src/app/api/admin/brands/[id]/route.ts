import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { adminMiddleware } from '@/lib/auth/middleware';

// Obter detalhes de uma marca específica (admin)
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return adminMiddleware(req, async (req, user) => {
    try {
      const brandId = params.id;

      // Buscar a marca
      const brand = await prisma.brand.findUnique({
        where: { id: brandId },
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

      if (!brand) {
        return NextResponse.json(
          { error: 'Marca não encontrada.' },
          { status: 404 }
        );
      }

      // Formatar a resposta
      const formattedBrand = {
        id: brand.id,
        name: brand.name,
        description: brand.description,
        slug: brand.slug,
        productCount: brand._count.products,
        createdAt: brand.createdAt,
        updatedAt: brand.updatedAt,
        products: brand.products.map((product:any) => ({
          id: product.id,
          name: product.name,
          sku: product.sku,
          price: product.price,
          stock: product.stock,
          image: product.images.length > 0 ? product.images[0].url : null,
        })),
      };

      return NextResponse.json(formattedBrand);
    } catch (error) {
      console.error('Erro ao buscar detalhes da marca:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar detalhes da marca. Tente novamente mais tarde.' },
        { status: 500 }
      );
    }
  });
}

// Atualizar uma marca (admin)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return adminMiddleware(req, async (req, user) => {
    try {
      const brandId = params.id;
      const body = await req.json();
      const { name, description } = body;

      // Verificar se a marca existe
      const existingBrand = await prisma.brand.findUnique({
        where: { id: brandId },
      });

      if (!existingBrand) {
        return NextResponse.json(
          { error: 'Marca não encontrada.' },
          { status: 404 }
        );
      }

      // Validar dados
      if (!name) {
        return NextResponse.json(
          { error: 'Nome da marca é obrigatório.' },
          { status: 400 }
        );
      }

      // Gerar slug a partir do nome (se o nome foi alterado)
      let slug = existingBrand.slug;
      if (name !== existingBrand.name) {
        slug = name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^\w\s]/g, '')
          .replace(/\s+/g, '-');

        // Verificar se já existe outra marca com o mesmo slug
        const brandWithSlug = await prisma.brand.findFirst({
          where: {
            slug,
            id: { not: brandId },
          },
        });

        if (brandWithSlug) {
          return NextResponse.json(
            { error: 'Já existe outra marca com este nome.' },
            { status: 409 }
          );
        }
      }

      // Atualizar a marca
      const updatedBrand = await prisma.brand.update({
        where: { id: brandId },
        data: {
          name,
          description,
          slug,
        },
      });

      return NextResponse.json({
        message: 'Marca atualizada com sucesso.',
        brand: updatedBrand,
      });
    } catch (error) {
      console.error('Erro ao atualizar marca:', error);
      return NextResponse.json(
        { error: 'Erro ao atualizar marca. Tente novamente mais tarde.' },
        { status: 500 }
      );
    }
  });
}

// Excluir uma marca (admin)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return adminMiddleware(req, async (req, user) => {
    try {
      const brandId = params.id;

      // Verificar se a marca existe
      const existingBrand = await prisma.brand.findUnique({
        where: { id: brandId },
        include: {
          _count: {
            select: {
              products: true,
            },
          },
        },
      });

      if (!existingBrand) {
        return NextResponse.json(
          { error: 'Marca não encontrada.' },
          { status: 404 }
        );
      }

      // Verificar se a marca tem produtos associados
      if (existingBrand._count.products > 0) {
        return NextResponse.json(
          { error: 'Não é possível excluir uma marca com produtos associados.' },
          { status: 400 }
        );
      }

      // Excluir a marca
      await prisma.brand.delete({
        where: { id: brandId },
      });

      return NextResponse.json({
        message: 'Marca excluída com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao excluir marca:', error);
      return NextResponse.json(
        { error: 'Erro ao excluir marca. Tente novamente mais tarde.' },
        { status: 500 }
      );
    }
  });
}

