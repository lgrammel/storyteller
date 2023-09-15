// pages/api/[filename].ts

import { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { filename } = req.query;

    if (typeof filename !== "string") {
      res.status(400).send("Invalid filename");
      return;
    }

    const filePath = path.join(process.cwd(), "parts", filename);
    const stat = fs.statSync(filePath);

    res.setHeader("Content-Length", stat.size.toString());
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);

    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);
  } catch (error) {
    console.error("Error fetching the MP3 file:", error);
    res.status(500).send("Internal Server Error");
  }
}
