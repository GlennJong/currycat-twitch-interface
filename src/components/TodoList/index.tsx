import React, { useState, useEffect, useRef } from 'react';
import './style.css';
import Checkbox from '../Checkbox';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

type TodoListProps = {
  showInput?: boolean;
}

const TodoList: React.FC<TodoListProps> = ({ showInput = true }) => {
  const [todos, setTodos] = useState<Todo[] | null>(null);
  const instanceIdRef = useRef<string>(Math.random().toString(36).slice(2));
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
  // Broadcast local changes to other windows (dock/overlay)
  useEffect(() => {
    if (todos === null) return;
    try {
      if (typeof (window as any).BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('currycat-dock');
        bc.postMessage({ type: 'todo-list', payload: todos, source: instanceIdRef.current });
        bc.close();
      }
    } catch (e) {
      console.error(e)
    }
  }, [todos]);

  // Listen for external updates (from Dock)
  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    if (typeof (window as any).BroadcastChannel !== 'undefined') {
      bc = new BroadcastChannel('currycat-dock');
      bc.onmessage = (ev) => {
        if (!ev.data) return;
        if (ev.data.source === instanceIdRef.current) return;
        if (ev.data.type === 'todo-list' && ev.data.payload) {
          try {
            setTodos(ev.data.payload);
          } catch (e) {
            console.error(e)
          }
        }
      };
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'todos') {
        try {
          const parsed = JSON.parse(e.newValue || '[]');
          setTodos(parsed);
        } catch (e) {
          console.error(e)
        }
      }
    };

    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
      if (bc) bc.close();
    };
  }, []);
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
    <div className="todolist">
      {showInput && (
        <div className="todolist-input">
          <input
            type="text"
            value={input}
            autoFocus={showInput}
            tabIndex={1}
            spellCheck="true"
            onChange={e => setInput(e.target.value)}
            onCompositionEnd={() => {
              // 當組字結束時，不做任何事
            }}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              // 如果正在組字中，不處理任何按鍵
              if ((e.nativeEvent as any).isComposing) return;
              
              // 只有在不是組字狀態，且按下 Enter 時才新增
              if (e.key === 'Enter') {
                addTodo();
              }
            }}
            placeholder="..."
          />
          <button onClick={addTodo}>新增</button>
        </div>
      )}
      <div className="todolist-list">
        <ul className="todolist-ul">
          {todos.map(todo => (
            <li
              key={todo.id}
              className={`todolist-item${todo.completed ? ' completed' : ''}`}
            >
              <Checkbox
                label=""
                checked={todo.completed}
                style={{ marginTop: '2px' }}
                onChange={() => toggleTodo(todo.id)}
              />
              <span className="text">{todo.text}</span>
              <span className="delete" onClick={() => deleteTodo(todo.id)}>x</span>
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
