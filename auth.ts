import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { findUserByEmail, touchLastLogin, upsertOAuthUser, userExists, verifyPassword } from "@/lib/auth/user-store";
import { validateCredentials } from "@/lib/auth/schema";

export const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login", error: "/login" },
  trustHost: true,
  providers: [
    ...(googleEnabled ? [Google] : []),
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const email = String(raw?.email ?? "");
        const password = String(raw?.password ?? "");
        if (Object.keys(validateCredentials(email, password)).length) throw new CredentialsSignin();
        const user = await findUserByEmail(email);
        if (!user?.passwordHash || !(await verifyPassword(password, user.passwordHash))) throw new CredentialsSignin();
        return { id: user.id, name: user.name, email: user.email, image: user.image ?? null };
      },
    }),
  ],
  events: {
    async signIn({ user }) {
      if (user.email) await touchLastLogin(user.email).catch(() => undefined);
    },
  },
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== "google") return true;
      return Boolean(profile?.email && profile.email_verified);
    },
    async jwt({ token, account, profile, user }) {
      // จำวิธีล็อกอินไว้ — หลังบ้านรับเฉพาะอีเมล + รหัสผ่าน
      if (account) token.provider = account.provider;
      if (account?.provider === "google" && profile?.email) {
        const stored = await upsertOAuthUser({ provider: "google", email: profile.email, name: profile.name, image: (profile as { picture?: string }).picture });
        token.sub = stored.id;
        token.name = stored.name;
        token.picture = stored.image ?? token.picture;
      } else if (user?.id) {
        token.sub = user.id;
        token.picture = user.image ?? null;
      } else if (token.sub && !(await userExists(token.sub))) {
        // บัญชีถูกลบแล้ว → ตัด session ทิ้ง
        return null;
      }
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      session.user.image = token.picture ?? null;
      session.provider = typeof token.provider === "string" ? token.provider : undefined;
      return session;
    },
  },
});
