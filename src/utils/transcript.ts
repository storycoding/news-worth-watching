/**
 * Clean transcript text by removing redundant prefixes and boilerplate
 */
export function cleanTranscriptText(transcript: string): string {
  return transcript.replace(
    /^\[Transcript available\] This video has closed captions or transcripts available on YouTube\. /,
    ''
  );
}
