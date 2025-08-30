import { checkbox, checkboxLight } from "@/utils/frame";


const Switch = ({ theme='dark', disabled=false, checked, label, onChange, style }: { theme?: 'dark' | 'light', checked: boolean, disabled?: boolean, label: string, style?: React.CSSProperties, onChange: (value: boolean) => void }) => {
  return (
    <label style={{ display: 'flex', alignItems: 'center', opacity: disabled ? 0.5 : 1, ...style}}>
      <div style={{ width: '18px', height: '18px', overflow: 'hidden' }}>
        <img
          style={{ display: 'block', transform: `translateX(${checked ? '0%' : '-50%'})` }}
          height={18}
          src={theme === 'dark' ? checkbox : checkboxLight}
          alt=""
        />
      </div>
      <input
        type="checkbox"
        disabled={disabled}
        checked={checked}
        style={{ display: 'none' }}
        onChange={() => onChange(!checked)}
      />
      <span style={{ marginLeft: '6px' }}>{label}</span>
    </label>
  )
}

export default Switch;