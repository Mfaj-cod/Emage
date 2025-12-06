import React, { useState, useRef, useEffect } from 'react';
import { Check, X, Move } from 'lucide-react';

interface ImageCropperProps {
  imageSrc: string;
  onCrop: (newImageSrc: string) => void;
  onCancel: () => void;
}

interface CropState {
  x: number;
  y: number;
  width: number;
  height: number;
}

const ImageCropper: React.FC<ImageCropperProps> = ({ imageSrc, onCrop, onCancel }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  const [crop, setCrop] = useState<CropState>({ x: 0, y: 0, width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialCropState, setInitialCropState] = useState<CropState>({ x: 0, y: 0, width: 0, height: 0 });

  // Initialize crop box to 80% of the image center once image loads
  const onImageLoad = () => {
    if (containerRef.current && imageRef.current) {
      const { width, height } = imageRef.current.getBoundingClientRect();
      const initialWidth = width * 0.8;
      const initialHeight = height * 0.8;
      const initialX = (width - initialWidth) / 2;
      const initialY = (height - initialHeight) / 2;
      
      setCrop({
        x: initialX,
        y: initialY,
        width: initialWidth,
        height: initialHeight
      });
    }
  };

  const getClientCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: (e as React.MouseEvent).clientX, y: (e as React.MouseEvent).clientY };
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent, type: string) => {
    e.preventDefault();
    setIsDragging(type);
    const coords = getClientCoordinates(e);
    setDragStart({ x: coords.x, y: coords.y });
    setInitialCropState({ ...crop });
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !containerRef.current || !imageRef.current) return;
    
    e.preventDefault();
    const coords = getClientCoordinates(e);
    const deltaX = coords.x - dragStart.x;
    const deltaY = coords.y - dragStart.y;
    
    const rect = imageRef.current.getBoundingClientRect();
    const maxX = rect.width;
    const maxY = rect.height;

    let newCrop = { ...initialCropState };

    if (isDragging === 'move') {
      newCrop.x = Math.min(Math.max(0, initialCropState.x + deltaX), maxX - initialCropState.width);
      newCrop.y = Math.min(Math.max(0, initialCropState.y + deltaY), maxY - initialCropState.height);
    } else {
      if (isDragging.includes('e')) {
        newCrop.width = Math.min(Math.max(20, initialCropState.width + deltaX), maxX - initialCropState.x);
      }
      if (isDragging.includes('s')) {
        newCrop.height = Math.min(Math.max(20, initialCropState.height + deltaY), maxY - initialCropState.y);
      }
      if (isDragging.includes('w')) {
        const proposedX = Math.min(Math.max(0, initialCropState.x + deltaX), initialCropState.x + initialCropState.width - 20);
        const widthChange = initialCropState.x - proposedX;
        newCrop.x = proposedX;
        newCrop.width = initialCropState.width + widthChange;
      }
      if (isDragging.includes('n')) {
        const proposedY = Math.min(Math.max(0, initialCropState.y + deltaY), initialCropState.y + initialCropState.height - 20);
        const heightChange = initialCropState.y - proposedY;
        newCrop.y = proposedY;
        newCrop.height = initialCropState.height + heightChange;
      }
    }

    setCrop(newCrop);
  };

  const handleMouseUp = () => {
    setIsDragging(null);
  };

  useEffect(() => {
    const handleWindowMouseMove = (e: any) => handleMouseMove(e);
    const handleWindowMouseUp = () => handleMouseUp();

    if (isDragging) {
      window.addEventListener('mousemove', handleWindowMouseMove);
      window.addEventListener('mouseup', handleWindowMouseUp);
      window.addEventListener('touchmove', handleWindowMouseMove, { passive: false });
      window.addEventListener('touchend', handleWindowMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
      window.removeEventListener('touchmove', handleWindowMouseMove);
      window.removeEventListener('touchend', handleWindowMouseUp);
    };
  }, [isDragging, dragStart]); // Added dependencies to ensure closure captures latest state if needed, though mostly using state setters

  const performCrop = () => {
    if (!imageRef.current) return;

    const canvas = document.createElement('canvas');
    const scaleX = imageRef.current.naturalWidth / imageRef.current.width;
    const scaleY = imageRef.current.naturalHeight / imageRef.current.height;

    canvas.width = crop.width * scaleX;
    canvas.height = crop.height * scaleY;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(
        imageRef.current,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        canvas.width,
        canvas.height
      );
      
      onCrop(canvas.toDataURL('image/jpeg', 0.95));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl flex justify-between items-center mb-4 px-4">
        <h3 className="text-white text-lg font-semibold">Crop Image</h3>
        <div className="flex gap-2">
          <button onClick={onCancel} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-white transition">
            <X size={20} />
          </button>
          <button onClick={performCrop} className="p-2 bg-indigo-600 hover:bg-indigo-500 rounded-full text-white transition">
            <Check size={20} />
          </button>
        </div>
      </div>

      <div 
        ref={containerRef}
        className="relative max-h-[80vh] overflow-hidden select-none bg-slate-900 border border-slate-700 rounded-lg"
        style={{ touchAction: 'none' }}
      >
        <img
          ref={imageRef}
          src={imageSrc}
          alt="Crop target"
          className="max-h-[80vh] w-auto h-auto object-contain pointer-events-none"
          onLoad={onImageLoad}
        />

        {/* Dark Overlays */}
        {imageRef.current && (
          <>
            {/* Top */}
            <div className="absolute bg-black/60" style={{ top: 0, left: 0, right: 0, height: crop.y }} />
            {/* Bottom */}
            <div className="absolute bg-black/60" style={{ top: crop.y + crop.height, left: 0, right: 0, bottom: 0 }} />
            {/* Left */}
            <div className="absolute bg-black/60" style={{ top: crop.y, left: 0, width: crop.x, height: crop.height }} />
            {/* Right */}
            <div className="absolute bg-black/60" style={{ top: crop.y, left: crop.x + crop.width, right: 0, height: crop.height }} />
            
            {/* Crop Box */}
            <div
              className="absolute border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.5)] cursor-move"
              style={{
                top: crop.y,
                left: crop.x,
                width: crop.width,
                height: crop.height,
              }}
              onMouseDown={(e) => handleMouseDown(e, 'move')}
              onTouchStart={(e) => handleMouseDown(e, 'move')}
            >
              {/* Grid Lines (Rule of Thirds) */}
              <div className="absolute inset-0 flex flex-col pointer-events-none opacity-40">
                <div className="flex-1 border-b border-white/50" />
                <div className="flex-1 border-b border-white/50" />
                <div className="flex-1" />
              </div>
              <div className="absolute inset-0 flex pointer-events-none opacity-40">
                <div className="flex-1 border-r border-white/50" />
                <div className="flex-1 border-r border-white/50" />
                <div className="flex-1" />
              </div>

              {/* Handles */}
              <div 
                className="absolute -top-1.5 -left-1.5 w-4 h-4 bg-white border border-slate-500 cursor-nw-resize rounded-full"
                onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, 'nw'); }}
                onTouchStart={(e) => { e.stopPropagation(); handleMouseDown(e, 'nw'); }}
              />
              <div 
                className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-white border border-slate-500 cursor-ne-resize rounded-full"
                onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, 'ne'); }}
                onTouchStart={(e) => { e.stopPropagation(); handleMouseDown(e, 'ne'); }}
              />
              <div 
                className="absolute -bottom-1.5 -left-1.5 w-4 h-4 bg-white border border-slate-500 cursor-sw-resize rounded-full"
                onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, 'sw'); }}
                onTouchStart={(e) => { e.stopPropagation(); handleMouseDown(e, 'sw'); }}
              />
              <div 
                className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-white border border-slate-500 cursor-se-resize rounded-full"
                onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, 'se'); }}
                onTouchStart={(e) => { e.stopPropagation(); handleMouseDown(e, 'se'); }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ImageCropper;