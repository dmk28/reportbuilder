import React, { useEffect, useRef } from 'react';

// Base64-encoded logo image
// This is a placeholder - replace with your actual logo encoded as base64
const LOGO_BASE64 = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MDAiIGhlaWdodD0iNTAwIiB2aWV3Qm94PSIwIDAgNTAwIDUwMCI+CiAgPGRlZnM+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9InN1bnNldCIgeDE9IjAlIiB5MT0iMCUiIHgyPSIwJSIgeTI9IjEwMCUiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjRkY3QjAwIiAvPgogICAgICA8c3RvcCBvZmZzZXQ9IjUwJSIgc3RvcC1jb2xvcj0iI0ZGNTU1MCIgLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjRkYwMDAwIiAvPgogICAgPC9saW5lYXJHcmFkaWVudD4KICAgIDxmaWx0ZXIgaWQ9InNoYWRvdyIgeD0iLTIwJSIgeT0iLTIwJSIgd2lkdGg9IjE0MCUiIGhlaWdodD0iMTQwJSI+CiAgICAgIDxmZUdhdXNzaWFuQmx1ciBpbj0iU291cmNlQWxwaGEiIHN0ZERldmlhdGlvbj0iNSIgLz4KICAgICAgPGZlT2Zmc2V0IGR4PSIwIiBkeT0iNSIgcmVzdWx0PSJvZmZzZXRibHVyIiAvPgogICAgICA8ZmVDb21wb25lbnRUcmFuc2Zlcj4KICAgICAgICA8ZmVGdW5jQSB0eXBlPSJsaW5lYXIiIHNsb3BlPSIwLjUiIC8+CiAgICAgIDwvZmVDb21wb25lbnRUcmFuc2Zlcj4KICAgICAgPGZlTWVyZ2U+CiAgICAgICAgPGZlTWVyZ2VOb2RlIC8+CiAgICAgICAgPGZlTWVyZ2VOb2RlIGluPSJTb3VyY2VHcmFwaGljIiAvPgogICAgICA8L2ZlTWVyZ2U+CiAgICA8L2ZpbHRlcj4KICA8L2RlZnM+CiAgCiAgPGNpcmNsZSBjeD0iMjUwIiBjeT0iMjUwIiByPSIxNTAiIGZpbGw9InVybCgjc3Vuc2V0KSIgZmlsdGVyPSJ1cmwoI3NoYWRvdykiIC8+CiAgCiAgPHBhdGggZD0iTTI1MCwxMjAgTDM1MCwxNzAgTDM1MCwyNzAgQzM1MCwzMjAgMzEwLDM3MCAyNTAsMzkwIEMxOTAsMzcwIDE1MCwzMjAgMTUwLDI3MCBMMTU0LDE3MCBaIiAKICAgICAgICBmaWxsPSJub25lIiBzdHJva2U9IiNGRkZGRkYiIHN0cm9rZS13aWR0aD0iMTAiIGZpbHRlcj0idXJsKCNzaGFkb3cpIiAvPgogIAogIDxyZWN0IHg9IjIyNSIgeT0iMjQwIiB3aWR0aD0iNTAiIGhlaWdodD0iNjAiIHJ4PSI1IiByeT0iNSIgZmlsbD0iI0ZGRkZGRiIgLz4KICA8cmVjdCB4PSIyMTUiIHk9IjIwMCIgd2lkdGg9IjcwIiBoZWlnaHQ9IjQwIiByeD0iMTAiIHJ5PSIxMCIgZmlsbD0iI0ZGRkZGRiIgLz4KICA8Y2lyY2xlIGN4PSIyNTAiIGN5PSIyNzAiIHI9IjEwIiBmaWxsPSIjRkY1NTAwIiAvPgogIDxyZWN0IHg9IjI0NSIgeT0iMjcwIiB3aWR0aD0iMTAiIGhlaWdodD0iMjAiIGZpbGw9IiNGRjU1MDAiIC8+CiAgCiAgPHRleHQgeD0iMjUwIiB5PSI0NTAiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSI0MCIgZm9udC13ZWlnaHQ9ImJvbGQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiNGRkZGRkYiPgogICAgU1VOU0VUIFNFQyAgPC90ZXh0Pgo8L3N2Zz4=`;

interface LogoProps {
  width?: number;
  height?: number;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ width = 200, height = 200, className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // Create a hidden canvas for PNG conversion
    const canvas = document.createElement('canvas');
    canvas.width = 500; // Match SVG dimensions
    canvas.height = 500;
    canvas.style.display = 'none';
    canvas.id = 'logo-canvas';
    document.body.appendChild(canvas);
    canvasRef.current = canvas;

    // Load SVG into an image and draw it on the canvas
    const img = new Image();
    img.onload = () => {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, 500, 500);
        // Create a hidden image with the PNG data
        const pngImg = document.createElement('img');
        pngImg.src = canvas.toDataURL('image/png');
        pngImg.id = 'sunset-logo-hidden';
        pngImg.style.display = 'none';
        document.body.appendChild(pngImg);
      }
    };
    img.src = LOGO_BASE64;

    // Cleanup
    return () => {
      const hiddenImg = document.getElementById('sunset-logo-hidden');
      if (hiddenImg) {
        document.body.removeChild(hiddenImg);
      }
      if (canvasRef.current) {
        document.body.removeChild(canvasRef.current);
      }
    };
  }, []);

  return (
    <img 
      src={LOGO_BASE64} 
      alt="Sunset Security Logo" 
      width={width} 
      height={height} 
      className={className}
      id="sunset-security-logo"
    />
  );
};

// Export the base64 string for use in other components (like PDF export)
export const getLogoBase64 = (): string => {
  // Try to get the PNG version from the hidden image
  const hiddenImg = document.getElementById('sunset-logo-hidden') as HTMLImageElement;
  if (hiddenImg && hiddenImg.complete) {
    return hiddenImg.src;
  }
  
  // Try to get the PNG version from the canvas
  const canvas = document.getElementById('logo-canvas') as HTMLCanvasElement;
  if (canvas) {
    try {
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Error converting logo to PNG:', error);
    }
  }
  
  // Fallback to the original SVG
  return LOGO_BASE64;
};

export default Logo; 