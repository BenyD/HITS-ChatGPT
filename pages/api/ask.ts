// pages/api/ask.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const { question, context } = req.body;

    try {
      const response = await fetch(
        `https://api-inference.huggingface.co/models/BenyD/University-QA-Bot`,
        {
          headers: {
            Authorization: `Bearer ${process.env.HF_API_TOKEN}`,
            "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify({
            inputs: {
              question,
              context,
            },
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        res.status(200).json({ answer: data.answer });
      } else {
        res
          .status(response.status)
          .json({ error: data.error || "An error occurred" });
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      res
        .status(500)
        .json({ error: "Error fetching the response from the model" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
