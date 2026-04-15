"use client";

export function PrismLoader() {
  return (
    <div className="prism-container">
      <div className="prism-core">
        <div className="face front"></div>
        <div className="face back"></div>
        <div className="face right"></div>
        <div className="face left"></div>
        <div className="face top"></div>
        <div className="face bottom"></div>
      </div>
      
      <style jsx>{`
        .prism-container {
          width: 48px;
          height: 48px;
          perspective: 400px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-left: 0.5rem;
        }

        .prism-core {
          width: 20px;
          height: 20px;
          position: relative;
          transform-style: preserve-3d;
          animation: spin-prism 4s infinite cubic-bezier(0.4, 0, 0.2, 1);
        }

        .face {
          position: absolute;
          width: 20px;
          height: 20px;
          border: 1px solid rgba(255, 255, 255, 0.8);
          background: linear-gradient(135deg, rgba(99,102,241,0.6), rgba(168,85,247,0.7));
          box-shadow: 0 0-12px rgba(168, 85, 247, 0.6) inset;
          backdrop-filter: blur(2px);
        }

        .front  { transform: translateZ(10px); }
        .back   { transform: rotateY(180deg) translateZ(10px); }
        .right  { transform: rotateY(90deg) translateZ(10px); }
        .left   { transform: rotateY(-90deg) translateZ(10px); }
        .top    { transform: rotateX(90deg) translateZ(10px); }
        .bottom { transform: rotateX(-90deg) translateZ(10px); }

        @keyframes spin-prism {
          0% { transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg); }
          50% { transform: rotateX(180deg) rotateY(360deg) rotateZ(180deg); }
          100% { transform: rotateX(360deg) rotateY(720deg) rotateZ(360deg); }
        }
      `}</style>
    </div>
  );
}
