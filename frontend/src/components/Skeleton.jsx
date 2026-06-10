function Skeleton({ width = "100%", height = 20, borderRadius = 6, margin = "4px 0" }) {
  return (
    <div style={{
      width,
      height,
      borderRadius,
      margin,
      background: "linear-gradient(90deg, #dbeafe 25%, #eff6ff 50%, #dbeafe 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.2s infinite",
    }} />
  );
}

export default Skeleton;