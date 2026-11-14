interface Props {
  src: string
  alt: string
  // Extra classes for the visible photo, e.g. a hover zoom.
  className?: string
}

// Shows the whole photo inside a fixed frame (no cropping). The parent sets the size and must be
// `relative overflow-hidden`. Free space around portrait or very wide photos stays white, so all
// tiles keep the same size.
export default function FittedImage({ src, alt, className = '' }: Props) {
  return (
    <>
      <span aria-hidden="true" className="absolute inset-0 bg-paper" />
      <img src={src} alt={alt} className={`absolute inset-0 h-full w-full object-contain ${className}`} />
    </>
  )
}
