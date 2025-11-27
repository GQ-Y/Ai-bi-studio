/**
 * 火山引擎WebSocket客户端实现
 * 参考：ai-app-lab/arkitect/core/component/tts 和 asr
 */

import WebSocket from 'ws';
import { EventEmitter } from 'events';

// ==================== TTS 常量 ====================
const TTS_PROTOCOL_VERSION = 0b1;
const TTS_HEADER_SIZE = 0b1;
const TTS_FULL_CLIENT = 0b0001;
const TTS_WITH_EVENT = 0b0100;
const TTS_JSON = 0b0001;
const TTS_NO_COMPRESSION = 0b0000;
const TTS_INT_SIZE = 4;

// TTS 事件常量
const EventStartConnection = 1;
const EventFinishConnection = 2;
const EventConnectionStarted = 50;
const EventConnectionFailed = 51;
const EventConnectionFinished = 52;
const EventStartSession = 100;
const EventFinishSession = 102;
const EventSessionStarted = 150;
const EventSessionFinished = 152;
const EventSessionFailed = 153;
const EventTaskRequest = 200;
const EventTTSSentenceStart = 350;
const EventTTSSentenceEnd = 351;
const EventTTSResponse = 352;

const TTS_NAMESPACE = "BidirectionalTTS";
// 尝试不同的WebSocket URL
const TTS_BASE_URL = "wss://openspeech.bytedance.com/api/v3/tts/bidirection";
// 备选URL（如果上面的不行）:
// const TTS_BASE_URL_ALT = "wss://openspeech.bytedance.com/api/v1/tts/ws_binary";

// ==================== ASR 常量 ====================
const ASR_BASE_URL = "wss://openspeech.bytedance.com/api/v3/sauc/bigmodel";
const ASR_API_RESOURCE_ID = "volc.bigasr.sauc.duration";

// ==================== 工具函数 ====================

/**
 * 写入TTS消息头
 */
function writeTTSHeader(messageType: number = TTS_FULL_CLIENT, typeFlag: number = TTS_WITH_EVENT): Buffer {
  const header = Buffer.alloc(4);
  header[0] = (TTS_PROTOCOL_VERSION << 4) | TTS_HEADER_SIZE;
  header[1] = (messageType << 4) | typeFlag;
  header[2] = (TTS_JSON << 4) | TTS_NO_COMPRESSION;
  header[3] = 0; // reserved
  return header;
}

/**
 * 写入TTS消息体
 */
function writeTTSMessage(
  event: number,
  payload: string,
  connectionId?: string,
  sessionId?: string
): Buffer {
  const parts: Buffer[] = [];
  
  // Event (4 bytes, signed big-endian)
  const eventBuf = Buffer.alloc(4);
  eventBuf.writeInt32BE(event, 0);
  parts.push(eventBuf);
  
  // Connection ID (if provided)
  if (connectionId) {
    const connIdLen = Buffer.alloc(4);
    connIdLen.writeUInt32BE(connectionId.length, 0);
    parts.push(connIdLen);
    parts.push(Buffer.from(connectionId, 'utf-8'));
  }
  
  // Session ID (if provided)
  if (sessionId) {
    const sessionIdLen = Buffer.alloc(4);
    sessionIdLen.writeUInt32BE(sessionId.length, 0);
    parts.push(sessionIdLen);
    parts.push(Buffer.from(sessionId, 'utf-8'));
  }
  
  // Payload
  const payloadBuf = Buffer.from(payload, 'utf-8');
  const payloadLen = Buffer.alloc(4);
  payloadLen.writeUInt32BE(payloadBuf.length, 0);
  parts.push(payloadLen);
  parts.push(payloadBuf);
  
  return Buffer.concat(parts);
}

/**
 * 解析TTS响应
 */
