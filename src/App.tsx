import { useEffect } from "react";

export default function App() {
  useEffect(() => {
    if ((window as any).MathJax) {
      (window as any).MathJax.typesetPromise();
    }
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">
        LMS Toán học đã chạy 🎉
      </h1>

      <p className="mt-4">
        Công thức test: $\\int_0^1 x^2 dx = \\frac{1}{3}$
      </p>
    </div>
  );
}
