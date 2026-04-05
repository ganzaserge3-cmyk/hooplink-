import type { ImageResponse } from "next/og";

export const size = {
  width: 64,
  height: 64,
};

export const contentType = "image/png";

export default function Icon(): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
          borderRadius: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <div
            style={{
              width: 10,
              height: 28,
              borderRadius: 3,
              background: "#030b14",
            }}
          />
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              background: "#030b14",
              alignSelf: "center",
            }}
          />
          <div
            style={{
              position: "relative",
              width: 22,
              height: 28,
              display: "flex",
            }}
          >
            <div
              style={{
                width: 10,
                height: 28,
                borderRadius: 3,
                background: "#030b14",
                position: "absolute",
                left: 0,
                top: 0,
              }}
            />
            <div
              style={{
                width: 14,
                height: 10,
                borderRadius: 3,
                background: "#030b14",
                position: "absolute",
                right: 0,
                bottom: 0,
              }}
            />
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
