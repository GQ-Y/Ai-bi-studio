/**
 * 火山引擎ASR WebSocket客户端实现
 * 参考：ai-app-lab/arkitect/core/component/asr/asr_client.py
 */

import WebSocket from 'ws';
import { EventEmitter } from 'events';
import * as zlib from 'zlib';

// ==================== ASR 常量 ====================
const ASR_PROTOCOL_VERSION = 0b0001;
const ASR_HEADER_SIZE = 0b0001;

// 消息类型
const ASR_FULL_CLIENT_REQUEST = 0b0001;
const ASR_AUDIO_ONLY_REQUEST = 0b0010;
const ASR_FULL_SERVER_RESPONSE = 0b1001;
const ASR_SERVER_ACK = 0b1011;
const ASR_SERVER_ERROR_RESPONSE = 0b1111;

// 消息类型特定标志
const ASR_NO_SEQUENCE = 0b0000;
const ASR_POS_SEQUENCE = 0b0001;
const ASR_NEG_SEQUENCE = 0b0010;
const ASR_NEG_WITH_SEQUENCE = 0b0011;

// 序列化方式
const ASR_NO_SERIALIZATION = 0b0000;
const ASR_JSON = 0b0001;

// 压缩方式
const ASR_NO_COMPRESSION = 0b0000;
const ASR_GZIP = 0b0001;

const ASR_BASE_URL = 'wss://openspeech.bytedance.com/api/v3/sauc/bigmodel';
const ASR_API_RESOURCE_ID = 'volc.bigasr.sauc.duration';

// ==================== 类型定义 ====================
export interface ASRResult {
  text?: string;
  utterances?: Array<{
    definite: boolean;
    end_time: number;
    start_time: number;
    text: string;
    words?: Array<{
      blank_duration?: number;
      end_time: number;
      start_time: number;
      text: string;
    }>;
  }>;
}

export interface ASRResponse {
  sequence?: number;
  last_package: boolean;
  result?: ASRResult;
  audio?: {
    duration?: number;
  };
}

// ==================== 工具函数 ====================

/**
 * 生成ASR消息头
 */
function generateASRHeader(
  messageType: number = ASR_FULL_CLIENT_REQUEST,
  messageTypeSpecificFlags: number = ASR_NO_SEQUENCE,
  serializationMethod: number = ASR_JSON,
  compressionType: number = ASR_GZIP
): Buffer {
  const header = Buffer.alloc(4);
  header.writeUInt8((ASR_PROTOCOL_VERSION << 4) | ASR_HEADER_SIZE, 0);
  header.writeUInt8((messageType << 4) | messageTypeSpecificFlags, 1);
  header.writeUInt8((serializationMethod << 4) | compressionType, 2);
  header.writeUInt8(0x00, 3); // Reserved
  return header;
}

/**
 * 生成序列号（用于POS_SEQUENCE）
 */
function generateSequence(sequence: number): Buffer {
  const seqBuf = Buffer.alloc(4);
  seqBuf.writeInt32BE(sequence, 0);
  return seqBuf;
}

/**
 * 解析ASR响应
 */
