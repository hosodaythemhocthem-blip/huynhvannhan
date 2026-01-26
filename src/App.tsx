import { useEffect } from "react";

export default function App() {
  useEffect(() => {
    const mj = (window as any).MathJax;
    if (!mj) return;

    mj.startup.promise.then(() => {
      mj.typesetPromise();
    });
  }, []);

  return (
    <div className="p-6 tex-process">
      <h1 className="text-2xl font-bold">
        LMS Toán học đã chạy 🎉
      </h1>

      <p className="mt-4">
        Công thức test: $\\int_0^1 x^2 dx = \\frac{1}{3}$
      </p>
    </div>
  );
}
