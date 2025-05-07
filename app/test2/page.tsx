'use client';

import React, { useEffect, useState } from 'react';

export default function CounterExample() {
  const [count, setCount] = useState(0);

  console.log('🔄 Component Rendered');

  // 버튼 클릭 핸들러
  const handleClick = () => {
    console.log('🟡 Button Clicked');
    setCount((prev) => {
      console.log(`🟠 setCount called → prev: ${prev}`);
      return prev + 1;
    });
  };

  // useEffect: count 값 변경 시마다 실행됨
  useEffect(() => {
    console.log(`🟢 useEffect: count is now ${count}`);
  }, [count]);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">🧪 Counter Test</h1>
      <p className="text-lg">Current count: {count}</p>
      <button
        onClick={handleClick}
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
      >
        +1 점 추가
      </button>
    </div>
  );
}
