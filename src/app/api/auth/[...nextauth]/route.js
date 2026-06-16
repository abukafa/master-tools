import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import { v4 as uuidv4 } from "uuid";

export const authOptions = {
  providers: [
    CredentialsProvider({
      id: "anonymous",
      name: "Anonymous",
      credentials: {},
      async authorize(credentials, req) {
        await connectToDatabase();
        
        // Buat akun anonim baru dengan UUID
        const guestUid = `guest_${uuidv4()}`;
        
        const newUser = await User.create({
          uid: guestUid,
          isAnonymous: true,
          tier: "free",
        });

        if (newUser) {
          return { id: newUser._id.toString(), uid: newUser.uid, role: "anonymous" };
        }
        
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = user.uid;
        token.role = user.role;
        token.dbId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.uid = token.uid;
        session.user.role = token.role;
        session.user.dbId = token.dbId;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "default_secret_for_development",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
