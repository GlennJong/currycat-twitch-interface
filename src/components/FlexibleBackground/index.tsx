import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './style.css';

export type MaskPosition = {
  top?: number;
  left?: number;
  bottom?: number;
  right?: number;
};

type FlexibleBackgroundProps = {
  background: string;
  defaultMaskWidth: number;
  defaultMaskHeight: number;
  defaultMaskPosition?: MaskPosition;
  /**
   * Optional URL / data-URL for a custom mask image.
   * When supplied, the mask hole takes the image's alpha shape instead of a plain
   * rectangle. The resize rectangle still controls the area the image occupies.
   */
  maskImage?: string;
  minMaskWidth?: number;
  minMaskHeight?: number;
  /**
   * DOM node to portal the control layer into. Defaults to `document.body` so
   * the resize handles stay above every stacking context.
   */
  controlPortalContainer?: HTMLElement;
  /**
   * z-index applied to the portaled control layer. Defaults to 9999.
   */
  controlZIndex?: number;
  style?: React.CSSProperties;
  className?: string;
  children?: React.ReactNode;
};

const FlexibleBackground: React.FC<FlexibleBackgroundProps> = ({
  background,
  defaultMaskWidth,
  defaultMaskHeight,
  defaultMaskPosition,
  maskImage,
  minMaskWidth = 40,
  minMaskHeight = 40,
  controlPortalContainer,
  controlZIndex = 9999,
  style,
  className,
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  // Viewport-relative rect of the background container, used to align the
  // portaled control layer on top of it.
  const [containerRect, setContainerRect] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  });
  const [maskSize, setMaskSize] = useState({
    width: defaultMaskWidth,
    height: defaultMaskHeight,
  });
  const [maskPos, setMaskPos] = useState({ x: 0, y: 0 });
  const [initialized, setInitialized] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const maskRef = useRef<HTMLDivElement>(null);

  // Exit edit mode when clicking outside the mask (blur-like behavior).
  useEffect(() => {
    if (!isEditing) return;
    const onDocMouseDown = (e: MouseEvent) => {
      if (maskRef.current && !maskRef.current.contains(e.target as Node)) {
        setIsEditing(false);
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [isEditing]);

  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const el = containerRef.current;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      setContainerRect({
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      });

      if (!initialized && rect.width > 0 && rect.height > 0) {
        const pos = defaultMaskPosition;
        let x = (rect.width - defaultMaskWidth) / 2;
        let y = (rect.height - defaultMaskHeight) / 2;

        if (pos) {
          if (pos.left !== undefined) {
            x = pos.left;
          } else if (pos.right !== undefined) {
            x = rect.width - defaultMaskWidth - pos.right;
          }
          if (pos.top !== undefined) {
            y = pos.top;
          } else if (pos.bottom !== undefined) {
            y = rect.height - defaultMaskHeight - pos.bottom;
          }
        }

        setMaskPos({ x, y });
        setInitialized(true);
      }
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(el);
    window.addEventListener('resize', measure);
    // Capture-phase so we catch scrolls on any ancestor that can move us.
    window.addEventListener('scroll', measure, true);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [defaultMaskPosition, defaultMaskWidth, defaultMaskHeight, initialized]);

  const clampPosition = useCallback(
    (x: number, y: number, w: number, h: number) => {
      if (containerRect.width === 0 || containerRect.height === 0) {
        return { x, y };
      }
      const maxX = Math.max(0, containerRect.width - w);
      const maxY = Math.max(0, containerRect.height - h);
      return {
        x: Math.min(Math.max(0, x), maxX),
        y: Math.min(Math.max(0, y), maxY),
      };
    },
    [containerRect.width, containerRect.height]
  );

  // Mousedown on the mask: if not editing, activate edit mode; if editing,
  // start dragging. This matches the "click to focus, then manipulate" UX.
  const handleMaskMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isEditing) {
      e.preventDefault();
      setIsEditing(true);
      return;
    }
    beginDrag(e);
  };

  const beginDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const origX = maskPos.x;
    const origY = maskPos.y;

    const onMove = (ev: MouseEvent) => {
      const next = clampPosition(
        origX + (ev.clientX - startX),
        origY + (ev.clientY - startY),
        maskSize.width,
        maskSize.height
      );
      setMaskPos(next);
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const beginResize = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = maskSize.width;
    const startH = maskSize.height;

    const onMove = (ev: MouseEvent) => {
      const maxW = Math.max(minMaskWidth, containerRect.width - maskPos.x);
      const maxH = Math.max(minMaskHeight, containerRect.height - maskPos.y);
      const nextW = Math.min(
        maxW,
        Math.max(minMaskWidth, startW + (ev.clientX - startX))
      );
      const nextH = Math.min(
        maxH,
        Math.max(minMaskHeight, startH + (ev.clientY - startY))
      );
      setMaskSize({ width: nextW, height: nextH });
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  useEffect(() => {
    if (!initialized) return;
    const next = clampPosition(maskPos.x, maskPos.y, maskSize.width, maskSize.height);
    if (next.x !== maskPos.x || next.y !== maskPos.y) {
      setMaskPos(next);
    }
  }, [containerRect.width, containerRect.height, clampPosition, initialized, maskPos.x, maskPos.y, maskSize.width, maskSize.height]);

  // Two mask layers composed with `exclude` so the second layer punches a hole
  // in the first. The first layer is a full-opacity gradient covering the
  // container; the second is either a solid rectangle (default) or the alpha of
  // a user-supplied image.
  const holeLayer = maskImage
    ? `url("${maskImage}")`
    : `linear-gradient(#000, #000)`;
  const maskImageCss = `linear-gradient(#000, #000), ${holeLayer}`;
  const maskSizeCss = `100% 100%, ${maskSize.width}px ${maskSize.height}px`;
  const maskPositionCss = `0 0, ${maskPos.x}px ${maskPos.y}px`;

  const backgroundLayerStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    background,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    WebkitMaskImage: maskImageCss,
    WebkitMaskSize: maskSizeCss,
    WebkitMaskPosition: maskPositionCss,
    WebkitMaskRepeat: 'no-repeat, no-repeat',
    WebkitMaskComposite: 'xor',
    maskImage: maskImageCss,
    maskSize: maskSizeCss,
    maskPosition: maskPositionCss,
    maskRepeat: 'no-repeat, no-repeat',
    maskMode: 'alpha, alpha',
    maskComposite: 'exclude',
    pointerEvents: 'none',
  };

  // --- Background layer: rendered in-place where the component sits ---
  const backgroundLayer = (
    <div
      ref={containerRef}
      className={`flexible-background${className ? ` ${className}` : ''}`}
      style={style}
    >
      <div style={backgroundLayerStyle} />
      {children}
    </div>
  );

  // --- Control layer: portaled to body, pinned to the container's viewport
  // rect so the drag/resize rectangle overlays the background hole. ---
  const controlLayer =
    initialized && typeof document !== 'undefined'
      ? createPortal(
          <div
            className="flexible-background__control-layer"
            style={{
              position: 'fixed',
              left: containerRect.left,
              top: containerRect.top,
              width: containerRect.width,
              height: containerRect.height,
              zIndex: controlZIndex,
              pointerEvents: 'none',
            }}
          >
            <div
              ref={maskRef}
              className={`flexible-background__mask${isEditing ? ' flexible-background__mask--editing' : ''}`}
              style={{
                left: maskPos.x,
                top: maskPos.y,
                width: maskSize.width,
                height: maskSize.height,
                pointerEvents: 'auto',
              }}
              onMouseDown={handleMaskMouseDown}
            >
              {maskImage && (
                <img
                  className="flexible-background__mask-preview"
                  src={maskImage}
                  alt=""
                  draggable={false}
                />
              )}
              {isEditing && (
                <div
                  className="flexible-background__resize-handle"
                  onMouseDown={beginResize}
                />
              )}
            </div>
          </div>,
          controlPortalContainer ?? document.body
        )
      : null;

  return (
    <>
      {backgroundLayer}
      {controlLayer}
    </>
  );
};

export default FlexibleBackground;
