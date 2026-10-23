import React from 'react';
import './Skeleton.css';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  borderRadius,
  className = '',
  style,
  ...props
}) => {
  const customStyles: React.CSSProperties = {
    ...style,
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
    ...(borderRadius ? { borderRadius } : {}),
  };

  return (
    <div
      aria-hidden="true"
      className={`skeleton ${className}`}
      style={customStyles}
      {...props}
    />
  );
};
