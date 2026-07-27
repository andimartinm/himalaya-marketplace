import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';

export async function PUT(request: Request) {
    try {
        const url = new URL(request.url);
        const filePath = url.searchParams.get('path');

        if (!filePath) {
            return NextResponse.json({ error: 'Missing path' }, { status: 400 });
        }

        const arrayBuffer = await request.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);

        const fullPath = join(process.cwd(), 'public', filePath);
        const dirPath = dirname(fullPath);

        await mkdir(dirPath, { recursive: true });
        await writeFile(fullPath, buffer);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Local mock upload error:', error);
        return NextResponse.json({ error: 'Failed to save file locally' }, { status: 500 });
    }
}
