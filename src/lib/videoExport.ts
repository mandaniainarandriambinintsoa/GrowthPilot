/**
 * Client-side video export using canvas capture + MediaRecorder API.
 * Captures the Remotion Player's rendered frames and encodes as WebM.
 */

export interface ExportOptions {
  /** Duration in seconds */
  duration: number;
  /** Frames per second */
  fps: number;
  /** Canvas width */
  width: number;
  /** Canvas height */
  height: number;
  /** Filename without extension */
  filename: string;
}

/**
 * Records a canvas element playing a Remotion composition and downloads as WebM.
 *
 * How it works:
 * 1. Finds the canvas inside the Remotion Player container
 * 2. Creates a MediaRecorder from the canvas stream
 * 3. Plays the video and records all frames
 * 4. When done, creates a Blob and triggers download
 */
export async function exportVideoFromPlayer(
  playerContainerRef: HTMLDivElement,
  options: ExportOptions
): Promise<void> {
  // Find the canvas or video element inside the Remotion Player
  const canvas = playerContainerRef.querySelector('canvas');
  const video = playerContainerRef.querySelector('video');

  let stream: MediaStream;

  if (canvas) {
    stream = canvas.captureStream(options.fps);
  } else if (video) {
    stream = (video as any).captureStream(options.fps);
  } else {
    // Fallback: use html2canvas approach — capture the container itself
    // Create an offscreen canvas and draw the container
    throw new Error('No canvas or video found in player. Make sure the preview is visible.');
  }

  return new Promise((resolve, reject) => {
    const chunks: Blob[] = [];

    // Check for supported MIME types
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
        ? 'video/webm;codecs=vp8'
        : 'video/webm';

    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 5_000_000, // 5 Mbps for good quality
    });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      const url = URL.createObjectURL(blob);

      // Trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `${options.filename}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Cleanup
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      resolve();
    };

    recorder.onerror = (e) => {
      reject(new Error(`Recording failed: ${e}`));
    };

    // Start recording
    recorder.start();

    // Stop after the video duration
    setTimeout(() => {
      if (recorder.state === 'recording') {
        recorder.stop();
      }
    }, options.duration * 1000 + 200); // +200ms buffer
  });
}

/**
 * Alternative: capture frames manually using requestAnimationFrame
 * and compile them into a video. This is a simpler fallback.
 */
export function downloadCanvasAsImage(
  playerContainerRef: HTMLDivElement,
  filename: string
): void {
  const canvas = playerContainerRef.querySelector('canvas');
  if (!canvas) {
    console.warn('No canvas found for screenshot');
    return;
  }

  const url = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
