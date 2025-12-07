"use client"
import { Todo } from '@prisma/client';
import { useState, useEffect } from 'react';
import { ArrowRightIcon } from '@heroicons/react/solid'; // Import an arrow icon for dependency visualization
import Select, { MultiValue } from 'react-select'; // Import react-select for multi-select dropdown

// Update the `TodoWithDependencies` type to include `dependencies`
type TodoWithDependencies = Todo & {
  dependencies: { id: number; title: string }[];
};

export default function Home() {
  const [newTodo, setNewTodo] = useState('');
  const [dueDate, setDueDate] = useState(''); // State for due date
  const [dueTime, setDueTime] = useState(''); // State for due time
  const [todos, setTodos] = useState<TodoWithDependencies[]>([]);
  const [selectedDependencies, setSelectedDependencies] = useState<number[]>([]); // State for selected dependencies

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const res = await fetch('/api/todos');
      const data = await res.json();
      setTodos(data);
    } catch (error) {
      console.error('Failed to fetch todos:', error);
    }
  };

  const handleAddTodo = async () => {
    if (!newTodo.trim()) return;
    try {
      const dueDateTime = dueDate && dueTime ? `${dueDate}T${dueTime}` : dueDate;
      await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTodo,
          dueDate: dueDateTime,
          dependencies: selectedDependencies, // Include selected dependencies in the request
        }),
      });
      setNewTodo('');
      setDueDate(''); // Reset due date
      setDueTime(''); // Reset due time
      setSelectedDependencies([]); // Reset selected dependencies
      fetchTodos();
    } catch (error) {
      console.error('Failed to add todo:', error);
    }
  };

  const handleDeleteTodo = async (id:any) => {
    try {
      await fetch(`/api/todos/${id}`, {
        method: 'DELETE',
      });
      fetchTodos();
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  // Calculate the earliest start date based on dependencies
  const calculateEarliestStartDate = (dependencies: { dueDate: Date | null }[]) => {
    if (!dependencies || dependencies.length === 0) return null;
    const latestDueDate = dependencies
      .filter((dep) => dep.dueDate)
      .map((dep) => new Date(dep.dueDate!))
      .reduce((latest, current) => (current > latest ? current : latest), new Date(0));
    return latestDueDate;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-500 to-red-500 flex flex-col items-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-4xl font-bold text-center text-white mb-8">Things To Do App</h1>
        <div className="flex items-center justify-center mb-6 space-x-2">
          <input
            type="text"
            className="flex-grow p-3 rounded-full focus:outline-none text-gray-700 border border-gray-300"
            placeholder="Add a new todo"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
          />
          <input
            type="date"
            className="p-3 rounded-full text-gray-700 border border-gray-300"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
          <input
            type="time"
            className="p-3 rounded-full text-gray-700 border border-gray-300"
            value={dueTime}
            onChange={(e) => setDueTime(e.target.value)}
          />
          <Select
            isMulti
            options={todos.map((todo) => ({ value: todo.id, label: todo.title }))}
            onChange={(newValue: MultiValue<{ value: number; label: string }>) =>
              setSelectedDependencies(newValue.map((option) => option.value))}
            className="w-64 rounded-full border border-gray-300"
          />
          <button
            onClick={handleAddTodo}
            className="bg-white text-indigo-600 p-3 rounded-full hover:bg-gray-100 transition duration-300 border border-gray-300"
          >
            Add
          </button>
        </div>

        <ul>
          {todos.map((todo: TodoWithDependencies) => {
            const earliestStartDate = calculateEarliestStartDate(todo.dependencies);
            return (
              <li
                key={todo.id}
                className="flex flex-col justify-between items-center bg-white bg-opacity-90 p-4 mb-4 rounded-lg shadow-lg"
              >
                {/* Display the image inside the task item */}
                {todo.imageUrl ? (
                  <img
                    src={todo.imageUrl}
                    alt={todo.title}
                    className="w-full h-32 object-cover rounded-md mb-2"
                    onError={(e) => {
                      console.error('Image failed to load:', todo.imageUrl);
                      e.currentTarget.src = 'https://via.placeholder.com/150'; // Fallback image
                    }}
                  />
                ) : (
                  <img
                    src="https://via.placeholder.com/150"
                    alt="Placeholder"
                    className="w-full h-32 object-cover rounded-md mb-2"
                  />
                )}
                <span
                  className={`text-gray-800 ${
                    todo.dueDate && new Date(todo.dueDate) < new Date() ? 'text-red-500' : ''
                  }`}
                >
                  {todo.title} {todo.dueDate && `- Due: ${new Date(todo.dueDate).toLocaleString()}`}
                </span>
                {earliestStartDate && (
                  <span className="text-sm text-gray-600">
                    Earliest Start Date: {earliestStartDate.toLocaleString()}
                  </span>
                )}

                {/* Visualize dependencies */}
                {todo.dependencies && todo.dependencies.length > 0 && (
                  <div className="flex items-center mt-2">
                    <span className="text-sm text-gray-600">Depends on:</span>
                    <ul className="flex flex-wrap">
                      {todo.dependencies.map((dep) => (
                        <li key={dep.id} className="flex items-center ml-2">
                          <ArrowRightIcon className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-700 ml-1">{dep.title}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <button
                  onClick={() => handleDeleteTodo(todo.id)}
                  className="text-red-500 hover:text-red-700 transition duration-300"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
