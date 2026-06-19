import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import { v4 as uuidv4 } from "uuid";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "dummy_client_id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "dummy_client_secret",
    }),
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
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        await connectToDatabase();
        
        let existingUser = await User.findOne({ email: user.email });
        if (!existingUser) {
          // Buat user baru dari data Google
          existingUser = await User.create({
            uid: `google_${profile.sub}`,
            email: user.email,
            name: user.name,
            image: user.image,
            isAnonymous: false,
            tier: "free",
          });
        } else {
          // Update data jika ada perubahan di Google
          existingUser.name = user.name;
          existingUser.image = user.image;
          await existingUser.save();
        }
        
        // Tambahkan properti custom ke objek user agar masuk ke JWT
        user.uid = existingUser.uid;
        user.role = "user";
        user.dbId = existingUser._id.toString();
        user.tier = existingUser.tier;
        return true;
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.uid = user.uid;
        token.role = user.role;
        token.dbId = user.dbId || user.id;
        token.tier = user.tier || "free";
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.uid = token.uid;
        session.user.role = token.role;
        session.user.dbId = token.dbId;
        session.user.tier = token.tier;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    signOut: "/logout",
  },
  secret: process.env.NEXTAUTH_SECRET || "default_secret_for_development",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
