import NextImage from 'next/image'
import { ImageProps as NextImageProps } from 'next/image'

interface ImageProps extends Omit<NextImageProps, 'src'> {
  src: string
  alt: string
  priority?: boolean
}

export function Image({ src, alt, priority = false, ...props }: ImageProps) {
  return (
    <NextImage
      src={src}
      alt={alt}
      priority={priority}
      loading={priority ? undefined : 'lazy'}
      {...props}
    />
  )
}