async function parseTTSResponse(data: Buffer): Promise<{
  event?: number;
  sessionId?: string;
  connectionId?: string;
  payload: any;
  audio?: Buffer;
  audioOnly: boolean;
  sessionFinished: boolean;
}> {
  const headerSize = data[0] & 0x0F;
  const messageTypeSpecificFlags = data[1] & 0x0F;
  const serializationMethod = data[2] >> 4;
  const messageCompression = data[2] & 0x0F;
  
  let ptr = headerSize * 4;
  const result: any = {
    payload: null,
    audioOnly: false,
    sessionFinished: false
  };
  
  // 检查是否有事件
  const hasEvent = messageTypeSpecificFlags === TTS_WITH_EVENT;
  
  if (hasEvent) {
    // 读取事件
    const event = data.readInt32BE(ptr);
    ptr += 4;
    result.event = event;
    
    if (event === EventSessionFinished) {
      result.sessionFinished = true;
    }
    
    // 读取Session ID（某些事件没有）
    if (![
      EventStartConnection,
      EventFinishConnection,
      EventConnectionStarted,
      EventConnectionFailed,
      EventConnectionFinished,
    ].includes(event)) {
      const sessionIdLen = data.readUInt32BE(ptr);
      ptr += 4;
      result.sessionId = data.slice(ptr, ptr + sessionIdLen).toString('utf-8');
      ptr += sessionIdLen;
    }
    
    // 读取Connection ID（某些事件有）
    if ([
      EventConnectionStarted,
      EventConnectionFailed,
      EventConnectionFinished,
    ].includes(event)) {
      const connIdLen = data.readUInt32BE(ptr);
      ptr += 4;
      result.connectionId = data.slice(ptr, ptr + connIdLen).toString('utf-8');
      ptr += connIdLen;
    }
  }
  
  // 读取Payload
  const payloadSize = data.readInt32BE(ptr);
  ptr += 4;
  const payloadData = data.slice(ptr);
  
  let finalPayloadData = payloadData;
  if (messageCompression === 1) { // GZIP
    // GZIP解压缩（同步方式）
    const zlib = await import('zlib');
    finalPayloadData = zlib.gunzipSync(payloadData);
  }
  
  if (serializationMethod === TTS_JSON) {
    try {
      result.payload = JSON.parse(finalPayloadData.toString('utf-8'));
    } catch (e) {
      console.error('[TTS] Failed to parse JSON payload:', e);
    }
  } else if (serializationMethod === 0) { // NO_SERIALIZATION
    result.audioOnly = true;
    result.audio = finalPayloadData;
  }
  
  return result;
}

// ==================== TTS WebSocket客户端 ====================

