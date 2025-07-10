import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const file = searchParams.get('file');
    const chunk = parseInt(searchParams.get('chunk') || '0');
    const chunkSize = 1000; // Количество записей в одном чанке

    if (!file) {
      return NextResponse.json({ error: 'File parameter is required' }, { status: 400 });
    }

    // Определяем путь к файлу
    const dataDirectory = path.join(process.cwd(), 'public', 'data');
    const filePath = path.join(dataDirectory, `${file}.json`);

    // Читаем файл
    const jsonData = JSON.parse(await fs.readFile(filePath, 'utf8'));

    // Если данные - массив, возвращаем чанк
    if (Array.isArray(jsonData)) {
      const start = chunk * chunkSize;
      const end = start + chunkSize;
      const dataChunk = jsonData.slice(start, end);
      const hasMore = end < jsonData.length;

      return NextResponse.json({
        data: dataChunk,
        hasMore,
        total: jsonData.length,
        currentChunk: chunk
      });
    }

    // Если данные - объект, возвращаем весь объект
    return NextResponse.json(jsonData);

  } catch (error) {
    console.error('Error reading data:', error);
    return NextResponse.json({ error: 'Failed to load data' }, { status: 500 });
  }
} 