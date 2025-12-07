import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Todo } from '@prisma/client';

const PEXELS_API_KEY = 'zMZX5MBHpdATHJe9pvNS4fKdiC8ESkf0600eZbqWVkgpaSbfUZ2VgXOa';
const PEXELS_API_URL = 'https://api.pexels.com/v1/search';

async function fetchImageUrl(query: string): Promise<string | null> {
  try {
    const response = await fetch(`${PEXELS_API_URL}?query=${encodeURIComponent(query)}&per_page=1`, {
      headers: {
        Authorization: PEXELS_API_KEY,
      },
    });
    const data = await response.json();
    if (data.photos && data.photos.length > 0) {
      return data.photos[0].src.medium; // Return the medium-sized image URL
    }
    return null;
  } catch (error) {
    console.error('Error fetching image from Pexels:', error);
    return null;
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const includeCriticalPath = url.searchParams.get('criticalPath') === 'true';

  try {
    const todos = await prisma.todo.findMany({
      include: {
        dependencies: true,
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
        dueDate: true, // Ensure dueDate is included
        imageUrl: true, // Ensure imageUrl is included
        dependencies: true, // Ensure dependencies are included
      },
    });

    if (includeCriticalPath) {
      const { criticalPath, earliestStartDates } = calculateCriticalPath(todos);
      return NextResponse.json({ todos, criticalPath, earliestStartDates });
    }

    return NextResponse.json(todos);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching todos' }, { status: 500 });
  }
}

function calculateCriticalPath(todos: Todo[]) {
  const graph = new Map<number, number[]>();
  const inDegree = new Map<number, number>();
  const earliestStartDates = new Map<number, Date>();

  // Build the graph and initialize in-degree
  todos.forEach((todo) => {
    graph.set(todo.id, []);
    inDegree.set(todo.id, 0);
    earliestStartDates.set(todo.id, new Date(todo.createdAt));
  });

  todos.forEach((todo) => {
    todo.dependencies.forEach((dep) => {
      graph.get(dep.id)?.push(todo.id);
      inDegree.set(todo.id, (inDegree.get(todo.id) || 0) + 1);
    });
  });

  // Topological sort and calculate earliest start dates
  const queue: number[] = [];
  inDegree.forEach((degree, id) => {
    if (degree === 0) queue.push(id);
  });

  const criticalPath: number[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    criticalPath.push(current);

    graph.get(current)?.forEach((neighbor) => {
      inDegree.set(neighbor, (inDegree.get(neighbor) || 0) - 1);
      if (inDegree.get(neighbor) === 0) queue.push(neighbor);

      const currentEndDate = new Date(earliestStartDates.get(current)!);
      currentEndDate.setDate(currentEndDate.getDate() + 1); // Assume 1 day per task
      if (earliestStartDates.get(neighbor)! < currentEndDate) {
        earliestStartDates.set(neighbor, currentEndDate);
      }
    });
  }

  return { criticalPath, earliestStartDates: Object.fromEntries(earliestStartDates) };
}

export async function POST(request: Request) {
  try {
    const { title, dueDate, dependencyIds } = await request.json();
    if (!title || title.trim() === '') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Validate circular dependencies
    const todos: Todo[] = await prisma.todo.findMany({
      include: { dependencies: true },
    });
    const hasCircularDependency = checkCircularDependency(dependencyIds, todos);
    if (hasCircularDependency) {
      return NextResponse.json({ error: 'Circular dependency detected' }, { status: 400 });
    }

    const imageUrl = await fetchImageUrl(title); // Fetch image URL from Pexels

    const todo = await prisma.todo.create({
      data: {
        title,
        dueDate: dueDate ? new Date(dueDate) : null,
        imageUrl, // Save the fetched image URL
        dependencies: {
          connect: dependencyIds?.map((id: number) => ({ id })), // Connect dependencies
        },
      },
      include: {
        dependencies: true, // Include dependencies in the response
      },
    });
    return NextResponse.json(todo, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Error creating todo' }, { status: 500 });
  }
}

function checkCircularDependency(dependencyIds: number[], todos: Todo[]): boolean {
  const graph = new Map<number, number[]>();

  // Build the graph
  todos.forEach((todo) => {
    graph.set(todo.id, todo.dependencies.map((dep: Todo) => dep.id));
  });

  // Check for cycles using DFS
  const visited = new Set<number>();
  const stack = new Set<number>();

  const dfs = (node: number): boolean => {
    if (stack.has(node)) return true; // Cycle detected
    if (visited.has(node)) return false;

    visited.add(node);
    stack.add(node);

    for (const neighbor of graph.get(node) || []) {
      if (dfs(neighbor)) return true;
    }

    stack.delete(node);
    return false;
  };

  for (const id of dependencyIds) {
    if (dfs(id)) return true;
  }

  return false;
}