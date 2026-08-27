interface IconProps {
  IconComponent: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  className?: string;
};

const Icon = ({ IconComponent, className }: IconProps) => {
  return <IconComponent className={className} />;
};

export default Icon;
