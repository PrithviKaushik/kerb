"use client";

/* eslint-disable @next/next/no-img-element, jsx-a11y/alt-text -- custom base44/Wix image pipeline. */
import * as React from "react";
import { ResponsiveImage } from "./responsive-image";
import {
  getOriginalImageUrl,
  IMAGE_LOAD_MODE,
  nextImageLoadMode,
  parseWixMediaUrl,
} from "./image-helpers";

const FALLBACK_IMAGE_URL =
  "https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png";

interface ImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src?: string;
  fittingType?: string;
  originWidth?: number;
  originHeight?: number;
  focalPointX?: number;
  focalPointY?: number;
  quality?: number;
}

interface PreviewSource {
  source: string | undefined;
  value: string;
  className?: string;
  sourceClassName?: string;
}

interface LoadState {
  src?: string;
  mode: (typeof IMAGE_LOAD_MODE)[keyof typeof IMAGE_LOAD_MODE];
}

const Image = React.forwardRef<HTMLImageElement, ImageProps>(
  (
    {
      src: source,
      fittingType = "fill",
      originWidth,
      originHeight,
      focalPointX,
      focalPointY,
      quality = 90,
      onError,
      ...props
    },
    ref
  ) => {
    const sourceUrl = typeof source === "string" ? source : undefined;
    const [previewSource, setPreviewSource] = React.useState<PreviewSource | null>(null);
    const preview = previewSource?.source === sourceUrl ? previewSource : null;
    const src = preview ? preview.value : sourceUrl;

    const replaceSource = (value: string, className?: string) => {
      setPreviewSource({ source: sourceUrl, value, className, sourceClassName: props.className });
    };

    React.useEffect(() => {
      setPreviewSource(null);
    }, [sourceUrl]);

    const parsedSource = src && src !== FALLBACK_IMAGE_URL ? parseWixMediaUrl(src) : null;
    const initialMode = parsedSource ? IMAGE_LOAD_MODE.OPTIMIZED : IMAGE_LOAD_MODE.ORIGINAL;
    const [loadState, setLoadState] = React.useState<LoadState>({ src, mode: initialMode });
    const mode = loadState.src === src ? loadState.mode : initialMode;

    React.useEffect(() => {
      setLoadState({ src, mode: initialMode });
    }, [src, initialMode]);

    const handleError = (event: React.SyntheticEvent<HTMLImageElement>) => {
      if (mode === IMAGE_LOAD_MODE.FALLBACK) return;
      const nextMode = nextImageLoadMode(mode);
      setLoadState({ src, mode: nextMode });
      if (nextMode === IMAGE_LOAD_MODE.FALLBACK) onError?.(event);
    };

    const imageProps: Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> = {
      ...props,
      className:
        preview && preview.sourceClassName === props.className ? preview.className : props.className,
      onError: handleError,
    };

    if (!src) {
      return <img ref={ref} src={FALLBACK_IMAGE_URL} {...imageProps} data-empty-image />;
    }

    const parsed = mode === IMAGE_LOAD_MODE.OPTIMIZED ? parsedSource : null;
    if (!parsed) {
      const isErrorMode = mode === IMAGE_LOAD_MODE.FALLBACK;
      const imageSrc = isErrorMode ? FALLBACK_IMAGE_URL : getOriginalImageUrl(src, parsedSource);
      return <img ref={ref} src={imageSrc} {...imageProps} data-error-image={isErrorMode || undefined} />;
    }

    const focalPoint =
      typeof focalPointX === "number" && typeof focalPointY === "number"
        ? { x: focalPointX, y: focalPointY }
        : undefined;
    const aspectRatio = originWidth && originHeight ? `${originWidth} / ${originHeight}` : undefined;

    return (
      <ResponsiveImage
        ref={ref}
        src={src}
        parsed={parsed}
        onSourceChange={replaceSource}
        fittingType={fittingType}
        focalPoint={focalPoint}
        quality={quality}
        aspectRatio={aspectRatio}
        {...imageProps}
      />
    );
  }
);

Image.displayName = "Image";

export { Image };
