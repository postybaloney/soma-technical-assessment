import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Todo } from '@prisma/client';

export async function GET() {
  try {
    const todos = await prisma.todo.findMany({
      select: {
        id: true,
        title: true,
        createdAt: true,
        dueDate: true, // Ensure dueDate is included
        imageUrl: true, // Ensure imageUrl is included
      },
    });

    return NextResponse.json(todos);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching todos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { title, dueDate, dependencyIds } = await request.json();
    if (!title || title.trim() === '') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    const todo = await prisma.todo.create({
      data: {
        title,
        dueDate: dueDate ? new Date(dueDate) : null, // Parse dueDate if provided
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