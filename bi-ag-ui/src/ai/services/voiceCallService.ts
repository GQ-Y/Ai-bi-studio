/**
 * 实时语音通话WebSocket服务
 * 参考：ai-app-lab/demohouse/live_voice_call/frontend/src/utils/voice_bot_service.ts
 */

import { pack, decodeWebSocketResponse, EventType, CONST } from './voiceCallProtocol';
import type { WebRequest } from './voiceCallProtocol';

export interface VoiceCallServiceCallbacks {
  onBotReady?: (session: string) => void;
  onSentenceRecognized?: (sentence: string) => void;
  onTTSSentenceStart?: (sentence: string) => void;
  onTTSSentenceEnd?: (audioData: ArrayBuffer) => void;
  onTTSDone?: () => void;
  onError?: (error: string) => void;
  onStartPlayAudio?: () => void;
  onStopPlayAudio?: () => void;
}

export class VoiceCallService {
  private ws: WebSocket | null = null;
  private wsUrl: string;
  private callbacks: VoiceCallServiceCallbacks;
  private audioCtx: AudioContext;
  private source: AudioBufferSourceNode | undefined;
  private audioChunks: ArrayBuffer[] = [];
  private playing = false;

  constructor(wsUrl: string, callbacks: VoiceCallServiceCallbacks) {
    this.wsUrl = wsUrl;
    this.callbacks = callbacks;
    this.audioCtx = new AudioContext();
  }

  /**
   * 连接到WebSocket服务器
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(this.wsUrl);
      
      ws.onopen = () => {
        console.log('[VoiceCall] WebSocket connected');
        this.ws = ws;
        resolve();
      };

      ws.onerror = (e) => {
        console.error('[VoiceCall] WebSocket error:', e);
        this.callbacks.onError?.('WebSocket连接失败');
        reject(e);
      };

      ws.onmessage = (e) => {
        this.handleMessage(e);
      };

      ws.onclose = () => {
        console.log('[VoiceCall] WebSocket closed');
        this.ws = null;
        this.reset();
      };
    });
  }

  /**
   * 发送消息
   */
  sendMessage(message: WebRequest): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('[VoiceCall] WebSocket not connected');
      return;
    }

    const data = pack(message);
    this.ws.send(data);
    console.log('[VoiceCall] Sent message:', message.event);
  }

  /**
   * 发送音频数据
   */
  sendAudio(audioData: Blob): void {
    this.sendMessage({
      event: EventType.USER_AUDIO,
      data: audioData,
    });
  }

  /**
   * 处理接收到的消息
   */
  private handleMessage(e: MessageEvent): void {
    e.data.arrayBuffer().then((buffer: ArrayBuffer) => {
      try {
        const resp = decodeWebSocketResponse(buffer);
        
        if (resp.messageType === CONST.SERVER_FULL_RESPONSE) {
          this.handleJSONMessage(resp.payload as any);
        } else if (resp.messageType === CONST.SERVER_AUDIO_ONLY_RESPONSE) {
          this.handleAudioOnlyResponse(resp.payload as ArrayBuffer);
        }
      } catch (error) {
        console.error('[VoiceCall] Error handling message:', error);
        this.callbacks.onError?.('消息处理失败');
      }
    });
  }

  /**
   * 处理JSON消息
   */
  private handleJSONMessage(json: any): void {
    console.log('[VoiceCall] Received JSON message:', json);

    switch (json.event) {
      case EventType.BOT_READY:
        this.callbacks.onBotReady?.(json.payload?.session);
        break;

      case EventType.SENTENCE_RECOGNIZED:
        this.callbacks.onSentenceRecognized?.(json.payload?.sentence);
        break;

      case EventType.TTS_SENTENCE_START:
        this.callbacks.onTTSSentenceStart?.(json.payload?.sentence);
        break;

      case EventType.TTS_SENTENCE_END:
        // TTS_SENTENCE_END的音频数据在audioOnlyResponse中处理
        break;

      case EventType.TTS_DONE:
        this.callbacks.onTTSDone?.();
        break;

      case EventType.BOT_ERROR:
        this.callbacks.onError?.(json.payload?.message || '未知错误');
        break;

      default:
        console.warn('[VoiceCall] Unknown event type:', json.event);
    }
  }

  /**
   * 处理音频数据响应
   */
  private async handleAudioOnlyResponse(data: ArrayBuffer): Promise<void> {
    this.audioChunks.push(data);
    
    if (!this.playing) {
      this.callbacks.onStartPlayAudio?.();
      this.playNextAudioChunk();
      this.playing = true;
    }
  }

  /**
   * 播放下一个音频块
   */
  private async playNextAudioChunk(): Promise<void> {
    const data = this.audioChunks.shift();
    
    if (!data) {
      this.callbacks.onStopPlayAudio?.();
      this.playing = false;
      return;
    }

    try {
      const audioBuffer = await this.audioCtx.decodeAudioData(data);
      const source = this.audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioCtx.destination);
      
      source.addEventListener('ended', () => {
        this.playNextAudioChunk();
      });

      this.source = source;
      source.start(0);
    } catch (error) {
      console.error('[VoiceCall] Error playing audio:', error);
      // 继续播放下一个块
      this.playNextAudioChunk();
    }
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.reset();
  }

  /**
   * 重置状态
   */
  private reset(): void {
    this.audioChunks = [];
    this.source?.stop();
    this.source = undefined;
    this.playing = false;
  }
}

