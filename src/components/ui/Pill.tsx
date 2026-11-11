import Link from 'next/link';
import Arrow from './Arrow';

type Props = {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  className?: string;
  solid?: boolean;
  type?: 'button' | 'submit';
};

/** Outline pill with a long arrow (or a custom icon), as on the reference: "EXPLORE IN 3D ⟶". */
export default function Pill({ children, href, onClick, icon, className = '', solid = false, type = 'button' }: Props) {
  const cls = `pill ${solid ? 'pill-solid' : ''} ${className}`;
  const inner = (
    <>
      <span>{children}</span>
      {icon ?? <Arrow />}
    </>
  );
  if (href)
    return (
      <Link href={href} className={cls} onClick={onClick}>
        {inner}
      </Link>
    );
  return (
    <button type={type} className={cls} onClick={onClick}>
      {inner}
    </button>
  );
}
