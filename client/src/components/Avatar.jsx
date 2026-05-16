import { avatarGradient, initials } from '../utils/format.js';

export default function Avatar({ name, size = 'h-8 w-8', className = '' }) {
  return (
    <div
      className={`${size} ${className} grid shrink-0 place-items-center rounded-full bg-gradient-to-br ${avatarGradient(
        name
      )} text-xs font-bold text-white ring-2 ring-[#1A1A1A]`}
      title={name}
    >
      {initials(name)}
    </div>
  );
}
