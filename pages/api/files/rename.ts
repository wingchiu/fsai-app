import { NextApiRequest, NextApiResponse } from 'next';
import { rename, access, copyFile, unlink } from 'fs/promises';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const { oldFileName, newFileName } = req.body;
    const imagesDir = path.join(process.cwd(), 'public', 'images');
    const oldPath = path.join(imagesDir, oldFileName);
    const newPath = path.join(imagesDir, newFileName);

    // Check if source file exists
    try {
      await access(oldPath);
      
      // Use copy + delete instead of rename for more reliability
      await copyFile(oldPath, newPath);
      await unlink(oldPath);
      
      return res.status(200).json({ 
        message: 'File renamed successfully',
        oldFileName,
        newFileName 
      });
    } catch (err) {
      console.error(`File operation error:`, err);
      return res.status(404).json({ 
        error: 'Source file not found',
        oldFileName,
        newFileName 
      });
    }
  } catch (error) {
    console.error("Rename operation error:", error);
    return res.status(500).json({ 
      error: 'Failed to rename file',
      details: error.message 
    });
  }
} 