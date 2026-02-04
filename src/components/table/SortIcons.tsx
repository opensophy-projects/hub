import React from 'react';

interface SortIconProps {
  direction: 'asc' | 'desc' | 'none';
  isDark: boolean;
}

export const SortIcon: React.FC<SortIconProps> = ({ direction, isDark }) => {
  const color = isDark ? '#ffffff' : '#000000';
  const opacity = direction === 'none' ? '0.3' : '0.9';

  if (direction === 'none') {
    return (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ opacity }}
      >
        <path
          d="M8 3L11 6H5L8 3Z"
          fill={color}
          opacity="0.4"
        />
        <path
          d="M8 13L5 10H11L8 13Z"
          fill={color}
          opacity="0.4"
        />
      </svg>
    );
  }

  if (direction === 'asc') {
    return (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ opacity }}
      >
        <path
          d="M8 3L11 6H5L8 3Z"
          fill={color}
        />
        <path
          d="M8 13L5 10H11L8 13Z"
          fill={color}
          opacity="0.2"
        />
        <text
          x="12"
          y="5"
          fontSize="6"
          fill={color}
          fontWeight="600"
        >
          A
        </text>
        <text
          x="12"
          y="11"
          fontSize="6"
          fill={color}
          fontWeight="600"
          opacity="0.5"
        >
          Z
        </text>
      </svg>
    );
  }

  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ opacity }}
    >
      <path
        d="M8 3L11 6H5L8 3Z"
        fill={color}
        opacity="0.2"
      />
      <path
        d="M8 13L5 10H11L8 13Z"
        fill={color}
      />
      <text
        x="12"
        y="5"
        fontSize="6"
        fill={color}
        fontWeight="600"
        opacity="0.5"
      >
        A
      </text>
      <text
        x="12"
        y="11"
        fontSize="6"
        fill={color}
        fontWeight="600"
      >
        Z
      </text>
    </svg>
  );
};
