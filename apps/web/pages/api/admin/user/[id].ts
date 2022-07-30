import { pick } from "lodash";
import type { NextApiRequest, NextApiResponse } from "next";
import z from "zod";

import verifyAdminToken from "@lib/auth/verifyAdminToken";
import prisma from "@lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await verifyAdminToken(req);
  } catch (err) {
    res.status(422).json({ message: (err as Error).message });
  }

  const querySchema = z.object({
    id: z.string().transform((val) => parseInt(val)),
  });

  const parsedQuery = querySchema.safeParse(req.query);
  const userId = parsedQuery.success ? parsedQuery.data.id : null;

  if (!userId) {
    return res.status(400).json({ message: "No user id provided" });
  }

  if (req.method === "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  if (req.method === "PATCH") {
    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        ...pick(req.body.data, [
          "username",
          "name",
          "avatar",
          "timeZone",
          "weekStart",
          "hideBranding",
          "theme",
          "completedOnboarding",
          "plan",
          "verified",
        ]),
        bio: req.body.description ?? req.body.data?.bio,
      },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        emailVerified: true,
        bio: true,
        avatar: true,
        timeZone: true,
        weekStart: true,
        startTime: true,
        endTime: true,
        bufferTime: true,
        hideBranding: true,
        theme: true,
        createdDate: true,
        plan: true,
        completedOnboarding: true,
      },
    });
    return res.status(200).json({ message: "User Updated", data: updatedUser });
  }
}
