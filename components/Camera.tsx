import React, { useRef, useEffect, useState } from 'react';
import { Camera as CameraIcon, X, RefreshCw } from 'lucide-react';

interface CameraProps {
  onCapture: (imageSrc: string) => void;
  onClose: () => void;
}

const Camera: React.FC<CameraProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        setError("Could not access camera. Please allow permissions or upload a file.");
        console.error(err);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const capture = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Flip horizontally for mirror effect if needed, but usually better to capture raw
        ctx.drawImage(videoRef.current, 0, 0);
        const imageSrc = canvas.toDataURL('image/jpeg', 0.85);
        onCapture(imageSrc);
      }
    }
  };

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-50 p-4">
        <p className="text-red-400 mb-4 text-center">{error}</p>
        <button onClick={onClose} className="px-4 py-2 bg-slate-700 rounded-lg text-white">Close</button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50">
      <div className="relative w-full h-full max-w-4xl max-h-[80vh] bg-black rounded-lg overflow-hidden shadow-2xl border border-slate-800">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          className="w-full h-full object-cover transform scale-x-[-1]" 
        />
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition"
        >
          <X size={24} />
        </button>

        <div className="absolute bottom-0 left-0 right-0 p-6 flex justify-center bg-gradient-to-t from-black/80 to-transparent">
          <button 
            onClick={capture}
            className="w-20 h-20 bg-white rounded-full border-4 border-slate-300 shadow-lg hover:scale-105 active:scale-95 transition flex items-center justify-center group"
          >
            <div className="w-16 h-16 bg-white rounded-full border-2 border-black group-hover:bg-slate-100" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Camera;
