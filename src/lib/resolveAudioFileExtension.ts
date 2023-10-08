export function resolveAudioFileExtension(mimetype: string) {
  switch (mimetype) {
    case "audio/webm":
    case "audio/webm;codecs=opus":
      return "webm";
    case "audio/mp3":
      return "mp3";
    case "audio/wav":
      return "wav";
    case "audio/mp4":
      return "mp4";
    case "audio/mpeg":
    case "audio/mpga":
      return "mpeg";
    default:
      throw new Error(`Unsupported audio format: ${mimetype}`);
  }
}
