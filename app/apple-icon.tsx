import { ImageResponse } from "next/og";

// PNG copy of icon.svg for iOS, which doesn't take SVG and rounds
// the corners itself.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#16140f" }}>
        <svg width="180" height="180" viewBox="0 0 32 32">
          <path d="M8 10l6 6-6 6" fill="none" stroke="#d97757" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M17 23h7" stroke="#ece6d8" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
    ),
    size
  );
}
