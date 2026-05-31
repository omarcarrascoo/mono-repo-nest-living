"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { uploadsService } from "@/services/uploads.service";
import { UploadKind } from "@/types/api";
import { cn } from "@/lib/cn";

/**
 * Subida de imagen con preview. Firma URL contra el backend
 * (`POST /uploads/sign`) y hace `PUT` directo al provider; al terminar
 * reporta la `publicUrl`. Soporta limpiar y reemplazar la imagen actual.
 */
export function ImageUploader({
  value,
  onChange,
  kind,
  className,
  label = "Imagen",
}: {
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  kind: UploadKind;
  className?: string;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const url = await uploadsService.uploadFile(file, kind);
      onChange(url);
    } catch (e) {
      setError((e as Error)?.message ?? "No pudimos subir la imagen.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <label className="block text-sm font-semibold text-ink">{label}</label>

      <div
        className={cn(
          "relative aspect-[16/9] overflow-hidden rounded-xl border border-dashed border-line bg-canvas",
          uploading && "opacity-70",
        )}
      >
        {value ? (
          <>
            <Image
              src={value}
              alt="Vista previa"
              fill
              sizes="(max-width: 640px) 100vw, 480px"
              className="object-cover"
            />
            {!uploading && (
              <button
                type="button"
                onClick={() => onChange(null)}
                className="absolute right-2 top-2 rounded-full bg-ink/70 p-1.5 text-white shadow-md hover:bg-ink"
                aria-label="Quitar imagen"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-full w-full flex-col items-center justify-center gap-2 text-ink-soft transition-colors hover:bg-canvas/70 hover:text-ink"
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <ImagePlus className="h-6 w-6" />
                <span className="text-sm font-medium">
                  Haz click para subir una imagen
                </span>
                <span className="text-xs">JPG, PNG o WEBP · máx. 5 MB</span>
              </>
            )}
          </button>
        )}
        {value && uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink/20">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = ""; // permite re-seleccionar la misma imagen
        }}
      />

      {value && !uploading && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-sm font-semibold text-teal-dark hover:underline"
        >
          Reemplazar imagen
        </button>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
