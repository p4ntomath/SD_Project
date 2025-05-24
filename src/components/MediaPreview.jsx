import { useState, useEffect } from 'react';
import { FiPaperclip, FiX, FiMaximize2, FiMinimize2, FiDownload } from 'react-icons/fi';

export default function MediaPreview({ attachment, className = '' }) {
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const isImage = attachment.type.startsWith('image/');
  const isVideo = attachment.type.startsWith('video/');
  const isAudio = attachment.type.startsWith('audio/');

  // Handle escape key for closing fullscreen
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showFullscreen) {
        setShowFullscreen(false);
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showFullscreen]);

  if (isImage) {
    return (
      <>
        <figure className={`relative group ${className}`}>
          {/* First load thumbnail, then switch to full image */}
          <img 
            src={attachment.thumbnailUrl || attachment.url} 
            alt={attachment.name}
            className={`max-w-full h-auto rounded-lg cursor-pointer transition-opacity duration-300 ${
              !isImageLoaded && attachment.thumbnailUrl ? 'filter blur-[2px]' : ''
            }`}
            onClick={() => setShowFullscreen(true)}
          />
          {attachment.thumbnailUrl && (
            <img
              src={attachment.url}
              className="hidden"
              onLoad={() => setIsImageLoaded(true)}
              alt=""
              aria-hidden="true"
            />
          )}
          <button
            onClick={() => setShowFullscreen(true)}
            className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-all opacity-0 group-hover:opacity-100"
            aria-label="View full size image"
          >
            <FiMaximize2 className="h-6 w-6 text-white drop-shadow-lg" />
          </button>
          {attachment.dimensions && (
            <figcaption className="absolute bottom-2 right-2 text-xs text-white bg-black/50 px-2 py-1 rounded-md">
              {attachment.dimensions.width} × {attachment.dimensions.height}
            </figcaption>
          )}
        </figure>

        {showFullscreen && (
          <dialog 
            open 
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" 
            onClick={() => setShowFullscreen(false)}
          >
            <article 
              className="relative max-w-full max-h-[90vh]" 
              onClick={e => e.stopPropagation()}
            >
              {/* Close button absolutely positioned in the corner */}
              <button
                onClick={() => setShowFullscreen(false)}
                className="absolute -top-4 -right-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                aria-label="Close preview"
              >
                <FiX className="h-6 w-6 text-gray-900" />
              </button>

              <figure className="relative">
                <img 
                  src={attachment.url} 
                  alt={attachment.name}
                  className="max-w-full max-h-[90vh] object-contain"
                />
                <figcaption className="sr-only">{attachment.name}</figcaption>
              </figure>

              <footer className="absolute bottom-4 right-4">
                <a
                  href={attachment.url}
                  download={attachment.name}
                  className="p-2 text-white hover:bg-white/10 rounded-full"
                  onClick={e => e.stopPropagation()}
                  aria-label={`Download ${attachment.name}`}
                >
                  <FiDownload className="h-6 w-6" />
                </a>
              </footer>
            </article>
          </dialog>
        )}
      </>
    );
  }

  if (isVideo) {
    return (
      <article className={`${className} space-y-2`}>
        <figure>
          <video 
            controls 
            className="max-w-full rounded-lg"
            preload="metadata"
            poster={attachment.thumbnailUrl}
            aria-label={attachment.name}
          >
            <source src={attachment.url} type={attachment.type} />
            <p>Your browser does not support the video tag.</p>
          </video>
          <figcaption className="flex items-center justify-between text-sm text-gray-500 mt-2">
            <span>{attachment.name}</span>
            <a
              href={attachment.url}
              download={attachment.name}
              className="p-1 hover:bg-gray-100 rounded-full"
              onClick={e => e.stopPropagation()}
              aria-label={`Download ${attachment.name}`}
            >
              <FiDownload className="h-4 w-4" />
            </a>
          </figcaption>
        </figure>
      </article>
    );
  }

  if (isAudio) {
    return (
      <article className={`bg-gray-100 rounded-lg p-3 ${className}`}>
        <header className="flex items-center space-x-3 mb-2">
          <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center" aria-hidden="true">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
          <span className="text-sm text-gray-600 truncate flex-1">{attachment.name}</span>
          <a
            href={attachment.url}
            download={attachment.name}
            className="p-1 hover:bg-gray-200 rounded-full"
            onClick={e => e.stopPropagation()}
            aria-label={`Download ${attachment.name}`}
          >
            <FiDownload className="h-4 w-4" />
          </a>
        </header>
        <figure>
          <audio controls className="w-full" preload="metadata" aria-label={attachment.name}>
            <source src={attachment.url} type={attachment.type} />
            <p>Your browser does not support the audio element.</p>
          </audio>
        </figure>
      </article>
    );
  }

  // For other file types (documents, etc)
  return (
    <article className={`${className}`}>
      <a 
        href={attachment.url} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="flex items-center p-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        download={attachment.name}
        aria-label={`Download ${attachment.name} (${(attachment.size / 1024 / 1024).toFixed(1)}MB)`}
      >
        <FiPaperclip className="h-4 w-4 mr-2 text-gray-500" aria-hidden="true" />
        <span className="text-sm text-gray-700 truncate flex-1">{attachment.name}</span>
        <span className="text-xs text-gray-500 mx-2" aria-label="File size">
          {(attachment.size / 1024 / 1024).toFixed(1)}MB
        </span>
        <FiDownload className="h-4 w-4 text-gray-500" aria-hidden="true" />
      </a>
    </article>
  );
}