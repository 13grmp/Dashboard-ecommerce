import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authMiddleware, adminMiddleware } from '@/lib/auth/middleware';

// Listar produtos com filtros e paginação
export async function GET(req: NextRequest) {
  try {
    // Extrair parâmetros de consulta
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const search = url.searchParams.get('search') || '';
    const category = url.searchParams.get('category') || '';
    const brand = url.searchParams.get('brand') || '';
    const gender = url.searchParams.get('gender') || '';
    const minPrice = parseFloat(url.searchParams.get('minPrice') || '0');
    const maxPrice = parseFloat(url.searchParams.get('maxPrice') || '999999');
    const sortBy = url.searchParams.get('sortBy') || 'createdAt';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';

    // Validar parâmetros
    const validPage = page > 0 ? page : 1;
    const validLimit = limit > 0 && limit <= 50 ? limit : 10;
    const skip = (validPage - 1) * validLimit;

    // Construir filtros
    const filters: any = {
      isActive: true,
      price: {
        gte: minPrice,
        lte: maxPrice,
      },
      stock: {
        gte: 0
      }
    };

    if (search) {
      filters.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      filters.category = {
        slug: category,
      };
    }

    if (brand) {
      filters.brand = {
        name: { equals: brand, mode: 'insensitive' },
      };
    }

    if (gender) {
      filters.gender = gender;
    }

    // Construir ordenação
    const orderBy: any = {};
    if (sortBy === 'price') {
      orderBy.price = sortOrder;
    } else if (sortBy === 'name') {
      orderBy.name = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    // Buscar produtos
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: filters,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          brand: {
            select: {
              id: true,
              name: true,
              logo: true,
            },
          },
          images: {
            where: {
              isMain: true,
            },
            take: 1,
          },
        },
        orderBy,
        skip,
        take: validLimit,
      }),
      prisma.product.count({
        where: filters,
      }),
    ]);

    // Calcular informações de paginação
    const totalPages = Math.ceil(total / validLimit);
    const hasNextPage = validPage < totalPages;
    const hasPrevPage = validPage > 1;

    return NextResponse.json({
      products,
      pagination: {
        page: validPage,
        limit: validLimit,
        total,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (error) {
    console.error('Erro ao listar produtos:', error);
    return NextResponse.json(
      { error: 'Erro ao listar produtos. Tente novamente mais tarde.' },
      { status: 500 }
    );
  }
}

// Criar um novo produto (apenas administradores)
export async function POST(req: NextRequest) {
  return adminMiddleware(req, async (req, user) => {
    try {
      // Extrair dados do corpo da requisição
      const body = await req.json();
      const {
        name,
        description,
        price,
        stock,
        sku,
        material,
        gender,
        frameColor,
        lensColor,
        frameShape,
        categoryId,
        brandId,
        images,
      } = body;

      // Validar dados
      if (!name || !description || !price || !sku || !categoryId || !brandId) {
        return NextResponse.json(
          { error: 'Todos os campos obrigatórios devem ser preenchidos.' },
          { status: 400 }
        );
      }

      // Verificar se o SKU já existe
      const existingProduct = await prisma.product.findUnique({
        where: { sku },
      });

      if (existingProduct) {
        return NextResponse.json(
          { error: 'Este SKU já está em uso.' },
          { status: 409 }
        );
      }

      // Gerar slug a partir do nome
      const slug = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, '-');

      // Criar o produto
      const product = await prisma.product.create({
        data: {
          name,
          description,
          price: parseFloat(price),
          stock: stock || 0,
          sku,
          slug,
          material,
          gender,
          frameColor,
          lensColor,
          frameShape,
          categoryId,
          brandId,
          images: images
            ? {
                create: images.map((image: any, index: number) => ({
                  url: image.url,
                  alt: image.alt || `${name} - Imagem ${index + 1}`,
                  isMain: image.isMain || index === 0,
                })),
              }
            : undefined,
        },
        include: {
          category: true,
          brand: true,
          images: true,
        },
      });

      return NextResponse.json(
        { message: 'Produto criado com sucesso.', product },
        { status: 201 }
      );
    } catch (error) {
      console.error('Erro ao criar produto:', error);
      return NextResponse.json(
        { error: 'Erro ao criar produto. Tente novamente mais tarde.' },
        { status: 500 }
      );
    }
  });
}

