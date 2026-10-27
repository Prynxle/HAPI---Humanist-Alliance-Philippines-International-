"use client";

const files = [
  {
    label: "[PDF 1]",
    url: "/downloads/IMPORTANT-REMINDERS-FOR-GUESTS-AT-THE-SPC.pdf",
    filename: "IMPORTANT-REMINDERS-FOR-GUESTS-AT-THE-SPC.pdf",
  },
  {
    label: "[Image 1]",
    url: "/downloads/programflow1.png",
    filename: "programflow1.png",
  },
  {
    label: "[Image 2]",
    url: "/downloads/programflow2.png",
    filename: "programflow2.png",
  },
];

function download(url: string, filename: string) {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}

export function DownloadButtons() {
  return (
    <div className="download-buttons">
      {files.map((file) => (
        <button
          key={file.label}
          type="button"
          className="download-button"
          onClick={() => download(file.url, file.filename)}
        >
          {file.label}
        </button>
      ))}
    </div>
  );
}