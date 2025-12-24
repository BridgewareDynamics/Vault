import { motion } from 'framer-motion';
import { CategoryTag as CategoryTagType } from '../../types';

interface CategoryTagProps {
  tag: CategoryTagType;
  size?: 'xs' | 'small' | 'medium' | 'large';
  className?: string;
}

export function CategoryTag({ tag, size = 'medium', className = '' }: CategoryTagProps) {
  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[10px]',
    small: 'px-2 py-0.5 text-xs',
    medium: 'px-3 py-1 text-sm',
    large: 'px-4 py-1.5 text-base',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center justify-center rounded-full font-medium text-white shadow-md ${sizeClasses[size]} ${className}`}
      style={{
        backgroundColor: tag.color,
      }}
    >
      {tag.name}
    </motion.div>
  );
}

