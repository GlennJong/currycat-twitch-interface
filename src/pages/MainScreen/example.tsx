import { useContext } from 'react';
import { GlobalSettingContext } from '@/App';

function Example() {
  const { id, setId } = useContext(GlobalSettingContext);
  return (
    <div>
      <input value={id} onChange={e => setId?.(e.target.value)} />
    </div>
  );
}

export default Example;
