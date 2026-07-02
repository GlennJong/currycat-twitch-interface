import { checkbox, checkboxLight } from "@/utils/frame";
import './style.css';


const Switch = ({ theme='dark', disabled=false, checked, label, onChange, style }: { theme?: 'dark' | 'light', checked: boolean, disabled?: boolean, label: string, style?: React.CSSProperties, onChange: (value: boolean) => void }) => {
  return (
    <label className="checkbox" style={{ opacity: disabled ? 0.5 : 1, ...style}}>
      <div className="checkbox-icon">
        <img
          style={{ transform: `translateX(${checked ? '0%' : '-50%'})` }}
          height={18}
          src={theme === 'dark' ? checkbox : checkboxLight}
          alt=""
        />
      </div>
      <input
        type="checkbox"
        disabled={disabled}
        checked={checked}
        onChange={() => onChange(!checked)}
      />
      <span>{label}</span>
    </label>
  )
}

export default Switch;