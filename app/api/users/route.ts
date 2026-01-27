import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";

export async function GET() {
    const session = await auth();

    if (!session || (session.user as any).role !== 'admin') {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    try {
        const users = await (prisma as any).user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(users);
    } catch (error) {
        return NextResponse.json({ error: "Error al obtener usuarios" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await auth();

    if (!session || (session.user as any).role !== 'admin') {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    try {
        const { email, password, name, role } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: "Email y contraseña requeridos" }, { status: 400 });
        }

        const existingUser = await (prisma as any).user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return NextResponse.json({ error: "El usuario ya existe" }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await (prisma as any).user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: role || 'auditor'
            }
        });

        return NextResponse.json({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
        });
    } catch (error) {
        console.error("Error creating user:", error);
        return NextResponse.json({ error: "Error al crear usuario" }, { status: 500 });
    }
}
