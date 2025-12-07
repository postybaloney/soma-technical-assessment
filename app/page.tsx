"use client"
import { Todo } from '@prisma/client';
import { useState, useEffect } from 'react';
import Select from 'react-select';

export default function Home() {
  const [newTodo, setNewTodo] = useState('');
  const [dueDate, setDueDate] = useState(''); // State for due date
  const [todos, setTodos] = useState<Todo[]>([]); // Specify Todo type
  const [dependencies, setDependencies] = useState<number[]>([]); // State for dependencies

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const res = await fetch('/api/todos?criticalPath=true');
      const data: { todos: Todo[]; criticalPath: number[]; earliestStartDates: Record<number, string> } = await res.json();
      setTodos(data.todos);
    } catch (error) {
      console.error('Failed to fetch todos:', error);
    }
  };

  const handleAddTodo = async () => {
    if (!newTodo.trim()) return;
    try {
      await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTodo, dueDate, dependencyIds: dependencies }), // Include dependencies
      });
      setNewTodo('');
      setDueDate('');
      setDependencies([]); // Reset dependencies
      fetchTodos();
    } catch (error) {
      console.error('Failed to add todo:', error);
    }
  };

  const handleDeleteTodo = async (id: number) => {
    try {
      await fetch(`/api/todos/${id}`, {
        method: 'DELETE',
      });
      fetchTodos(); // Refresh the list after deletion
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  const dependencyOptions = (todos || []).map((todo: Todo) => ({
    value: todo.id,
    label: todo.title,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-500 to-red-500 flex flex-col items-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-4xl font-bold text-center text-white mb-8">Things To Do App</h1>
        <div className="flex mb-6">
          <input
            type="text"
            className="flex-grow p-3 rounded-l-full focus:outline-none text-gray-700"
            placeholder="Add a new todo"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
          />
          <input
            type="date"
            className="p-3 text-gray-700"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
          <Select
            isMulti
            options={dependencyOptions}
            onChange={(selectedOptions) =>
              setDependencies(selectedOptions.map((option) => option.value))
            }
            className="w-full"
          />
          <button
            onClick={handleAddTodo}
            className="bg-white text-indigo-600 p-3 rounded-r-full hover:bg-gray-100 transition duration-300"
          >
            Add
          </button>
        </div>
        <ul className="bg-white rounded-lg shadow-md p-4">
          {(todos || []).map((todo) => (
            <li
              key={todo.id}
              className="flex justify-between items-center p-2 border-b last:border-b-0"
            >
              <div>
                <h3 className="font-bold text-lg">{todo.title}</h3>
                <p
                  className={
                    new Date(todo.dueDate) < new Date()
                      ? "text-red-500"
                      : "text-gray-700"
                  }
                >
                  Due: {new Date(todo.dueDate).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => handleDeleteTodo(todo.id)}
                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
