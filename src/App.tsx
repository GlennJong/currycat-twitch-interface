import { createContext, useEffect, useState } from 'react';
import MainScreen from './pages/MainScreen';
import { Color } from './constants';

// eslint-disable-next-line react-refresh/only-export-components
export const GlobalSettingContext = createContext<{
  id: string | undefined;
  setId?: React.Dispatch<React.SetStateAction<string | undefined>>;
}>({
  id: undefined,
});

function getCookie(name: string): string | undefined {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() ?? undefined;
}

function App() {
  const [ id, setId ] = useState<string>();

  useEffect(() => {
    navigator.wakeLock.request();
    const urlParams = new URLSearchParams(window.location.search);
    const value = urlParams.get('as_id');
    if (value) {
      document.cookie = `as_id=${value}; path=/; max-age=31536000;`;
      setId(value);
    }
  }, []);

  useEffect(() => {
    const styleElement = document.createElement('style');
    const cssVariables = Object.keys(Color)
      .filter(key => isNaN(Number(key))) // Filter out numeric keys from enum
      .map(key => `--color-${key.toLowerCase()}: ${Color[key as keyof typeof Color]};`)
      .join('\n');

    styleElement.innerHTML = `
      :root {
        ${cssVariables}
      }
    `;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  return (
    <GlobalSettingContext.Provider value={{
      id: id || getCookie('id'),
      setId: (value) => {
        if (typeof value === 'undefined') {
          document.cookie = ``;
          setId(undefined);
        }
        else {
          document.cookie = `as_id=${value}; path=/; max-age=31536000;`;
          setId(value);
        }
      },
    }}>
      <div id="App" style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
      }}>
        <MainScreen />
      </div>
    </GlobalSettingContext.Provider>
  )
}

export default App