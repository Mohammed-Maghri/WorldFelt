import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';

// GET /api/feelings - Get all feelings
export async function GET() {
  try {
    const feelings = await prisma.feeling.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 100, // Limit to last 100 feelings for performance
    });

    return NextResponse.json(feelings);
  } catch (error) {
    console.error('Error fetching feelings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feelings' },
      { status: 500 }
    );
  }
}

// POST /api/feelings - Create a new feeling
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required. Please login.' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token. Please login again.' },
        { status: 401 }
      );
    }

    // Check if user already shared today (1 feeling per day limit)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingTodayFeeling = await prisma.feeling.findFirst({
      where: {
        userId: payload.userId,
        createdAt: {
          gte: today,
        },
      },
    });

    if (existingTodayFeeling) {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const hoursLeft = Math.ceil((tomorrow.getTime() - Date.now()) / (1000 * 60 * 60));
      
      return NextResponse.json(
        { 
          error: 'Daily limit reached',
          message: `You've already shared a feeling today. Come back in ${hoursLeft} hours!`
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { latitude, longitude, feeling, comment } = body;
    // Fix: Prevent very long comments
    if (comment && comment.length > 100) {
      return NextResponse.json(
        { error: 'Comment is too long. Please keep it under 100 characters.' },
        { status: 400 }
      );
    }
    // Validate required fields
    if (!latitude || !longitude || !feeling) {
      return NextResponse.json(
        { error: 'Missing required fields: latitude, longitude, feeling' },
        { status: 400 }
      );
    }

    // Validate latitude and longitude ranges
    if (latitude < -90 || latitude > 90) {
      return NextResponse.json(
        { error: 'Invalid latitude. Must be between -90 and 90' },
        { status: 400 }
      );
    }

    if (longitude < -180 || longitude > 180) {
      return NextResponse.json(
        { error: 'Invalid longitude. Must be between -180 and 180' },
        { status: 400 }
      );
    }

    // Create the feeling with userId
    const newFeeling = await prisma.feeling.create({
      data: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        feeling,
        comment: comment || null,
        userId: payload.userId,
      },
    });

    return NextResponse.json(newFeeling, { status: 201 });
  } catch (error) {
    console.error('Error creating feeling:', error);
    return NextResponse.json(
      { error: 'Failed to create feeling' },
      { status: 500 }
    );
  }
}
