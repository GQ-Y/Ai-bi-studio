import { useState, useRef, useCallback } from 'react';

export interface UseVoiceRecorderReturn {
  isRecording: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob | null>;
  cancelRecording: () => void;
  error: string | null;
}

/**
 * 语音录制Hook
 * 使用浏览器的MediaRecorder API录制音频
 */
export const useVoiceRecorder = (): UseVoiceRecorderReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      audioChunksRef.current = [];

      // 请求麦克风权限
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000 // 16kHz适合语音识别
        } 
      });

      streamRef.current = stream;

      // 创建MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
        ? 'audio/webm' 
        : 'audio/ogg';
      
      const mediaRecorder = new MediaRecorder(stream, { 
        mimeType,
        audioBitsPerSecond: 128000 
      });

      mediaRecorderRef.current = mediaRecorder;

      // 收集音频数据
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(100); // 每100ms收集一次数据
      setIsRecording(true);

      console.log('[VoiceRecorder] Recording started');

    } catch (err: unknown) {
      const error = err as Error & { name?: string };
      const errorMsg = error.name === 'NotAllowedError' 
        ? '麦克风权限被拒绝，请允许访问麦克风' 
        : '无法启动录音：' + error.message;
      
      setError(errorMsg);
      console.error('[VoiceRecorder] Error:', err);
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current;
      
      if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        resolve(null);
        return;
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: mediaRecorder.mimeType 
        });

        // 停止所有音频轨道
        streamRef.current?.getTracks().forEach(track => track.stop());
        streamRef.current = null;

        setIsRecording(false);
        audioChunksRef.current = [];

        console.log('[VoiceRecorder] Recording stopped, blob size:', audioBlob.size);
        resolve(audioBlob);
      };

      mediaRecorder.stop();
    });
  }, []);

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;

    audioChunksRef.current = [];
    setIsRecording(false);
    setError(null);

    console.log('[VoiceRecorder] Recording cancelled');
  }, []);

  return {
    isRecording,
    startRecording,
    stopRecording,
    cancelRecording,
    error
  };
};

