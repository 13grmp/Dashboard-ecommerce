import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { adminMiddleware } from '@/lib/auth/middleware';

// Listar marcas (admin)
export async function GET(req: NextRequest) {
  return adminMiddleware(req, async (req, user) => {
    try {
      // Extrair parâmetros de consulta
      const url = new URL(req.url);
      const search = url.searchParams.get('search') || '';

      // Construir filtros
      const filters: any = {};

      if (search) {
        filters.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Buscar marcas
      const brands = await prisma.brand.findMany({
        where: filters,
        include: {
          _count: {
            select: {
              products: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      });

      // Formatar a resposta
      const formattedBrands = brands.map((brand:any) => ({
        id: brand.id,
        name: brand.name,
        description: brand.description,
        slug: brand.slug,
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
  });
}

// Criar uma nova marca (admin)
export async function POST(req: NextRequest) {
  return adminMiddleware(req, async (req, user) => {
    try {
      // Extrair dados do corpo da requisição
      const body = await req.json();
      const { name, description } = body;

      // Validar dados
      if (!name) {
        return NextResponse.json(
          { error: 'Nome da marca é obrigatório.' },
          { status: 400 }
        );
      }

      // Gerar slug a partir do nome
      const slug = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, '-');

      // Verificar se já existe uma marca com o mesmo slug
      const existingBrand = await prisma.brand.findFirst({
        where: { slug },
      });

      if (existingBrand) {
        return NextResponse.json(
          { error: 'Já existe uma marca com este nome.' },
          { status: 409 }
        );
      }

      // Criar a marca
      const brand = await prisma.brand.create({
        data: {
          name,
          description,
          slug,
        },
      });

      return NextResponse.json(
        { message: 'Marca criada com sucesso.', brand },
        { status: 201 }
      );
    } catch (error) {
      console.error('Erro ao criar marca:', error);
      return NextResponse.json(
        { error: 'Erro ao criar marca. Tente novamente mais tarde.' },
        { status: 500 }
      );
    }
  });
}

