"use client";

import * as React from "react";
import {
  DEFAULT_TRANSFORM_WIDTH,
  type FocalPoint,
  type ImageTransformOptions,
  type WixImageMetadata,
} from "./image-helpers";

interface UseResponsiveImageOptions {
  parsed: WixImageMetadata;
  fittingType?: string;
  focalPoint?: FocalPoint;
  quality?: number;
  className?: string;
  onLoad?: React.ReactEventHandler<HTMLImageElement>;
  onSourceChange?: (
    value: string,
    className?: string
  ) => void;
}

interface ResponsiveImageState {
  wrapperRef: React.RefObject<HTMLSpanElement | null>;
  imgRef: React.RefCallback<HTMLImageElement>;
  loaded: boolean;
  options: ImageTransformOptions | null;
  handleLoad: React.ReactEventHandler<HTMLImageElement>;
}

export function useResponsiveImage(
  {
    parsed,
    fittingType,
    focalPoint,
    quality = 90,
    className,
    onLoad,
    onSourceChange,
  }: UseResponsiveImageOptions,
  forwardedRef: React.ForwardedRef<HTMLImageElement>
): ResponsiveImageState {
  const wrapperRef = React.useRef<HTMLSpanElement>(null);
  const imageElementRef = React.useRef<HTMLImageElement>(null);
  const forwardedRefRef = React.useRef(forwardedRef);
  const [loaded, setLoaded] = React.useState(false);
  const [options, setOptions] =
    React.useState<ImageTransformOptions | null>(null);

  React.useEffect(() => {
    forwardedRefRef.current = forwardedRef;
  }, [forwardedRef]);

  const setImageRef = React.useCallback(
    (element: HTMLImageElement | null) => {
      imageElementRef.current = element;
      const currentRef = forwardedRefRef.current;

      if (typeof currentRef === "function") {
        currentRef(element);
      } else if (currentRef) {
        currentRef.current = element;
      }
    },
    []
  );

  React.useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) {
      return;
    }

    const updateOptions = () => {
      const width = Math.max(
        1,
        Math.round(wrapper.getBoundingClientRect().width) ||
          DEFAULT_TRANSFORM_WIDTH
      );
      const height = Math.round(
        wrapper.getBoundingClientRect().height
      );
      const crop = fittingType !== "fit";

      setOptions((current) => {
        const next: ImageTransformOptions = {
          width,
          height: crop && height > 0 ? height : undefined,
          crop,
          focalPoint: crop ? focalPoint : undefined,
          quality,
        };

        return current &&
          current.width === next.width &&
          current.height === next.height &&
          current.crop === next.crop &&
          current.quality === next.quality &&
          current.focalPoint?.x === next.focalPoint?.x &&
          current.focalPoint?.y === next.focalPoint?.y
          ? current
          : next;
      });
    };

    updateOptions();
    const observer = new ResizeObserver(updateOptions);
    observer.observe(wrapper);

    return () => observer.disconnect();
  }, [fittingType, focalPoint, quality, className, parsed]);

  const handleLoad = React.useCallback<
    React.ReactEventHandler<HTMLImageElement>
  >(
    (event) => {
      setLoaded(true);
      onSourceChange?.(
        event.currentTarget.currentSrc || event.currentTarget.src,
        className
      );
      onLoad?.(event);
    },
    [className, onLoad, onSourceChange]
  );

  return {
    wrapperRef,
    imgRef: setImageRef,
    loaded,
    options,
    handleLoad,
  };
}
