import React, { useState, useEffect } from 'react';
import './style.css';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

const TodoList: React.FC = () => {
  const [todos, setTodos] = useState<Todo[] | null>(null);
  // 初始化時載入 localStorage
  // 初始化時載入 localStorage
  useEffect(() => {
    const saved = localStorage.getItem('todos');
    if (saved) {
      try {
        setTodos(JSON.parse(saved));
      } catch {
        setTodos([]);
      }
    } else {
      setTodos([]);
    }
  }, []);

  // todos 變動時自動儲存（僅在 todos 不為 null 時）
  useEffect(() => {
    if (todos !== null) {
      localStorage.setItem('todos', JSON.stringify(todos));
    }
  }, [todos]);
  const [input, setInput] = useState('');

  const addTodo = () => {
    if (input.trim() === '' || todos === null) return;
    setTodos([
      ...todos,
      { id: Date.now(), text: input.trim(), completed: false },
    ]);
    setInput('');
  };

  const toggleTodo = (id: number) => {
    if (todos === null) return;
    setTodos(
      todos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (id: number) => {
    if (todos === null) return;
    setTodos(todos.filter(todo => todo.id !== id));
  };

  if (todos === null) return null;
  return (
    <div style={{ maxWidth: 400, margin: '0 auto', padding: 20 }}>
      <h2>Todo List</h2>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') addTodo();
          }}
          placeholder="新增待辦事項..."
          style={{ flex: 1, padding: 8 }}
        />
        <button onClick={addTodo} style={{ padding: '8px 16px' }}>新增</button>
      </div>
      <ul style={{ listStyle: 'none', padding: 0, marginTop: 16 }}>
        {todos.map(todo => (
          <li
            key={todo.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: 8,
              background: '#f5f5f5',
              borderRadius: 4,
              padding: '8px 12px',
              textDecoration: todo.completed ? 'line-through' : 'none',
              opacity: todo.completed ? 0.6 : 1,
            }}
          >
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
              style={{ marginRight: 8 }}
            />
            <span style={{ flex: 1 }}>{todo.text}</span>
            <button onClick={() => deleteTodo(todo.id)} style={{ marginLeft: 8 }}>刪除</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TodoList;
