// Basic mic input + frequency capture (Web Audio API)

export async function initMicStream(): Promise<MediaStream> {
  return await navigator.mediaDevices.getUserMedia({ audio: true });
}

export function createAnalyser(stream: MediaStream): AnalyserNode {
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const source = audioCtx.createMediaStreamSource(stream);
  const analyser = audioCtx.createAnalyser();

  analyser.fftSize = 2048;
  source.connect(analyser);

  return analyser;
}

export function getFrequencyData(analyser: AnalyserNode): Uint8Array {
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  analyser.getByteFrequencyData(dataArray);
  return dataArray;
}
