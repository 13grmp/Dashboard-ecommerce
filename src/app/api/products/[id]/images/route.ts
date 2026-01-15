import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { adminMiddleware } from '@/lib/auth/middleware';
import { processUploadedFile, processMultipleFiles, removeFile } from '@/lib/upload';

// Adicionar imagens a um produto
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return adminMiddleware(req, async (req, user) => {
    try {
      const productId = params.id;

      // Verificar se o produto existe
      const product = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        return NextResponse.json(
          { error: 'Produto não encontrado.' },
          { status: 404 }
        );
      }

      // Processar o upload de múltiplas imagens
      const files = await processMultipleFiles(req);

      if (files.length === 0) {
        return NextResponse.json(
          { error: 'Nenhuma imagem enviada.' },
          { status: 400 }
        );
      }

      // Verificar se já existe uma imagem principal
      const hasMainImage = await prisma.productImage.findFirst({
        where: {
          productId,
          isMain: true,
        },
      });

      // Criar registros de imagens no banco de dados
      const images = await Promise.all(
        files.map(async (file, index) => {
          // Se não houver imagem principal e for a primeira imagem, definir como principal
          const isMain = !hasMainImage && index === 0;

          return prisma.productImage.create({
            data: {
              url: file.url,
              alt: `${product.name} - Imagem ${index + 1}`,
              isMain,
              productId,
            },
          });
        })
      );

      return NextResponse.json(
        {
          message: `${files.length} imagens adicionadas com sucesso.`,
          images,
        },
        { status: 201 }
      );
    } catch (error) {
      console.error('Erro ao adicionar imagens ao produto:', error);
      return NextResponse.json(
        { error: 'Erro ao adicionar imagens ao produto. Tente novamente mais tarde.' },
        { status: 500 }
      );
    }
  });
}

// Listar imagens de um produto
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id;

    // Verificar se o produto existe
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Produto não encontrado.' },
        { status: 404 }
      );
    }

    // Buscar imagens do produto
    const images = await prisma.productImage.findMany({
      where: { productId },
      orderBy: [
        { isMain: 'desc' },
        { createdAt: 'asc' },
      ],
    });

    return NextResponse.json(images);
  } catch (error) {
    console.error('Erro ao listar imagens do produto:', error);
    return NextResponse.json(
      { error: 'Erro ao listar imagens do produto. Tente novamente mais tarde.' },
      { status: 500 }
    );
  }
}

