export default function GroundStrip({ flip = false }: { flip?: boolean }) {
  return (
    <div
      style={{
        height: 48,
        background: "#5a8c3a",
        borderTop: flip ? "none" : "3px solid #3d6a20",
        borderBottom: flip ? "3px solid #3d6a20" : "none",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Grass tuft row */}
      <div
        style={{
          position: "absolute",
          top: flip ? "auto" : 0,
          bottom: flip ? 0 : "auto",
          left: 0,
          right: 0,
          height: 16,
          backgroundImage: "url('/assets/tiles/ground-tiles.png')",
          backgroundRepeat: "repeat-x",
          backgroundSize: "auto 16px",
          backgroundPosition: "0 0",
          imageRendering: "pixelated",
          opacity: 0.85,
        }}
      />
      {/* Dirt row below */}
      <div
        style={{
          position: "absolute",
          top: flip ? 0 : 16,
          bottom: flip ? 16 : "auto",
          left: 0,
          right: 0,
          height: 32,
          background: "linear-gradient(to bottom, #7a5c3a, #5a3c20)",
        }}
      />
    </div>
  );
}
