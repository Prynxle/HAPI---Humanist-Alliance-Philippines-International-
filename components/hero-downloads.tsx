"use client";

function download(url: string, filename: string) {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}

export function HeroDownloadButtons() {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "34px" }}>
      <button
        type="button"
        className="primary-cta"
        onClick={() => {
          download("/downloads/programflow1.png", "programflow1.png");
          download("/downloads/programflow2.png", "programflow2.png");
        }}
      >
        Download Program Flow <span>↓</span>
      </button>
      <button
        type="button"
        className="primary-cta"
        onClick={() =>
          download(
            "/downloads/IMPORTANT-REMINDERS-FOR-GUESTS-AT-THE-SPC.pdf",
            "IMPORTANT-REMINDERS-FOR-GUESTS-AT-THE-SPC.pdf"
          )
        }
      >
        Download Important Reminders for Guests <span>↓</span>
      </button>
    </div>
  );
}