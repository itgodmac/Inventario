import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "@/lib/prisma"
import authConfig from "./auth.config"
import bcrypt from "bcryptjs"
import Credentials from "next-auth/providers/credentials"

console.log("[AUTH] auth.ts module initialized");

export const {
    handlers: { GET, POST },
    auth,
    signIn,
    signOut
} = NextAuth({
    adapter: PrismaAdapter(prisma),
    session: { strategy: "jwt" },
    callbacks: {
        async session({ session, token }) {
            if (token.sub && session.user) {
                session.user.id = token.sub;
                (session.user as any).role = token.role;
            }
            return session;
        },
        async jwt({ token, user }: { token: any, user?: any }) {
            if (user) {
                token.role = (user as any).role;
            }
            return token;
        },
    },
    ...authConfig,
    providers: [
        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                const { email, password } = credentials as any;
                console.log(`[AUTH] authorize called for: ${email}`);

                if (!email || !password) return null;

                try {
                    const user = await (prisma as any).user.findUnique({
                        where: { email }
                    });

                    if (!user || !user.password) {
                        console.log(`[AUTH] User or password not found for: ${email}`);
                        return null;
                    }

                    const passwordsMatch = await bcrypt.compare(password, user.password);
                    console.log(`[AUTH] Password match for ${email}: ${passwordsMatch}`);

                    if (passwordsMatch) return user;
                    return null;
                } catch (error) {
                    console.error("[AUTH] Error in authorize:", error);
                    return null;
                }
            }
        })
    ]
})
