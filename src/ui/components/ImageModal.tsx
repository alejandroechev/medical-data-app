import { useState } from 'react';

interface ImageModalProps {
  src: string;
  alt: string;
  onClose: () => void;
}

export function ImageModal({ src, alt, onClose }: ImageModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white text-2xl bg-black/50 rounded-full w-10 h-10 flex items-center justify-center"
        aria-label="Cerrar"
      >
        ✕
      </button>
      <img
        src={src}
        alt={alt}
        className="max-w-full max-h-full object-contain p-4"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

interface ClickableImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function ClickableImage({ src, alt, className }: ClickableImageProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <img
        src={src}
        alt={alt}
        className={`${className ?? ''} cursor-pointer`}
        loading="lazy"
        onClick={() => setOpen(true)}
      />
      {open && <ImageModal src={src} alt={alt} onClose={() => setOpen(false)} />}
    </>
  );
}
