'use client'

import React, { useEffect, useRef } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

function Base64VideoPlayer({base64String}:{base64String: any}) {
  const videoRef = useRef(null);

  useEffect(() => {
    // Function to convert Base64 to binary and create a temporary file
    const createVideoFile = async (base64String: any) => {
      const binaryString = window.atob(base64String);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Create a Blob and URL object
      const blob = new Blob([bytes], { type: 'video/mp4' });
      const videoUrl = URL.createObjectURL(blob);

      // Initialize video.js player
      const player = videojs(videoRef?.current || "", {
        sources: [{ src: videoUrl, type: 'video/mp4' }],
        // Other video.js options
      });

      return () => {
        player.dispose();
        URL.revokeObjectURL(videoUrl);
      };
    };

    createVideoFile(base64String);
  }, [base64String]);

  return (
    <div>
      <video ref={videoRef} className="video-js vjs-default-skin"></video>
    </div>
  );
}

export default Base64VideoPlayer;
