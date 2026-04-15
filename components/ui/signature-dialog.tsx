"use client";

import { useEffect, useRef, useState } from "react";
import { Eraser, PenLine, X } from "lucide-react";

type SignatureDialogProps = {
  open: boolean;
  title: string;
  subtitle: string;
  confirmLabel: string;
  pending?: boolean;
  onClose: () => void;
  onConfirm: (signatureDataUrl: string) => Promise<void> | void;
};

export function SignatureDialog({
  open,
  title,
  subtitle,
  confirmLabel,
  pending = false,
  onClose,
  onConfirm,
}: SignatureDialogProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [hasStroke, setHasStroke] = useState(false);

  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1f2a44";
  }, [open]);

  if (!open) return null;

  const pointFromMouseEvent = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const pointFromTouchEvent = (event: React.TouchEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const touch = event.touches[0] ?? event.changedTouches[0];
    return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
  };

  const beginPath = (x: number, y: number) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const drawPath = (x: number, y: number) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1f2a44";
    setHasStroke(false);
    setDrawing(false);
  };

  const closeDialog = () => {
    setHasStroke(false);
    setDrawing(false);
    onClose();
  };

  const confirm = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasStroke) return;
    const dataUrl = canvas.toDataURL("image/png");
    await onConfirm(dataUrl);
    setHasStroke(false);
    setDrawing(false);
  };

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-[#0f172a]/25 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-xl border border-[#dbe4eb] bg-white p-5 shadow-2xl shadow-slate-300/30">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-xl text-[#1f2a44]">{title}</h3>
            <p className="mt-1 text-sm text-[#607187]">{subtitle}</p>
          </div>
          <button
            onClick={closeDialog}
            className="rounded-lg border border-[#dbe4eb] p-2 text-[#607187] hover:text-[#1f2a44]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 rounded-xl border border-[#dbe4eb] bg-[#f8fafc] p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-[#7f8a99]">
              <PenLine className="h-3.5 w-3.5" /> Draw Signature
            </p>
            <button
              onClick={clearCanvas}
              className="inline-flex items-center gap-1 rounded-lg border border-[#dbe4eb] bg-white px-2 py-1 text-xs text-[#607187]"
            >
              <Eraser className="h-3.5 w-3.5" /> Clear
            </button>
          </div>
          <canvas
            ref={canvasRef}
            className="h-52 w-full touch-none rounded-lg border border-[#dbe4eb] bg-white"
            onMouseDown={(event) => {
              const p = pointFromMouseEvent(event);
              beginPath(p.x, p.y);
              setDrawing(true);
            }}
            onMouseMove={(event) => {
              if (!drawing) return;
              const p = pointFromMouseEvent(event);
              drawPath(p.x, p.y);
              setHasStroke(true);
            }}
            onMouseUp={() => setDrawing(false)}
            onMouseLeave={() => setDrawing(false)}
            onTouchStart={(event) => {
              event.preventDefault();
              const p = pointFromTouchEvent(event);
              beginPath(p.x, p.y);
              setDrawing(true);
            }}
            onTouchMove={(event) => {
              event.preventDefault();
              if (!drawing) return;
              const p = pointFromTouchEvent(event);
              drawPath(p.x, p.y);
              setHasStroke(true);
            }}
            onTouchEnd={() => setDrawing(false)}
          />
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={closeDialog}
            className="rounded-md border border-[#dbe4eb] px-4 py-2 text-sm text-[#607187]"
          >
            Cancel
          </button>
          <button
            onClick={confirm}
            disabled={!hasStroke || pending}
            className="rounded-md bg-[#1f7d79] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {pending ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
