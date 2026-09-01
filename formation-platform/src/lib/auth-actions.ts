"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";
import { slugify } from "@/lib/slug";
import { AuthError } from "next-auth";

const accountTypeSchema = z.enum(["apprenant", "formateur", "professionnel"]);

const registerSchema = z.object({
  name: z.string().trim().min(2, "Le nom est trop court"),
  email: z.email("Email invalide"),
  password: z.string().min(8, "8 caractères minimum"),
  accountType: accountTypeSchema,
  organizationName: z.string().trim().optional(),
  organizationType: z.string().trim().optional(),
});

export type FormState = { error?: string } | undefined;

export async function registerAccount(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    accountType: formData.get("accountType") ?? "apprenant",
    organizationName: formData.get("organizationName") ?? undefined,
    organizationType: formData.get("organizationType") ?? undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };
  }

  const { name, password, accountType } = parsed.data;
  const email = parsed.data.email.toLowerCase();

  if (accountType === "professionnel" && !parsed.data.organizationName?.trim()) {
    return { error: "Le nom de l'organisation est requis pour un compte professionnel" };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Un compte existe déjà avec cet email" };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const role = accountType === "apprenant" ? "LEARNER" : "CREATOR";

  const user = await prisma.user.create({
    data: { name, email, passwordHash, role },
  });

  if (accountType === "professionnel") {
    const orgName = parsed.data.organizationName!.trim();
    const orgType = (parsed.data.organizationType || "COMPANY") as
      | "SCHOOL"
      | "UNIVERSITY"
      | "COMPANY"
      | "GOVERNMENT"
      | "NGO"
      | "INDEPENDENT";

    const baseSlug = slugify(orgName) || "organisation";
    let slug = baseSlug;
    let n = 1;
    while (await prisma.organization.findUnique({ where: { slug } })) {
      n += 1;
      slug = `${baseSlug}-${n}`;
    }

    await prisma.organization.create({
      data: {
        name: orgName,
        slug,
        type: orgType,
        memberships: { create: { userId: user.id, role: "OWNER" } },
      },
    });
  }

  const redirectTo = accountType === "apprenant" ? "/mon-apprentissage" : "/admin";

  await signIn("credentials", { email, password, redirectTo });
}

export async function loginAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const callbackUrl = String(formData.get("callbackUrl") ?? "/mon-apprentissage");

  try {
    await signIn("credentials", { email, password, redirectTo: callbackUrl });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Email ou mot de passe incorrect" };
    }
    throw error;
  }
}
