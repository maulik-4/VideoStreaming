import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const YouTubePlayer = () => {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const iframeRef = useRef(null);
  const wasHiddenRef = useRef(false);

  // Resume playback when tab regains focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        wasHiddenRef.current = true;
      } else if (wasHiddenRef.current && iframeRef.current) {
        // Tab became visible again - attempt to resume
        wasHiddenRef.current = false;
        if (iframeRef.current.contentWindow) {
          iframeRef.current.contentWindow.postMessage(
            { event: 'command', func: 'playVideo' },
            '*'
          );
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-2 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <div className="w-full max-w-xs sm:max-w-md md:max-w-3xl lg:max-w-5xl aspect-video glass-card rounded-lg sm:rounded-xl overflow-hidden shadow-lg">
        <iframe
          ref={iframeRef}
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&controls=1`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="w-full h-full"
        ></iframe>
      </div>
      <div className="mt-3 sm:mt-4 md:mt-6 flex flex-col xs:flex-row gap-2 xs:gap-3 w-full max-w-xs sm:max-w-md md:max-w-3xl lg:max-w-5xl">
        <button 
          className="accent-btn px-3 sm:px-4 py-1.5 sm:py-2 rounded text-sm sm:text-base font-medium transition-opacity hover:opacity-90 flex-1 xs:flex-none"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>
        <button 
          className="px-3 sm:px-4 py-1.5 sm:py-2 rounded text-sm sm:text-base font-medium border border-soft transition-opacity hover:opacity-90 flex-1 xs:flex-none"
          onClick={() => navigate('/')}
        >
          🏠 Home
        </button>
      </div>
      <p className="text-muted text-xs sm:text-sm mt-4 text-center max-w-md">
        💡 Playback resumes when you return to this tab
      </p>
    </div>
  );
};

export default YouTubePlayer;
