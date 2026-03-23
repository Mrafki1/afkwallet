"use client";

import Image from "next/image";

export default function CardImage({ src, alt, gradient }: { src: string; alt: string; gradient: string }) {
  return (
    <div className="relative w-full aspect-[1.586/1] rounded-2xl overflow-hidden bg-gray-100">
      <Image
        src={src}
        alt={alt}
        fill
        className="object-contain p-4"
        priority
        onError={(e) => {
          const parent = (e.target as HTMLImageElement).parentElement;
          if (parent) {
            parent.className = `relative w-full aspect-[1.586/1] rounded-2xl overflow-hidden bg-gradient-to-br ${gradient}`;
            (e.target as HTMLImageElement).style.display = "none";
          }
        }}
      />
    </div>
  );
}
