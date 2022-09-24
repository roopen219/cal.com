import { mapValues, toNumber } from "lodash";
import type { NextApiRequest, NextApiResponse } from "next";

import verifyAdminToken from "@lib/auth/verifyAdminToken";
import prisma from "@lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await verifyAdminToken(req);
  } catch (err) {
    res.status(422).json({ message: (err as Error).message });
  }

  const { type, key, userId, appId } = req.body;

  if (req.method === "POST") {
    const credential = await prisma.credential.create({
      data: {
        type,
        key,
        userId,
        appId,
      },
    });
    return res.status(201).json({ message: "Credential created", data: credential });
  }

  if (req.method === "GET") {
    const credential = await prisma.credential.findMany({
      where: {
        ...mapValues(req.query || {}, (val, key) => {
          if (key === "id" || key === "userId") {
            return toNumber(val);
          }
          return val;
        }),
      },
    });
    return res.status(200).json({ data: credential });
  }

  res.status(405).json({ message: "Method Not Allowed" });
}
