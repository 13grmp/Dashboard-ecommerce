import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

// Diretório de upload
const UPLOAD_DIR = process.env.UPLOAD_DIR || './public/uploads';

// Tipos de arquivos permitidos
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Tamanho máximo do arquivo (5MB)
const MAX_SIZE = 5 * 1024 * 1024;

// Interface para o arquivo processado
export interface ProcessedFile {
  filename: string;
  path: string;
  size: number;
  mimetype: string;
  url: string;
}

/**
 * Processa um arquivo de imagem enviado via FormData
 */
export async function processUploadedFile(
  req: NextRequest,
  fieldName: string = 'image'
): Promise<ProcessedFile | null> {
  try {
    // Verificar se o diretório de upload existe, se não, criar
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }

    // Processar o FormData
    const formData = await req.formData();
    const file = formData.get(fieldName) as File;

    if (!file) {
      return null;
    }

    // Verificar o tipo do arquivo
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error('Tipo de arquivo não permitido. Apenas JPEG, PNG e WebP são aceitos.');
    }

    // Verificar o tamanho do arquivo
    if (file.size > MAX_SIZE) {
      throw new Error('Arquivo muito grande. O tamanho máximo permitido é 5MB.');
    }

    // Gerar um nome único para o arquivo
    const extension = file.name.split('.').pop() || 'jpg';
    const filename = `${uuidv4()}.${extension}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    // Converter o arquivo para um Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Salvar o arquivo
    fs.writeFileSync(filepath, buffer);

    // Retornar informações do arquivo
    const relativePath = filepath.replace('./public', '');
    return {
      filename,
      path: filepath,
      size: file.size,
      mimetype: file.type,
      url: relativePath,
    };
  } catch (error) {
    console.error('Erro ao processar upload de arquivo:', error);
    throw error;
  }
}

/**
 * Processa múltiplos arquivos de imagem enviados via FormData
 */
export async function processMultipleFiles(
  req: NextRequest,
  fieldName: string = 'images'
): Promise<ProcessedFile[]> {
  try {
    // Verificar se o diretório de upload existe, se não, criar
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }

    // Processar o FormData
    const formData = await req.formData();
    const files: File[] = [];
    
    // Coletar todos os arquivos do campo especificado
    formData.forEach((value, key) => {
      if (key === fieldName && value instanceof File) {
        files.push(value);
      }
    });

    if (files.length === 0) {
      return [];
    }

    const processedFiles: ProcessedFile[] = [];

    // Processar cada arquivo
    for (const file of files) {
      // Verificar o tipo do arquivo
      if (!ALLOWED_TYPES.includes(file.type)) {
        throw new Error(`Tipo de arquivo não permitido: ${file.name}. Apenas JPEG, PNG e WebP são aceitos.`);
      }

      // Verificar o tamanho do arquivo
      if (file.size > MAX_SIZE) {
        throw new Error(`Arquivo muito grande: ${file.name}. O tamanho máximo permitido é 5MB.`);
      }

      // Gerar um nome único para o arquivo
      const extension = file.name.split('.').pop() || 'jpg';
      const filename = `${uuidv4()}.${extension}`;
      const filepath = path.join(UPLOAD_DIR, filename);

      // Converter o arquivo para um Buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Salvar o arquivo
      fs.writeFileSync(filepath, buffer);

      // Adicionar informações do arquivo à lista
      const relativePath = filepath.replace('./public', '');
      processedFiles.push({
        filename,
        path: filepath,
        size: file.size,
        mimetype: file.type,
        url: relativePath,
      });
    }

    return processedFiles;
  } catch (error) {
    console.error('Erro ao processar upload de múltiplos arquivos:', error);
    throw error;
  }
}

/**
 * Remove um arquivo do sistema de arquivos
 */
export function removeFile(filepath: string): boolean {
  try {
    // Verificar se o caminho é relativo à pasta public
    let fullPath = filepath;
    if (filepath.startsWith('/')) {
      fullPath = path.join('./public', filepath);
    }

    // Verificar se o arquivo existe
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Erro ao remover arquivo:', error);
    return false;
  }
}

