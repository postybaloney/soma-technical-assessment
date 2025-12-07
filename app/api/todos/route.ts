import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const todos = await prisma.todo.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
        dueDate: true, // Include dueDate in the response
        imageUrl: true, // Include imageUrl in the response
        dependenciesTo: {
          select: {
            fromTask: {
              select: {
                id: true,
                title: true,
                dueDate: true, // Include dueDate for dependencies
              },
            },
          },
        },
      },
    });

    // Transform dependenciesTo to a simpler format
    const transformedTodos = todos.map((todo) => ({
      ...todo,
      dependencies: todo.dependenciesTo.map((dep) => dep.fromTask),
    }));

    return NextResponse.json(transformedTodos);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching todos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { title, dueDate, dependencies } = await request.json();
    if (!title || title.trim() === '') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    let imageUrl = null;
    try {
      const pexelsResponse = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(title)}&per_page=1`, {
        headers: {
          Authorization: 'zMZX5MBHpdATHJe9pvNS4fKdiC8ESkf0600eZbqWVkgpaSbfUZ2VgXOa',
        },
      });
      const pexelsData = await pexelsResponse.json();
      if (pexelsData.photos && pexelsData.photos.length > 0) {
        imageUrl = pexelsData.photos[0].src.medium; // Use the medium-sized image
      }
    } catch (pexelsError) {
      console.error('Failed to fetch image from Pexels API:', pexelsError);
    }

    // Create the task
    const todo = await prisma.todo.create({
      data: {
        title,
        dueDate: dueDate ? new Date(dueDate) : null,
        imageUrl,
      },
    });

    // Handle dependencies
    if (dependencies && dependencies.length > 0) {
      const dependencyRecords = dependencies.map((depId: number) => ({
        fromTaskId: depId,
        toTaskId: todo.id,
      }));

      // Prevent circular dependencies
      const circularDependency = await prisma.dependency.findFirst({
        where: {
          fromTaskId: todo.id,
          toTaskId: { in: dependencies },
        },
      });

      if (circularDependency) {
        return NextResponse.json({ error: 'Circular dependency detected' }, { status: 400 });
      }

      await prisma.dependency.createMany({ data: dependencyRecords });
    }

    return NextResponse.json(todo, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Error creating todo' }, { status: 500 });
  }
}