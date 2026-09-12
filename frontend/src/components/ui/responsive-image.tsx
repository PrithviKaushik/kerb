"use client";

/* eslint-disable @next/next/no-img-element -- custom pipeline: raw <img> with generated srcSet is intentional. */
import * as React from "react";
import { cn } from "../../lib/utlis";
import {
  buildSrcSet,
  buildTransformUrl,
  splitImageProps,
  type WixImageMetadata,
} from "./image-helpers";
import { useResponsiveImage } from "./use-responsive-image";

interface FocalPoint {
  x: number;
  y: number;
}

interface ResponsiveImageProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  src: string;
  parsed: WixImageMetadata;
  fittingType?: "fill" | "fit" | string;
  focalPoint?: FocalPoint;
  quality?: number;
  aspectRatio?: string;
  onLoad?: React.ReactEventHandler<HTMLImageElement>;
  onSourceChange?: (
    value: string,
    className?: string
  ) => void;
  className?: string;
  style?: React.CSSProperties;
}

export const ResponsiveImage = React.forwardRef<
  HTMLImageElement,
  ResponsiveImageProps
>(
  (
    {
      src,
      parsed,
      fittingType,
      focalPoint,
      quality,
      className,
      style,
      aspectRatio,
      onLoad,
      onSourceChange,
      ...props
    },
    ref
  ) => {
    const {
      wrapperRef,
      imgRef,
      loaded,
      options,
      handleLoad,
    } = useResponsiveImage(
      {
        parsed,
        fittingType,
        focalPoint,
        quality,
        className,
        onLoad,
        onSourceChange,
      },
      ref
    );

    const {
      wrapperProps,
      imageProps,
    } = splitImageProps(props);

    return (
      <span
        ref={wrapperRef}
        className={cn(
          "inline-block relative",
          className
        )}
        style={{
          aspectRatio,
          ...style,
        }}
        {...wrapperProps}
        data-base44-image=""
        data-base44-image-src={src}
      >
        {/* Internal layers must not become separate visual-edit targets. */}
        {options && !loaded && (
          <img
            data-source-location={undefined}
            src={buildTransformUrl(parsed, {
              ...options,
              width: 20,
              height: options.height
                ? Math.max(
                    1,
                    Math.round(
                      (20 * options.height) /
                        options.width
                    )
                  )
                : undefined,
              quality: 20,
            })}
            alt=""
            aria-hidden="true"
            className="w-full h-full inset-0 absolute"
            style={{
              objectFit:
                fittingType === "fit"
                  ? "contain"
                  : "cover",
              filter: "blur(10px)",
              transform: "scale(1.1)",
            }}
          />
        )}

        {options && (
          // eslint-disable-next-line jsx-a11y/alt-text -- alt text arrives via props spread from callers.
          <img
            data-source-location={undefined}
            ref={imgRef}
            src={buildTransformUrl(
              parsed,
              options
            )}
            srcSet={buildSrcSet(
              parsed,
              options
            )}
            loading="lazy"
            className={cn(
              "w-full h-full inset-0 absolute",
              fittingType === "fit"
                ? "object-contain"
                : "object-cover"
            )}
            onLoad={handleLoad}
            {...imageProps}
          />
        )}
      </span>
    );
  }
);

ResponsiveImage.displayName = "ResponsiveImage";