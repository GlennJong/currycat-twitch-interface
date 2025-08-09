import React, { useState, useEffect } from 'react';
import './style.css';
import Checkbox from '../Checkbox';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

const TodoList: React.FC = () => {
  const [todos, setTodos] = useState<Todo[] | null>(null);
  // 初始化時載入 localStorage
  useEffect(() => {
    setTodos(loadTodosFromLocalStorage());
  }, []);

  // todos 變動時自動儲存（僅在 todos 不為 null 時）
  useEffect(() => {
    if (todos !== null) {
      saveTodosToLocalStorage(todos);
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
      {/* <h2>Todo List</h2> */}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            const event = e as unknown as { isComposing?: boolean; key: string };
            if (!event.isComposing && event.key === 'Enter') addTodo();
          }}
          placeholder="..."
          style={{ flex: 1 }}
        />
        <button onClick={addTodo} style={{ padding: '8px 16px' }}>新增</button>
      </div>
      <div style={{
          listStyle: 'none',
          margin: '0 -6px',
          marginTop: '12px',
        }}
      >
        <ul style={{
          padding: 0,
          margin: 0,
          listStyle: 'none',
        }}>
          {todos.map(todo => (
            <li
              key={todo.id}
              style={{
                display: 'flex',
                opacity: todo.completed ? 0.6 : 1,
              }}
            >
              <Checkbox
                label=""
                checked={todo.completed}
                style={{ marginTop: '2px' }}
                onChange={() => toggleTodo(todo.id)}
              />
              <span style={{ flex: 1, marginLeft: 4, lineBreak: 'anywhere', textDecoration: todo.completed ? 'line-through' : 'none' }}>{todo.text}</span>
              <span style={{ cursor: 'pointer', fontWeight: 'bold', marginLeft: '4px' }} onClick={() => deleteTodo(todo.id)}>x</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

// 新增工具函數來處理 localStorage 的存取
const loadTodosFromLocalStorage = (): Todo[] => {
  const saved = localStorage.getItem('todos');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  }
  return [];
};

const saveTodosToLocalStorage = (todos: Todo[]) => {
  localStorage.setItem('todos', JSON.stringify(todos));
};

export default TodoList;
