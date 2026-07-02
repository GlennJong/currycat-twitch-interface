import { checkbox, checkboxLight } from "@/utils/frame";
import './style.css';


const Checkbox = ({ theme='dark', checked, label, onChange, style }: { theme?: 'dark' | 'light', checked: boolean, label: string, style?: React.CSSProperties, onChange: (value: boolean) => void }) => {
  return (
    <label className="switch" style={{ ...style}}>
      <div className="switch-icon">
        <img
          style={{ transform: `translateX(${checked ? '0%' : '-50%'})` }}
          height={18}
          src={theme === 'dark' ? checkbox : checkboxLight}
          alt=""
        />
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={() => onChange(!checked)}
      />
      <span>{label}</span>
    </label>
  )
}

export default Checkbox;