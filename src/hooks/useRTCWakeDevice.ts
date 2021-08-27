import { useEffect, useState } from 'react';

/**
 * 采集摄像头和音频设备
 * @param client
 * @param defaultFacingMode
 */
const useRTCWakeDevice = (client: any, defaultFacingMode?: string) => {
  const [localTracks, setLocalTracks] = useState<any[]>([]);
  const [facingMode, setFacingMode] = useState<string>(defaultFacingMode || 'environment');
  useEffect(() => {
    /**
     * 采集设备
     */
    async function wakeDevice(QNRTC: any, facingMode: string) {
      const localTracks = [];
      const cameraTrack = await QNRTC.createCameraVideoTrack({
        tag: 'camera',
        facingMode
      });
      const microphoneTrack = await QNRTC.createMicrophoneAudioTrack({ tag: 'microphone' });
      localTracks.push(cameraTrack, microphoneTrack);
      return localTracks;
    }

    if (client) {
      const QNRTC = window.QNRTC.default;
      wakeDevice(QNRTC, facingMode).then(localTracks => setLocalTracks(localTracks));
    }
  }, [client, facingMode]);
  return {
    localTracks,
    facingMode,
    setFacingMode
  };
};

export default useRTCWakeDevice;