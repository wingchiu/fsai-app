import { NextApiRequest, NextApiResponse } from 'next';
import { writeFile, readdir, unlink, access, mkdir } from 'fs/promises';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Ensure we don't send multiple responses
  if (res.writableEnded) return;

  const imagesDir = path.join(process.cwd(), 'public', 'images');
  
  try {
    // Ensure images directory exists
    await mkdir(imagesDir, { recursive: true });

    switch (req.method) {
      case 'GET':
        try {
          const { userId } = req.query;
          const files = await readdir(imagesDir);
          const userFiles = files.filter(file => file.startsWith(`${userId}-`));
          return res.status(200).json({ files: userFiles });
        } catch (error) {
          console.error('Error reading directory:', error);
          return res.status(500).json({ error: 'Failed to retrieve images' });
        }

      case 'POST':
        try {
          const { imageData, type, index, userId } = req.body;
          const fileName = `${userId}-${type}${index}.jpg`;
          const filePath = path.join(imagesDir, fileName);
          
          await writeFile(filePath, Buffer.from(imageData.split(',')[1], 'base64'));
          return res.status(200).json({ fileName });
        } catch (error) {
          console.error('Error saving file:', error);
          return res.status(500).json({ error: 'Failed to save image' });
        }

      case 'DELETE':
        try {
          const { fileName } = req.query;
          const filePath = path.join(imagesDir, fileName as string);
          
          try {
            await access(filePath);
            await unlink(filePath);
            return res.status(200).json({ message: 'File deleted successfully' });
          } catch {
            return res.status(200).json({ message: 'File not found' });
          }
        } catch (error) {
          console.error('Error deleting file:', error);
          return res.status(500).json({ error: 'Failed to delete file' });
        }

      default:
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 