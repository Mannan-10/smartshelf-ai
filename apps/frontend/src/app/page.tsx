'use client';

import { useEffect, useState } from 'react';

type HealthResponse = {
  status: string;
  database: string;
  products: number;
};

export default function Home() {
  const [health, setHealth] = useState<HealthResponse | null>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`)
      .then((res) => res.json())
      .then((data) => setHealth(data))
      .catch((error) => console.error(error));
  }, []);

  return (
    <main className="min-h-screen p-10">
      <h1 className="text-3xl font-bold">SmartShelf AI</h1>

      <p className="mt-4 text-gray-600">
        Retail inventory forecasting and expiry management platform.
      </p>

      <div className="mt-8 rounded-lg border p-4">
        <h2 className="text-xl font-semibold">Backend Health</h2>

        {health ? (
          <pre className="mt-4 rounded p-4">
            {JSON.stringify(health, null, 2)}
          </pre>
        ) : (
          <p className="mt-4">Checking backend...</p>
        )}
      </div>
    </main>
  );
}