import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { adminMiddleware } from '@/lib/auth/middleware';

// Listar categorias (admin)
export async function GET(req: NextRequest) {
  return adminMiddleware(req, async (req, user) => {
    try {
      // Extrair parâmetros de consulta
      const url = new URL(req.url);
      const search = url.searchParams.get('search') || '';
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '10');
      const skip = (page - 1) * limit;

      // Construir filtros
      const filters: any = {};

      if (search) {
        filters.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Buscar total de registros
      const total = await prisma.category.count({
        where: filters
      });

      // Buscar categorias com paginação
      const categories = await prisma.category.findMany({
        where: filters,
        include: {
          _count: {
            select: {
              products: true,
            },
          },
        },
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      });

      // Formatar a resposta
      const formattedCategories = categories.map((category: {
        id: string;
        name: string;
        description: string | null;
        slug: string;
        createdAt: Date;
        updatedAt: Date;
        _count: { products: number };
      }) => ({
        id: category.id,
        name: category.name,
        description: category.description,
        slug: category.slug,
        productCount: category._count.products,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      }));

      return NextResponse.json({
        data: formattedCategories,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Erro ao listar categorias:', error);
      return NextResponse.json(
        { error: 'Erro ao listar categorias. Tente novamente mais tarde.' },
        { status: 500 }
      );
    }
  });
}

// Criar uma nova categoria (admin)
export async function POST(req: NextRequest) {
  return adminMiddleware(req, async (req, user) => {
    try {
      // Extrair dados do corpo da requisição
      const body = await req.json();
      const { name, description } = body;

      // Validar dados
      if (!name) {
        return NextResponse.json(
          { error: 'Nome da categoria é obrigatório.' },
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

      // Verificar se já existe uma categoria com o mesmo slug
      const existingCategory = await prisma.category.findFirst({
        where: { slug },
      });

      if (existingCategory) {
        return NextResponse.json(
          { error: 'Já existe uma categoria com este nome.' },
          { status: 409 }
        );
      }

      // Criar a categoria
      const category = await prisma.category.create({
        data: {
          name,
          description,
          slug,
        },
      });

      return NextResponse.json(
        { message: 'Categoria criada com sucesso.', category },
        { status: 201 }
      );
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      return NextResponse.json(
        { error: 'Erro ao criar categoria. Tente novamente mais tarde.' },
        { status: 500 }
      );
    }
  });
}

