import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, adminMiddleware } from '@/lib/auth/middleware';
import { processUploadedFile, processMultipleFiles } from '@/lib/upload';

// Upload de uma única imagem
export async function POST(req: NextRequest) {
  return authMiddleware(req, async (req, user) => {
    try {
      const file = await processUploadedFile(req);

      if (!file) {
        return NextResponse.json(
          { error: 'Nenhum arquivo enviado.' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          message: 'Arquivo enviado com sucesso.',
          file: {
            url: file.url,
            filename: file.filename,
            size: file.size,
            mimetype: file.mimetype,
          },
        },
        { status: 201 }
      );
    } catch (error: any) {
      console.error('Erro ao fazer upload de arquivo:', error);
      return NextResponse.json(
        { error: error.message || 'Erro ao fazer upload de arquivo.' },
        { status: 500 }
      );
    }
  });
}

// Upload de múltiplas imagens
export async function PUT(req: NextRequest) {
  return authMiddleware(req, async (req, user) => {
    try {
      const files = await processMultipleFiles(req);

      if (files.length === 0) {
        return NextResponse.json(
          { error: 'Nenhum arquivo enviado.' },
          { status: 400 }
        );
      }

      const fileInfos = files.map((file) => ({
        url: file.url,
        filename: file.filename,
        size: file.size,
        mimetype: file.mimetype,
      }));

      return NextResponse.json(
        {
          message: `${files.length} arquivos enviados com sucesso.`,
          files: fileInfos,
        },
        { status: 201 }
      );
    } catch (error: any) {
      console.error('Erro ao fazer upload de múltiplos arquivos:', error);
      return NextResponse.json(
        { error: error.message || 'Erro ao fazer upload de arquivos.' },
        { status: 500 }
      );
    }
  });
}

