import { useCallback, useEffect, useState, useRef } from "react";
import { Box, CircularProgress, IconButton, Tooltip, useMediaQuery, useTheme } from "@mui/material";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import CloseIcon from "@mui/icons-material/Close";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { io, Socket } from "socket.io-client";
import { useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const SAVE_INTERVAL_MS = 2000;

const TOOLBAR_TOOLTIPS: Record<string, string> = {
  ".ql-bold": "Bold",
  ".ql-italic": "Italic",
  ".ql-underline": "Underline",
  ".ql-list[value='ordered']": "Ordered List",
  ".ql-list[value='bullet']": "Bullet List",
  ".ql-color": "Font Color",
  ".ql-background": "Background Color",
  ".ql-script[value='sub']": "Subscript",
  ".ql-script[value='super']": "Superscript",
  ".ql-image": "Insert Image",
  ".ql-blockquote": "Blockquote",
  ".ql-code-block": "Code Block",
  ".ql-clean": "Clear Formatting",
  ".ql-header": "Heading",
  ".ql-font": "Font",
  ".ql-align": "Text Align",
};

function addToolbarTooltips(container: HTMLElement) {
  for (const [selector, title] of Object.entries(TOOLBAR_TOOLTIPS)) {
    container.querySelectorAll<HTMLElement>(selector).forEach((el) => {
      el.setAttribute("title", title);
    });
  }
}

interface DocMeta {
  isPrivate: boolean;
  isReadOnly: boolean;
  isLocked: boolean;
  isOwner: boolean;
  readOnly?: boolean;
  ownerName?: string;
}

interface Props {
  onMeta?: (meta: DocMeta) => void;
  onAccessDenied?: () => void;
  onBlocked?: () => void;
}

export default function TextEditor({ onMeta, onAccessDenied, onBlocked }: Props) {
  const { id: documentId } = useParams<{ id: string }>();
  const { token } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [socket, setSocket] = useState<Socket>();
  const [quill, setQuill] = useState<Quill>();
  const [readOnly, setReadOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showMore, setShowMore] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const s = io(import.meta.env.VITE_SERVER_URL || "http://localhost:8080", {
      auth: { token },
    });
    setSocket(s);
    return () => { s.disconnect(); };
  }, [token]);

  useEffect(() => {
    if (socket == null || quill == null) return;

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

  useEffect(() => {
    if (socket == null || quill == null || readOnly) return;
    const interval = setInterval(() => {
      socket.emit("save-document", quill.getContents());
    }, SAVE_INTERVAL_MS);
    return () => { clearInterval(interval); };
  }, [socket, quill, readOnly]);

  useEffect(() => {
    if (socket == null || quill == null) return;
    const handler = (delta: any) => { quill.updateContents(delta); };
    socket.on("receive-changes", handler);
    return () => { socket.off("receive-changes", handler); };
  }, [socket, quill]);

  useEffect(() => {
    if (socket == null || quill == null) return;
    const handler = (delta: any, _oldDelta: any, source: string) => {
      if (source !== "user") return;
      socket.emit("send-changes", delta);
    };
    quill.on("text-change", handler);
    return () => { quill.off("text-change", handler); };
  }, [socket, quill]);

  const wrapperRef = useCallback((wrapper: HTMLDivElement | null) => {
    if (wrapper == null) return;
    wrapper.innerHTML = "";
    const editor = document.createElement("div");
    wrapper.append(editor);
    const q = new Quill(editor, {
      theme: "snow",
      modules: { toolbar: toolbarRef.current },
      placeholder: "Start typing your note here...",
    });
    q.disable();
    q.setText("");
    if (toolbarRef.current) addToolbarTooltips(toolbarRef.current);
    setQuill(q);
  }, []);

  /* On desktop: secondary row always visible, toggle button hidden */
  /* On mobile: secondary row toggled, toggle button visible */
  const showExtended = isMobile ? showMore : true;

  return (
    <>
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 6 }}>
          <CircularProgress size={40} sx={{ color: "primary.main" }} />
        </Box>
      )}

      <div
        ref={toolbarRef}
        className="ql-toolbar ql-snow"
        style={{ display: loading ? "none" : undefined }}
      >
        {/* Primary row */}
        <span className="ql-formats">
          <button className="ql-bold" />
          <button className="ql-italic" />
          <button className="ql-underline" />
        </span>
        <span className="ql-formats">
          <button className="ql-list" value="ordered" />
          <button className="ql-list" value="bullet" />
        </span>
        <span className="ql-formats">
          <select className="ql-header" defaultValue="">
            <option value="1" />
            <option value="2" />
            <option value="3" />
            <option value="4" />
            <option value="5" />
            <option value="6" />
            <option value="" />
          </select>
        </span>
        <span className="ql-formats">
          <select className="ql-color" />
          <select className="ql-background" />
        </span>

        {/* Toggle button — only on mobile */}
        {isMobile && (
          <Tooltip title={showMore ? "Less options" : "More options"}>
            <IconButton
              size="small"
              onClick={() => setShowMore((p) => !p)}
              sx={{ ml: "auto", width: 24, height: 24 }}
            >
              {showMore ? <CloseIcon sx={{ fontSize: 16 }} /> : <MoreHorizIcon sx={{ fontSize: 16 }} />}
            </IconButton>
          </Tooltip>
        )}

        {/* Secondary row — always in DOM, visibility controlled */}
        <Box
          className="toolbar-extended"
          sx={{
            display: showExtended ? "inline-flex" : "none",
            alignItems: "center",
            width: isMobile ? "100%" : "auto",
            pt: isMobile ? 0.5 : 0,
          }}
        >
          <span className="ql-formats">
            <select className="ql-font" />
          </span>
          <span className="ql-formats">
            <select className="ql-align" />
          </span>
          <span className="ql-formats">
            <button className="ql-script" value="sub" />
            <button className="ql-script" value="super" />
          </span>
          <span className="ql-formats">
            <button className="ql-image" />
            <button className="ql-blockquote" />
            <button className="ql-code-block" />
          </span>
          <span className="ql-formats">
            <button className="ql-clean" />
          </span>
        </Box>
      </div>

      <div className="container" ref={wrapperRef} style={{ display: loading ? "none" : undefined }} />
    </>
  );
}
