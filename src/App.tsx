import { useEffect } from "react";

export default function App() {
  useEffect(() => {
    const mj = (window as any).MathJax;
    if (mj?.typesetPromise) {
      mj.typesetPromise();
    }
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h1>LMS Toán học đã chạy 🎉</h1>

      <p>
        Công thức test: $\\int_0^1 x^2 dx = \\frac{1}{3}$
      </p>
    </div>
  );
}
