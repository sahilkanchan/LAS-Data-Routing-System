
interface PanelProps {
  children: Readonly<React.ReactNode>
}

const Panel = ({ children }: PanelProps) => {
  return (
    <div className="block w-full bg-white rounded-md border border-gray-300 shadow-sm p-2">
      { children }
    </div>
  )
}

export default Panel;