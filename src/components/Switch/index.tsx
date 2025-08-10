import { checkbox, checkboxLight } from "@/utils/frame";


const Checkbox = ({ theme='dark', checked, label, onChange, style }: { theme?: 'dark' | 'light', checked: boolean, label: string, style?: React.CSSProperties, onChange: (value: boolean) => void }) => {
  return (
    <label style={{ display: 'flex', alignItems: 'center', ...style}}>
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
        checked={checked}
        style={{ display: 'none' }}
        onChange={() => onChange(!checked)}
      />
      <span style={{ marginLeft: '6px' }}>{label}</span>
    </label>
  )
}

export default Checkbox;