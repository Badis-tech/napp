import { NextResponse } from "next/server";

export async function GET() {
  try {
    // TODO: Integrate with Prisma when database is configured
    const totalUsers = 0;
    const totalRoles = 6;
    const activeSessions = 0;

    return NextResponse.json({ 
      success: true,
      data: { totalUsers, totalRoles, activeSessions } 
    });
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
