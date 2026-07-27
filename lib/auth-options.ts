import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from './db';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Credenciales requeridas');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { emprendedor: true },
        });

        if (!user) {
          throw new Error('Usuario no encontrado');
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error('Contraseña incorrecta');
        }

        if (user.status === 'PENDIENTE') {
          throw new Error('Tu cuenta está pendiente de aprobación');
        }

        if (user.status === 'RECHAZADO') {
          throw new Error('Tu cuenta fue rechazada');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: user.role,
          status: user.status,
          barrioId: user.barrioId,
          emprendedorId: user.emprendedor?.id || null,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });

        if (!existingUser) {
          await prisma.user.create({
            data: {
              email: user.email!,
              fullName: user.name || 'Usuario',
              password: '',
              role: 'VECINO',
              status: 'APROBADO',
              emailVerified: new Date(),
            },
          });
        } else {
          const updateData: Record<string, any> = {};
          if (!existingUser.fullName && user.name) updateData.fullName = user.name;
          if (existingUser.status === 'PENDIENTE') updateData.status = 'APROBADO';
          if (!existingUser.emailVerified) updateData.emailVerified = new Date();
          if (Object.keys(updateData).length > 0) {
            await prisma.user.update({
              where: { email: user.email! },
              data: updateData,
            });
          }
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.status = (user as any).status;
        token.barrioId = (user as any).barrioId;
        token.emprendedorId = (user as any).emprendedorId;
      }
      
      // For Google sign in, fetch user data from DB
      if (account?.provider === 'google' && token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          include: { emprendedor: true },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.status = dbUser.status;
          token.barrioId = dbUser.barrioId;
          token.emprendedorId = dbUser.emprendedor?.id || null;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).status = token.status;
        (session.user as any).barrioId = token.barrioId;
        (session.user as any).emprendedorId = token.emprendedorId;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
