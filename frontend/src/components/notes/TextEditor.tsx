/**
 * @module components/notes/TextEditor
 * @description Rich-text collaborative editor powered by Quill and Socket.IO.
 * Handles document loading, real-time change broadcasting, and auto-saving.
 */

import { useEffect, useState, useRef } from "react";
import { Box, CircularProgress } from "@mui/material";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../hooks/useSocket";
import { SAVE_INTERVAL_MS } from "../../constants";
import type { DocMeta } from "../../types";

/** Quill toolbar configuration — controls available formatting options. */
const TOOLBAR_OPTIONS = [
  ["bold", "italic", "underline"],
  [{ list: "ordered" }, { list: "bullet" }],
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  [{ color: [] }, { background: [] }],
  [{ font: [] }],
  [{ align: [] }],
  [{ script: "sub" }, { script: "super" }],
  ["image", "blockquote", "code-block"],
  ["clean"],
];

interface Props {
  onMeta?: (meta: DocMeta) => void;
  onAccessDenied?: () => void;
  onBlocked?: () => void;
}

export default function TextEditor({ onMeta, onAccessDenied, onBlocked }: Props) {
  const { id: documentId } = useParams<{ id: string }>();
  const { token } = useAuth();
  const socket = useSocket(token);
  const [quill, setQuill] = useState<Quill>();
  const [readOnly, setReadOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  /* Initialise the Quill editor instance once on mount. */
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    container.innerHTML = "";
    const editorDiv = document.createElement("div");
    container.append(editorDiv);

    const q = new Quill(editorDiv, {
      theme: "snow",
      modules: { toolbar: TOOLBAR_OPTIONS },
      placeholder: "Start typing your note here...",
    });
    q.disable();
    q.setText("");
    setQuill(q);

    return () => {
      setQuill(undefined);
      container.innerHTML = "";
    };
  }, []);

  /* Request the document from the server once socket + quill are ready. */
  useEffect(() => {
    if (!socket || !quill) return;

    socket.on("user-blocked", () => {
      quill.disable();
      quill.setText("");
      setLoading(false);
      onBlocked?.();
    });

    socket.on("access-denied", () => {
      quill.disable();
      quill.setText("");
      setLoading(false);
      onAccessDenied?.();
    });

    socket.once("load-document", (document: any, meta: DocMeta) => {
      quill.setContents(document);
      setLoading(false);
      if (meta.readOnly) {
        quill.disable();
        setReadOnly(true);
      } else {
        quill.enable();
      }
      onMeta?.(meta);
    });

    socket.emit("get-document", documentId);

    return () => {
      socket.off("access-denied");
      socket.off("user-blocked");
    };
  }, [socket, quill, documentId]);

  /* Auto-save document contents at a fixed interval. */
  useEffect(() => {
    if (!socket || !quill || readOnly) return;
    const interval = setInterval(() => {
      socket.emit("save-document", quill.getContents());
    }, SAVE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [socket, quill, readOnly]);

  /* Apply incoming changes from other collaborators. */
  useEffect(() => {
    if (!socket || !quill) return;
    const handler = (delta: any) => quill.updateContents(delta);
    socket.on("receive-changes", handler);
    return () => { socket.off("receive-changes", handler); };
  }, [socket, quill]);

  /* Broadcast local edits to other collaborators. */
  useEffect(() => {
    if (!socket || !quill) return;
    const handler = (delta: any, _oldDelta: any, source: string) => {
      if (source !== "user") return;
      socket.emit("send-changes", delta);
    };
    quill.on("text-change", handler);
    return () => { quill.off("text-change", handler); };
  }, [socket, quill]);

  return (
    <>
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 6 }}>
          <CircularProgress size={40} sx={{ color: "primary.main" }} />
        </Box>
      )}
      <div className="container" ref={containerRef} style={{ display: loading ? "none" : undefined }} />
    </>
  );
}
