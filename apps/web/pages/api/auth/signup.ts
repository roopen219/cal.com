import { IdentityProvider } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";

import verifyAdminToken from "@lib/auth/verifyAdminToken";
import prisma from "@lib/prisma";
import slugify from "@lib/slugify";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return;
  }

  try {
    await verifyAdminToken(req);
  } catch (err) {
    res.status(422).json({ message: (err as Error).message });
  }

  const data = req.body;
  const { email } = data;
  const username = slugify(data.username || "");
  const userEmail = email?.toLowerCase() || "";

  if (!username) {
    res.status(422).json({ message: "Invalid username" });
    return;
  }

  if (!userEmail || !userEmail.includes("@")) {
    res.status(422).json({ message: "Invalid email" });
    return;
  }

  // There is actually an existingUser if username matches
  // OR if email matches and both username and password are set
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { username },
        {
          AND: [{ email: userEmail }, { password: { not: null } }, { username: { not: null } }],
        },
      ],
    },
  });

  if (existingUser) {
    const message: string =
      existingUser.email !== userEmail ? "Username already taken" : "Email address is already registered";

    return res.status(409).json({ message });
  }

  const user = await prisma.user.upsert({
    where: { email: userEmail },
    update: {
      username,
      emailVerified: new Date(Date.now()),
      identityProvider: IdentityProvider.CAL,
    },
    create: {
      username,
      email: userEmail,
      emailVerified: new Date(Date.now()),
      identityProvider: IdentityProvider.CAL,
      completedOnboarding: true,
      hideBranding: true,
      plan: "PRO",
    },
  });

  // If user has been invitedTo a team, we accept the membership
  if (user.invitedTo) {
    await prisma.membership.update({
      where: {
        userId_teamId: { userId: user.id, teamId: user.invitedTo },
      },
      data: {
        accepted: true,
      },
    });
  }

  res.status(201).json({ message: "Created user", user });
}
