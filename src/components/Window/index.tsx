import { ReactNode } from 'react';
import './style.css';
import { frame } from '../../utils/frame';

const Window = ({
  children,
}: {
  children: ReactNode;
}) => {


  return (
    <div
      className="window"
      style={{
        width: '100%',
        height: '100%',
        borderImage: `url(${frame})`,
        borderImageSlice: '49% 49% fill',
        borderImageWidth: '32px',
      }}
    >
      <div
        className="content"
        style={{ padding: '32px', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}
      >
        {children}
      </div>
    </div>
  );
};

export default Window;