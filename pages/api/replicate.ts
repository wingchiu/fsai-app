import { NextApiRequest, NextApiResponse } from 'next';
import Replicate from 'replicate';
import { writeFile } from "node:fs/promises";
import path from "node:path";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_KEY, // Use your API key from environment variables
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { input, userId } = req.body;
      const output = await replicate.run("cuuupid/idm-vton:c871bb9b046607b680449ecbae55fd8c6d945e0a1948644bf2361b3d021d3ff4", { input });
      
      const fileName = `${userId}-result.jpg`;
      await writeFile(path.join(process.cwd(), 'public', 'images', fileName), output);
            
      res.status(200).json({ fileName });
    } catch (error) {
      console.error("Error running Replicate model:", error);
      res.status(500).json({ error: 'Failed to generate image' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
