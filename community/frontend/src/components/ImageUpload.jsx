import { useState, useRef, useCallback } from "react";
import { uploadAPI } from "../lib/api";

// ─── TYPES ────────────────────────────────────────────────────────
// type: "avatar" | "post-image" | "cv" | "logo"
// onUpload(url): callback with uploaded URL
// onError(msg): optional error callback
// accept: file types string (default based on type)
// maxMB: file size limit display (default 5)
// ─────────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  avatar:      { label: "Picha ya Profile",  icon: "👤", accept: "image/*",             maxMB: 2,  apiKey: "avatar",    field: "avatar"    },
  "post-image":{ label: "Picha ya Post",     icon: "🖼️",  accept: "image/*",             maxMB: 5,  apiKey: "postImage", field: "image"     },
  cv:          { label: "CV / Resume (PDF)", icon: "📄", accept: "application/pdf",      maxMB: 5,  apiKey: "cv",        field: "cv"        },
  logo:        { label: "Logo ya Kampuni",   icon: "🏢", accept: "image/*",              maxMB: 2,  apiKey: "logo",      field: "logo"      },
};

export default function ImageUpload({
  type = "post-image",
  onUpload,
  onError,
  label,
  compact = false,
  currentUrl = null,
  className = "",
}) {
  const config    = TYPE_CONFIG[type] || TYPE_CONFIG["post-image"];
  const fileRef   = useRef();
  const dropRef   = useRef();

  const [preview,    setPreview]    = useState(currentUrl || null);
  const [progress,   setProgress]   = useState(0);
  const [uploading,  setUploading]  = useState(false);
  const [done,       setDone]       = useState(false);
  const [error,      setError]      = useState(null);
  const [dragging,   setDragging]   = useState(false);

  const reset = () => {
    setPreview(null);
    setProgress(0);
    setDone(false);
    setError(null);
  };

  const handleFile = async (file) => {
    if (!file) return;

    // Validate type
    const isImage = file.type.startsWith("image/");
    const isPdf   = file.type === "application/pdf";
    if (type === "cv" && !isPdf) {
      const msg = "Tuma PDF tu kwa CV";
      setError(msg); onError?.(msg); return;
    }
    if (type !== "cv" && !isImage) {
      const msg = "Tuma picha tu (JPG, PNG, WebP)";
      setError(msg); onError?.(msg); return;
    }

    // Validate size
    const maxBytes = config.maxMB * 1024 * 1024;
    if (file.size > maxBytes) {
      const msg = `Faili ni kubwa sana. Max ${config.maxMB}MB`;
      setError(msg); onError?.(msg); return;
    }

    // Local preview
    if (isImage) {
      const localUrl = URL.createObjectURL(file);
      setPreview(localUrl);
    } else {
      setPreview("pdf");
    }

    setError(null);
    setDone(false);
    setUploading(true);
    setProgress(10);

    // Simulate progress steps while uploading
    const progressInterval = setInterval(() => {
      setProgress(p => p < 85 ? p + Math.random() * 12 : p);
    }, 300);

    try {
      const { data } = await uploadAPI[config.apiKey](file);
      clearInterval(progressInterval);
      setProgress(100);
      setDone(true);
      setUploading(false);

      const url = data.avatarUrl || data.imageUrl || data.cvUrl || data.logoUrl || data.url;
      onUpload?.(url);
    } catch (err) {
      clearInterval(progressInterval);
      const msg = err?.response?.data?.error || "Upload imeshindwa. Jaribu tena.";
      setError(msg);
      setUploading(false);
      setProgress(0);
      setPreview(currentUrl || null);
      onError?.(msg);
    }
  };

  const onFileInput = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, []);

  const onDragOver  = (e) => { e.preventDefault(); setDragging(true);  };
  const onDragLeave = ()  => setDragging(false);

  // ── Compact mode (avatar replacement button) ─────────────────
  if (compact) {
    return (
      <div style={{ position: "relative", display: "inline-block" }}>
        <div
          onClick={() => !uploading && fileRef.current?.click()}
          style={{
            width: 88, height: 88, borderRadius: "50%",
            background: preview && preview !== "pdf"
              ? `url(${preview}) center/cover`
              : "rgba(245,166,35,0.1)",
            border: `3px solid ${done ? "#34D399" : uploading ? "#F5A623" : "rgba(245,166,35,0.3)"}`,
            cursor: uploading ? "default" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            overflow: "hidden", transition: "border-color 0.2s",
            position: "relative",
          }}
        >
          {(!preview || preview === "pdf") && (
            <span style={{ fontSize: 28 }}>{config.icon}</span>
          )}

          {/* Overlay on hover */}
          {!uploading && (
            <div style={{
              position: "absolute", inset: 0, borderRadius: "50%",
              background: "rgba(0,0,0,0.5)",
              display: "flex", alignItems: "center", justifyContent: "center",
              opacity: 0, transition: "opacity 0.2s",
              fontSize: 20,
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = 1}
            onMouseLeave={e => e.currentTarget.style.opacity = 0}
            >
              ✏️
            </div>
          )}

          {/* Upload progress ring overlay */}
          {uploading && (
            <div style={{
              position: "absolute", inset: 0, borderRadius: "50%",
              background: "rgba(0,0,0,0.65)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexDirection: "column", gap: 2,
            }}>
              <span style={{ fontSize: 18 }}>⏳</span>
              <span style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 9, color: "#F5A623", fontWeight: 700 }}>
                {Math.round(progress)}%
              </span>
            </div>
          )}

          {done && (
            <div style={{
              position: "absolute", top: 2, right: 2,
              width: 22, height: 22, borderRadius: "50%",
              background: "#34D399", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 900,
            }}>✓</div>
          )}
        </div>

        <input ref={fileRef} type="file" accept={config.accept} style={{ display: "none" }} onChange={onFileInput} />
        {error && (
          <div style={{
            position: "absolute", top: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)",
            background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)",
            color: "#F87171", padding: "5px 10px", borderRadius: 7,
            fontFamily: "'Roboto Mono',monospace", fontSize: 10, whiteSpace: "nowrap",
          }}>{error}</div>
        )}
      </div>
    );
  }

  // ── Full drop zone ────────────────────────────────────────────
  return (
    <div className={className} style={{ width: "100%" }}>
      <input ref={fileRef} type="file" accept={config.accept} style={{ display: "none" }} onChange={onFileInput} />

      {/* Drop zone */}
      <div
        ref={dropRef}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => !uploading && fileRef.current?.click()}
        style={{
          border: `2px dashed ${
            error     ? "rgba(248,113,113,0.5)" :
            done      ? "rgba(52,211,153,0.5)"  :
            dragging  ? "#F5A623"               :
            uploading ? "rgba(245,166,35,0.4)"  :
                        "rgba(255,255,255,0.1)"
          }`,
          borderRadius: 14,
          background: dragging
            ? "rgba(245,166,35,0.05)"
            : "rgba(255,255,255,0.02)",
          padding: compact ? "16px" : "28px 20px",
          cursor: uploading ? "default" : "pointer",
          transition: "all 0.2s",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Preview */}
        {preview && preview !== "pdf" && (
          <div style={{ marginBottom: 14, position: "relative", display: "inline-block" }}>
            <img
              src={preview}
              alt="Preview"
              style={{
                maxHeight: 140, maxWidth: "100%", borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.08)",
                display: "block", margin: "0 auto",
              }}
            />
            {!uploading && (
              <button
                onClick={(e) => { e.stopPropagation(); reset(); }}
                style={{
                  position: "absolute", top: -8, right: -8,
                  width: 22, height: 22, borderRadius: "50%",
                  background: "rgba(248,113,113,0.8)", border: "none",
                  color: "#fff", cursor: "pointer", fontSize: 12, lineHeight: 1,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >×</button>
            )}
          </div>
        )}

        {preview === "pdf" && (
          <div style={{ marginBottom: 14 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.2)",
              borderRadius: 10, padding: "10px 16px",
            }}>
              <span style={{ fontSize: 24 }}>📄</span>
              <span style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 11, color: "#60A5FA", fontWeight: 700 }}>PDF imeongezwa</span>
            </div>
          </div>
        )}

        {/* Icon + label */}
        {!preview && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>{config.icon}</div>
            <div style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 12, fontWeight: 700, color: "rgba(220,230,240,0.8)", marginBottom: 4 }}>
              {label || config.label}
            </div>
            <div style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, color: "rgba(220,230,240,0.3)" }}>
              Drag & drop au <span style={{ color: "#F5A623", textDecoration: "underline" }}>bonyeza kuchagua</span>
            </div>
            <div style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 9, color: "rgba(220,230,240,0.2)", marginTop: 5 }}>
              Max {config.maxMB}MB
            </div>
          </div>
        )}

        {/* Progress bar */}
        {uploading && (
          <div style={{ marginTop: preview ? 10 : 4 }}>
            <div style={{
              height: 4, background: "rgba(255,255,255,0.06)",
              borderRadius: 4, overflow: "hidden", marginBottom: 8,
            }}>
              <div style={{
                height: "100%", borderRadius: 4,
                background: "linear-gradient(90deg, #F5A623, #e8961a)",
                width: `${progress}%`,
                transition: "width 0.3s ease",
                boxShadow: "0 0 8px rgba(245,166,35,0.6)",
              }} />
            </div>
            <div style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, color: "#F5A623", fontWeight: 700 }}>
              Inapanda... {Math.round(progress)}%
            </div>
          </div>
        )}

        {/* Done state */}
        {done && !uploading && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 8, marginTop: preview ? 10 : 0,
          }}>
            <span style={{ fontSize: 16 }}>✅</span>
            <span style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 11, color: "#34D399", fontWeight: 700 }}>
              Imepanda!
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); reset(); }}
              style={{
                fontFamily: "'Roboto Mono',monospace", fontSize: 10, color: "rgba(220,230,240,0.4)",
                background: "none", border: "none", cursor: "pointer", textDecoration: "underline",
              }}
            >Badilisha</button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            display: "flex", alignItems: "center", gap: 7, marginTop: 8,
            padding: "8px 12px", borderRadius: 8,
            background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)",
          }}>
            <span>❌</span>
            <span style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 11, color: "#F87171" }}>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}