function parseASRResponse(data: Buffer): any {
  const headerSize = data[0] & 0x0F;
  const messageType = (data[1] >> 4) & 0x0F;
  const messageTypeSpecificFlags = data[1] & 0x0F;
  const serializationMethod = (data[2] >> 4) & 0x0F;
  const messageCompression = data[2] & 0x0F;

  let ptr = headerSize * 4;
  const result: any = {
    last_package: false,
  };

  // 检查是否有序列号
  if (messageTypeSpecificFlags & 0x01) {
    const seq = data.readInt32BE(ptr);
    ptr += 4;
    result.sequence = seq;
  }

  // 检查是否是最后一个包
  if (messageTypeSpecificFlags & 0x02) {
    result.last_package = true;
  }

  // 解析payload
  if (messageType === ASR_FULL_SERVER_RESPONSE) {
    const payloadSize = data.readUInt32BE(ptr);
    ptr += 4;
    let payloadData = data.slice(ptr, ptr + payloadSize);

    // 解压缩
    if (messageCompression === ASR_GZIP) {
      payloadData = zlib.gunzipSync(payloadData);
    }

    // 解析JSON
    if (serializationMethod === ASR_JSON) {
      try {
        result.payload = JSON.parse(payloadData.toString('utf-8'));
      } catch (e) {
        console.error('[ASR] Failed to parse JSON payload:', e);
      }
    }
  } else if (messageType === ASR_SERVER_ACK) {
    const seq = data.readInt32BE(ptr);
    ptr += 4;
    result.sequence = seq;
    if (data.length >= ptr + 4) {
      const payloadSize = data.readUInt32BE(ptr);
      ptr += 4;
      if (payloadSize > 0) {
        let payloadData = data.slice(ptr, ptr + payloadSize);
        if (messageCompression === ASR_GZIP) {
          payloadData = zlib.gunzipSync(payloadData);
        }
        if (serializationMethod === ASR_JSON) {
          try {
            result.payload = JSON.parse(payloadData.toString('utf-8'));
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    }
  } else if (messageType === ASR_SERVER_ERROR_RESPONSE) {
    const code = data.readUInt32BE(ptr);
    ptr += 4;
    result.code = code;
    const payloadSize = data.readUInt32BE(ptr);
    ptr += 4;
    if (payloadSize > 0) {
      let payloadData = data.slice(ptr, ptr + payloadSize);
      if (messageCompression === ASR_GZIP) {
        payloadData = zlib.gunzipSync(payloadData);
      }
      if (serializationMethod === ASR_JSON) {
        try {
          result.payload = JSON.parse(payloadData.toString('utf-8'));
        } catch (e) {
          // 忽略解析错误
        }
      }
    }
  }

  return result;
}

// ==================== VolcEngineASRClient 类 ====================
export class VolcEngineASRClient extends EventEmitter {
  private ws: WebSocket | null = null;
  public inited: boolean = false;
  private connId: string;
  private logId: string;
  private audioQueue: Buffer[] = [];
  private responseQueue: ASRResponse[] = [];

  constructor(
    private appKey: string,
    private accessKey: string,
    private apiResourceId: string = ASR_API_RESOURCE_ID,
    connId: string = `${Date.now()}_${Math.random().toString(36).substring(7)}`,
    logId: string = `${Date.now()}_${Math.random().toString(36).substring(7)}`
  ) {
    super();
    this.connId = connId;
    this.logId = logId;
  }

  /**
   * 初始化WebSocket连接
   */
  async init(): Promise<void> {
    if (this.inited) {
      return;
    }

    const headers: Record<string, string> = {
      'X-Api-Resource-Id': this.apiResourceId,
      'X-Api-Access-Key': this.accessKey,
      'X-Api-App-Key': this.appKey,
      'X-Api-Request-Id': this.logId,
    };


    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(ASR_BASE_URL, {
        headers: headers
      });

      this.ws.on('open', async () => {
        // 等待一小段时间确保WebSocket完全就绪
        await new Promise(resolve => setTimeout(resolve, 100));
        try {
          // 检查WebSocket状态
          if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            throw new Error('WebSocket not ready after open event');
          }
          // 发送初始化请求
          await this.sendInitRequest();
          this.inited = true;
          resolve();
        } catch (error) {
          this.inited = false;
          reject(error);
        }
      });

      this.ws.on('message', (data: Buffer) => {
        this.handleMessage(data);
      });

      this.ws.on('error', (error) => {
        console.error('[ASR WS] Error:', error);
        this.emit('error', error);
        reject(error);
      });

      this.ws.on('close', () => {
        this.inited = false;
        this.emit('close');
      });
    });
  }

  /**
   * 发送初始化请求
   */
  private async sendInitRequest(): Promise<void> {
    if (!this.ws) {
      throw new Error('WebSocket not connected');
    }

    // ASR初始化请求格式
    const initRequest = {
      user: null,
      audio: {
        format: 'pcm',
        codec: 'pcm',
        sample_rate: 16000,
        channel: 1,
      },
      request: {
        model_name: 'bigmodel',
        enable_itn: true,
        enable_ddc: false,
        enable_punc: true,
      },
    };

    const payloadJson = JSON.stringify(initRequest);
    const payloadBytes = Buffer.from(payloadJson, 'utf-8');
    const compressedPayload = zlib.gzipSync(payloadBytes);

    // 构建消息
    const header = generateASRHeader(
      ASR_FULL_CLIENT_REQUEST,
      ASR_POS_SEQUENCE,
      ASR_JSON,
      ASR_GZIP
    );
    const sequence = generateSequence(1);
    const payloadSize = Buffer.alloc(4);
    payloadSize.writeUInt32BE(compressedPayload.length, 0);

    const frame = Buffer.concat([
      header,
      sequence,
      payloadSize,
      compressedPayload,
    ]);

    this.ws.send(frame);

    // 等待初始化响应
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('ASR init timeout'));
      }, 10000);

      this.ws!.once('message', (data: Buffer) => {
        clearTimeout(timeout);
        try {
          const response = parseASRResponse(data);
          if (response.payload) {
            resolve();
          } else {
            reject(new Error('Invalid init response'));
          }
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  /**
   * 发送音频数据
   */
  async sendAudio(audioData: Buffer, isLast: boolean = false): Promise<void> {
    if (!this.ws || !this.inited) {
      throw new Error('WebSocket not connected or not initialized');
    }

    // 压缩音频数据
    const compressedAudio = zlib.gzipSync(audioData);

    // 构建音频消息
    const header = generateASRHeader(
      ASR_AUDIO_ONLY_REQUEST,
      ASR_NO_SEQUENCE,
      ASR_NO_SERIALIZATION,
      ASR_GZIP
    );
    const payloadSize = Buffer.alloc(4);
    payloadSize.writeUInt32BE(compressedAudio.length, 0);

    const frame = Buffer.concat([header, payloadSize, compressedAudio]);

    this.ws.send(frame);
  }

  /**
   * 处理接收到的消息
   */
  private handleMessage(data: Buffer): void {
    try {
      const response = parseASRResponse(data);
      
      if (response.code) {
        // 错误响应
        console.error('[ASR WS] Server error:', response.code, response.payload);
        const error = new Error(`ASR Server Error: ${response.code}`);
        // 确保错误事件有监听器，避免未处理的错误
        if (this.listenerCount('error') > 0) {
          this.emit('error', error);
        } else {
          console.error('[ASR WS] Unhandled error (no listeners):', error);
        }
        return;
      }

      // 构建ASR响应对象
      const asrResponse: ASRResponse = {
        sequence: response.sequence,
        last_package: response.last_package,
        result: response.payload?.result,
        audio: response.payload?.audio_info,
      };

      this.responseQueue.push(asrResponse);
      this.emit('response', asrResponse);

      // 如果有识别结果文本，也单独发送
      if (asrResponse.result?.text) {
        this.emit('text', asrResponse.result.text);
      }

      // 如果有utterances，也发送
      if (asrResponse.result?.utterances && asrResponse.result.utterances.length > 0) {
        this.emit('utterances', asrResponse.result.utterances);
      }
    } catch (error) {
      console.error('[ASR WS] Error handling message:', error);
      // 确保错误事件有监听器，避免未处理的错误
      if (this.listenerCount('error') > 0) {
        this.emit('error', error);
      } else {
        console.error('[ASR WS] Unhandled error (no listeners):', error);
      }
    }
  }

  /**
   * 关闭连接
   */
  async close(): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      await new Promise<void>((resolve) => {
        this.ws!.once('close', () => resolve());
        this.ws!.close();
      });
    }
    this.inited = false;
    this.ws = null;
  }
}

