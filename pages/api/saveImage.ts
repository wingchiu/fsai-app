import { NextApiRequest, NextApiResponse } from 'next';
import { writeFile } from 'fs/promises';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { imageData } = req.body; // Get image data from the request body

      // Define the path where you want to save the image
      const filePath = path.join(process.cwd(), 'public', 'images', 'output.jpg');

      // Write the image data to a file
      await writeFile(filePath, imageData, 'base64'); // Assuming imageData is a Base64 string

      res.status(200).json({ message: 'Image saved successfully', filePath });
    } catch (error) {
      console.error("Error saving image:", error);
      res.status(500).json({ error: 'Failed to save image' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 