/**
 * 实时语音通话Hook
 * 支持PCM格式实时录音和WebSocket通信
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { VoiceCallService } from '../services/voiceCallService';
import type { VoiceCallServiceCallbacks } from '../services/voiceCallService';
import { encodeAudioOnlyRequest } from '../services/voiceCallProtocol';

// 音频参数
const SAMPLE_RATE = 16000;
const BIT_RATE = 16;
const TIME_SLICE = 100; // ms
const FRAME_SIZE = (SAMPLE_RATE * (BIT_RATE / 8) * TIME_SLICE) / 1000; // 每帧字节数

export interface UseRealtimeVoiceCallReturn {
  isConnected: boolean;
  isRecording: boolean;
  isPlaying: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  recognizedText: string | null;
  error: string | null;
}

/**
 * 实时语音通话Hook
 */
export const useRealtimeVoiceCall = (
  wsUrl: string = 'ws://localhost:8888'
): UseRealtimeVoiceCallReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recognizedText, setRecognizedText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const serviceRef = useRef<VoiceCallService | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const pcmBufferRef = useRef<Int16Array>(new Int16Array(0));

  /**
   * 连接WebSocket
   */
  const connect = useCallback(async () => {
    try {
      setError(null);

      const callbacks: VoiceCallServiceCallbacks = {
        onBotReady: (session) => {
          console.log('[RealtimeVoiceCall] Bot ready, session:', session);
          setIsConnected(true);
        },
        onSentenceRecognized: (sentence) => {
          console.log('[RealtimeVoiceCall] Recognized:', sentence);
          setRecognizedText(sentence);
        },
        onTTSSentenceStart: (sentence) => {
          console.log('[RealtimeVoiceCall] TTS sentence start:', sentence);
        },
        onTTSSentenceEnd: () => {
          console.log('[RealtimeVoiceCall] TTS sentence end');
        },
        onTTSDone: () => {
          console.log('[RealtimeVoiceCall] TTS done');
        },
        onError: (errorMsg) => {
          console.error('[RealtimeVoiceCall] Error:', errorMsg);
          setError(errorMsg);
        },
        onStartPlayAudio: () => {
          setIsPlaying(true);
        },
        onStopPlayAudio: () => {
          setIsPlaying(false);
        },
      };

      const service = new VoiceCallService(wsUrl, callbacks);
      await service.connect();
      serviceRef.current = service;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '连接失败';
      setError(errorMsg);
      throw err;
    }
  }, [wsUrl]);

  /**
   * 断开连接
   */
  const disconnect = useCallback(() => {
    stopRecording();
    serviceRef.current?.disconnect();
    serviceRef.current = null;
    setIsConnected(false);
    setRecognizedText(null);
  }, []);

  /**
   * 发送PCM音频数据
   */
  const sendPCMFrame = useCallback((pcmFrame: Int16Array, isLast: boolean) => {
    if (!serviceRef.current) {
      return;
    }

    // 将Int16Array转换为Blob
    const blob = new Blob([pcmFrame.buffer], { type: 'audio/pcm' });
    const encodedBlob = encodeAudioOnlyRequest(blob);
    
    serviceRef.current.sendAudio(encodedBlob);
  }, []);

  /**
   * 处理音频数据
   */
  const processAudioData = useCallback((
    audioData: Float32Array,
    isLast: boolean
  ) => {
    // 转换为Int16Array (PCM格式)
    const pcm = new Int16Array(audioData.length);
    for (let i = 0; i < audioData.length; i++) {
      // 将-1.0到1.0的浮点数转换为-32768到32767的整数
      const s = Math.max(-1, Math.min(1, audioData[i]));
      pcm[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }

    // 累积到缓冲区
    const currentBuffer = pcmBufferRef.current;
    const newBuffer = new Int16Array(currentBuffer.length + pcm.length);
    newBuffer.set(currentBuffer, 0);
    newBuffer.set(pcm, currentBuffer.length);
    pcmBufferRef.current = newBuffer;

    // 按帧大小切分并发送
    const chunkSize = FRAME_SIZE / (BIT_RATE / 8); // 每帧样本数

    while (true) {
      if (pcmBufferRef.current.length >= chunkSize) {
        const frame = new Int16Array(
          pcmBufferRef.current.subarray(0, chunkSize)
        );
        pcmBufferRef.current = new Int16Array(
          pcmBufferRef.current.subarray(chunkSize)
        );

        const isLastFrame = isLast && pcmBufferRef.current.length === 0;
        sendPCMFrame(frame, isLastFrame);

        if (!isLastFrame) continue;
      } else if (isLast) {
        // 最后不足一帧的数据，补齐发送
        if (pcmBufferRef.current.length > 0) {
          const frame = new Int16Array(chunkSize);
          frame.set(pcmBufferRef.current);
          sendPCMFrame(frame, true);
        } else {
          // 发送空帧表示结束
          const frame = new Int16Array(chunkSize);
          sendPCMFrame(frame, true);
        }
        pcmBufferRef.current = new Int16Array(0);
      }
      break;
    }
  }, [sendPCMFrame]);

  /**
   * 开始录音
   */
  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setRecognizedText(null);

      if (!serviceRef.current) {
        throw new Error('WebSocket未连接');
      }

      // 请求麦克风权限
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: SAMPLE_RATE,
        },
      });

      streamRef.current = stream;

      // 创建AudioContext
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: SAMPLE_RATE,
      });
      audioContextRef.current = audioContext;

      // 创建音频源
      const source = audioContext.createMediaStreamSource(stream);

      // 创建ScriptProcessorNode用于处理音频数据
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        processAudioData(new Float32Array(inputData), false);
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      setIsRecording(true);
      console.log('[RealtimeVoiceCall] Recording started');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '录音启动失败';
      setError(errorMsg);
      console.error('[RealtimeVoiceCall] Error starting recording:', err);
    }
  }, [processAudioData]);

  /**
   * 停止录音
   */
  const stopRecording = useCallback(() => {
    // 停止音频流
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    // 断开音频处理节点
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    // 关闭AudioContext
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // 发送最后的数据
    if (pcmBufferRef.current.length > 0) {
      processAudioData(new Float32Array(0), true);
    } else {
      // 发送空帧表示结束
      const emptyFrame = new Int16Array(FRAME_SIZE / (BIT_RATE / 8));
      sendPCMFrame(emptyFrame, true);
    }

    pcmBufferRef.current = new Int16Array(0);
    setIsRecording(false);
    console.log('[RealtimeVoiceCall] Recording stopped');
  }, [processAudioData, sendPCMFrame]);

  // 清理函数
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    isRecording,
    isPlaying,
    connect,
    disconnect,
    startRecording,
    stopRecording,
    recognizedText,
    error,
  };
};