export class VolcEngineTTSClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private appKey: string;
  private accessKey: string;
  private speaker: string;
  private connId: string;
  private logId: string;
  private sessionId: string | null = null;
  private inited: boolean = false;

  constructor(appKey: string, accessKey: string, speaker: string = 'zh_female_sajiaonvyou_moon_bigtts') {
    super();
    this.appKey = appKey;
    this.accessKey = accessKey;
    this.speaker = speaker;
    this.connId = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
    this.logId = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * 初始化WebSocket连接
   */
  async init(): Promise<void> {
    if (this.inited) {
      return;
    }

    // 根据参考项目和文档，使用header方式传递认证信息
    // 资源ID: volc.service_type.10029 (参考arkitect项目)
    // 注意：文档中可能提到volc.service_type.10053，但arkitect项目使用10029
    // 如果10029不行，可以尝试10053
    const headers: Record<string, string> = {
      'X-Tt-Logid': this.logId,
      'X-Api-Resource-Id': 'volc.service_type.10029', // 参考arkitect项目
      'X-Api-Access-Key': this.accessKey,
      'X-Api-App-Key': this.appKey,
      'X-Api-Connect-Id': this.connId,
    };
    
    // 如果提供了API Key，可能需要使用不同的认证方式
    // 当前先使用ACCESS_TOKEN方式（参考arkitect项目）


    return new Promise((resolve, reject) => {
      // ws库使用headers选项传递自定义header
      // 注意：某些WebSocket服务器可能对header名称大小写敏感
      this.ws = new WebSocket(TTS_BASE_URL, {
        headers: headers
      });

      this.ws.on('open', async () => {
        try {
          // 发送StartConnection消息
          const header = writeTTSHeader();
          const message = writeTTSMessage(EventStartConnection, '{}');
          const frame = Buffer.concat([header, message]);
          if (this.ws) {
            this.ws.send(frame);

            // 等待ConnectionStarted响应
            this.ws.once('message', async (data: Buffer) => {
              try {
                const response = await parseTTSResponse(data);
                if (response.event === EventConnectionStarted) {
                  // 启动TTS会话
                  this.startTTSSession()
                    .then(() => {
                      this.inited = true;
                      resolve();
                    })
                    .catch(reject);
                } else {
                  reject(new Error(`Unexpected event: ${response.event}`));
                }
              } catch (error) {
                reject(error);
              }
            });
          }
        } catch (error) {
          reject(error);
        }
      });

      this.ws.on('error', (error) => {
        reject(error);
      });

      this.ws.on('message', async (data: Buffer) => {
        await this.handleMessage(data);
      });

      this.ws.on('close', () => {
        this.inited = false;
        this.sessionId = null;
      });
    });
  }

  /**
   * 启动TTS会话
   */
  private async startTTSSession(): Promise<void> {
    const sessionConfig = {
      event: EventStartSession,
      namespace: TTS_NAMESPACE,
      req_params: {
        speaker: this.speaker,
        audio_params: {
          format: 'mp3',
          sample_rate: 24000
        }
      }
    };

    const header = writeTTSHeader();
    const message = writeTTSMessage(
      EventStartSession,
      JSON.stringify(sessionConfig),
      this.connId
    );
    const frame = Buffer.concat([header, message]);
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }
    this.ws.send(frame);

    // 等待SessionStarted响应
    return new Promise((resolve, reject) => {
      const handler = async (data: Buffer) => {
        try {
          const response = await parseTTSResponse(data);
          if (response.event === EventSessionStarted) {
            this.sessionId = response.sessionId!;
            if (this.ws) {
              this.ws.off('message', handler);
            }
            resolve();
          } else if (response.event === EventSessionFailed || response.event === 153) {
            if (this.ws) {
              this.ws.off('message', handler);
            }
            reject(new Error('Session failed'));
          }
        } catch (error) {
          if (this.ws) {
            this.ws.off('message', handler);
          }
          reject(error);
        }
      };
      if (this.ws) {
        this.ws.once('message', handler);
      }
    });
  }

  /**
   * 处理接收到的消息
   */
  private async handleMessage(data: Buffer): Promise<void> {
    try {
      const response = await parseTTSResponse(data);

      if (response.audioOnly && response.audio) {
        // 音频数据
        this.emit('audio', response.audio);
      } else if (response.event === EventTTSSentenceStart) {
        // 句子开始
        this.emit('sentenceStart', response.payload?.text || '');
      } else if (response.event === EventTTSSentenceEnd) {
        // 句子结束
        this.emit('sentenceEnd');
      } else if (response.event === EventSessionFinished) {
        // 会话结束
        this.emit('sessionFinished');
      } else if (response.event === EventConnectionFailed) {
        // 连接失败
        this.emit('error', new Error('Connection failed'));
      }
    } catch (error) {
      // 确保错误事件有监听器，避免未处理的错误
      if (this.listenerCount('error') > 0) {
        this.emit('error', error as Error);
      }
    }
  }

  /**
   * 发送文本进行TTS合成
   */
  async synthesize(text: string, finished: boolean = true): Promise<void> {
    if (!this.inited || !this.sessionId) {
      throw new Error('TTS client not initialized');
    }

    const reqParams = {
      speaker: this.speaker,
      audio_params: {
        format: 'mp3',
        sample_rate: 24000
      },
      text: text
    };

    const request = {
      event: EventTaskRequest,
      namespace: TTS_NAMESPACE,
      req_params: reqParams
    };

    const header = writeTTSHeader();
    const message = writeTTSMessage(
      EventTaskRequest,
      JSON.stringify(request),
      undefined,
      this.sessionId!
    );
    const frame = Buffer.concat([header, message]);
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(frame);
    } else {
      throw new Error('WebSocket not connected');
    }

    if (finished) {
      await this.finishSession();
    }
  }

  /**
   * 结束会话
   */
  private async finishSession(): Promise<void> {
    if (!this.sessionId) {
      return;
    }

    const header = writeTTSHeader();
    const message = writeTTSMessage(
      EventFinishSession,
      '{}',
      undefined,
      this.sessionId
    );
    const frame = Buffer.concat([header, message]);
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(frame);
    }
  }

  /**
   * 关闭连接
   */
  async close(): Promise<void> {
    if (this.ws) {
      // 移除所有事件监听器，避免触发错误事件
      this.ws.removeAllListeners();
      
      // 检查WebSocket状态，只有在OPEN或CONNECTING状态时才关闭
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        try {
          this.ws.close();
        } catch (error) {
          // 忽略关闭错误
        }
      }
      this.ws = null;
    }
    this.inited = false;
    this.sessionId = null;
  }
}

// ==================== ASR WebSocket客户端 ====================
// ASR的实现更复杂，需要处理音频流和序列号
// 这里先提供一个基础框架，后续可以完善

export class VolcEngineASRClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private appKey: string;
  private accessKey: string;
  private connId: string;
  private logId: string;
  private inited: boolean = false;

  constructor(appKey: string, accessKey: string) {
    super();
    this.appKey = appKey;
    this.accessKey = accessKey;
    this.connId = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
    this.logId = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  async init(): Promise<void> {
    // ASR初始化逻辑（参考arkitect实现）
    // 暂时先不实现，因为ASR主要用于实时流式识别
    // 当前场景可以先使用文件上传方式
    console.log('[ASR WS] ASR WebSocket client not fully implemented yet');
  }

  async close(): Promise<void> {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.inited = false;
  }
}

