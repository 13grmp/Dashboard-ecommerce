import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { adminMiddleware } from '@/lib/auth/middleware';
import { removeFile } from '@/lib/upload';

// Obter uma imagem específica
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; imageId: string } }
) {
  try {
    const { id: productId, imageId } = params;

    // Verificar se a imagem existe e pertence ao produto
    const image = await prisma.productImage.findFirst({
      where: {
        id: imageId,
        productId,
      },
    });

    if (!image) {
      return NextResponse.json(
        { error: 'Imagem não encontrada.' },
        { status: 404 }
      );
    }

    return NextResponse.json(image);
  } catch (error) {
    console.error('Erro ao buscar imagem:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar imagem. Tente novamente mais tarde.' },
      { status: 500 }
    );
  }
}

// Atualizar uma imagem (alt text, isMain)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; imageId: string } }
) {
  return adminMiddleware(req, async (req, user) => {
    try {
      const { id: productId, imageId } = params;
      const body = await req.json();
      const { alt, isMain } = body;

      // Verificar se a imagem existe e pertence ao produto
      const image = await prisma.productImage.findFirst({
        where: {
          id: imageId,
          productId,
        },
      });

      if (!image) {
        return NextResponse.json(
          { error: 'Imagem não encontrada.' },
          { status: 404 }
        );
      }

      // Se estiver definindo esta imagem como principal, remover a flag de outras imagens
      if (isMain) {
        await prisma.productImage.updateMany({
          where: {
            productId,
            id: { not: imageId },
          },
          data: {
            isMain: false,
          },
        });
      }

      // Atualizar a imagem
      const updatedImage = await prisma.productImage.update({
        where: { id: imageId },
        data: {
          alt: alt || undefined,
          isMain: isMain !== undefined ? isMain : undefined,
        },
      });

      return NextResponse.json({
        message: 'Imagem atualizada com sucesso.',
        image: updatedImage,
      });
    } catch (error) {
      console.error('Erro ao atualizar imagem:', error);
      return NextResponse.json(
        { error: 'Erro ao atualizar imagem. Tente novamente mais tarde.' },
        { status: 500 }
      );
    }
  });
}

// Excluir uma imagem
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; imageId: string } }
) {
  return adminMiddleware(req, async (req, user) => {
    try {
      const { id: productId, imageId } = params;

      // Verificar se a imagem existe e pertence ao produto
      const image = await prisma.productImage.findFirst({
        where: {
          id: imageId,
          productId,
        },
      });

      if (!image) {
        return NextResponse.json(
          { error: 'Imagem não encontrada.' },
          { status: 404 }
        );
      }

      // Verificar se é a única imagem do produto
      const imageCount = await prisma.productImage.count({
        where: { productId },
      });

      if (imageCount === 1) {
        return NextResponse.json(
          { error: 'Não é possível excluir a única imagem do produto.' },
          { status: 400 }
        );
      }

      // Se a imagem excluída for a principal, definir outra imagem como principal
      if (image.isMain) {
        const anotherImage = await prisma.productImage.findFirst({
          where: {
            productId,
            id: { not: imageId },
          },
        });

        if (anotherImage) {
          await prisma.productImage.update({
            where: { id: anotherImage.id },
            data: { isMain: true },
          });
        }
      }

      // Remover o arquivo físico
      removeFile(image.url);

      // Excluir o registro da imagem
      await prisma.productImage.delete({
        where: { id: imageId },
      });

      return NextResponse.json({
        message: 'Imagem excluída com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao excluir imagem:', error);
      return NextResponse.json(
        { error: 'Erro ao excluir imagem. Tente novamente mais tarde.' },
        { status: 500 }
      );
    }
  });
}

