/**
 * 实时语音通话二进制协议工具
 * 参考：ai-app-lab/demohouse/live_voice_call/frontend/src/utils/index.ts
 */

// ==================== 协议常量 ====================
export const CONST = {
  PROTOCOL_VERSION: 0b0001,
  DEFAULT_HEADER_SIZE: 0b0001,

  // 消息类型
  CLIENT_FULL_REQUEST: 0b0001,      // 常规上行请求消息，payload 为 JSON 格式
  CLIENT_AUDIO_ONLY_REQUEST: 0b0010, // 语音上行数据消息，payload 为二进制格式
  SERVER_FULL_RESPONSE: 0b1001,     // 常规下行响应消息，payload 为 JSON 格式
  SERVER_AUDIO_ONLY_RESPONSE: 0b1011, // 语音下行数据消息，payload 为二进制格式

  // 消息类型特定标志
  NO_SEQUENCE: 0b0000,

  // 序列化方式
  NO_SERIALIZATION: 0b0000,
  JSON: 0b0001,

  // 压缩方式
  NO_COMPRESSION: 0b0000,
  GZIP: 0b0001,

  // Payload长度字节数
  PAYLOAD_LENGTH_BYTES: 4,
};

// ==================== 事件类型 ====================
export const EventType = {
  BOT_READY: 'BotReady',
  USER_AUDIO: 'UserAudio',
  SENTENCE_RECOGNIZED: 'SentenceRecognized',
  TTS_SENTENCE_START: 'TTSSentenceStart',
  TTS_SENTENCE_END: 'TTSSentenceEnd',
  TTS_DONE: 'TTSDone',
  BOT_ERROR: 'BotError',
  BOT_UPDATE_CONFIG: 'BotUpdateConfig',
} as const;

// ==================== 类型定义 ====================
export interface WebRequest {
  event?: string;
  payload?: Record<string, unknown>;
  data?: Blob;
}

export interface WebSocketResponse {
  messageType: number;
  payload: Record<string, unknown> | ArrayBuffer;
}

// ==================== 工具函数 ====================

/**
 * 生成WebSocket消息头
 */
function generateWSHeader(msgType: number = CONST.CLIENT_AUDIO_ONLY_REQUEST): DataView {
  const buffer = new ArrayBuffer(8);
  const dataView = new DataView(buffer);
  dataView.setUint8(
    0,
    (CONST.PROTOCOL_VERSION << 4) | CONST.DEFAULT_HEADER_SIZE,
  );
  dataView.setUint8(1, (msgType << 4) | CONST.NO_SEQUENCE);
  dataView.setUint8(2, (CONST.JSON << 4) | CONST.NO_COMPRESSION);
  dataView.setUint8(3, 0x00);
  return dataView;
}

/**
 * 打包成二进制数据(Blob)
 */
export function pack(req: WebRequest): Blob {
  if (req.payload) {
    // JSON格式请求
    const header = generateWSHeader(CONST.CLIENT_FULL_REQUEST);
    const json = JSON.stringify(req);
    const encoded = new TextEncoder().encode(json);
    const byteLength = encoded.length;
    header.setUint32(4, byteLength, false);
    return new Blob([header.buffer as ArrayBuffer, encoded]);
  }
  
  // 音频数据请求
  const header = generateWSHeader(CONST.CLIENT_AUDIO_ONLY_REQUEST);
  const data = req.data || new Blob();
  header.setUint32(4, data.size, false);
  return new Blob([header.buffer as ArrayBuffer, data]);
}

/**
 * 将音频Blob数据加上头部信息
 */
export function encodeAudioOnlyRequest(requestData: Blob): Blob {
  const header = generateWSHeader(CONST.CLIENT_AUDIO_ONLY_REQUEST);
  header.setUint32(4, requestData.size, false);
  return new Blob([header.buffer as ArrayBuffer, requestData]);
}

/**
 * 解析WebSocket响应
 */
export function decodeWebSocketResponse(resp: ArrayBuffer): WebSocketResponse {
  const view = new DataView(resp);
  const headerSize = view.getUint8(0) & 0x0f; // 0~3 bits
  const messageType = (view.getUint8(1) >> 4) & 0x0f; // 4~7 bits
  
  const payload = resp.slice(headerSize * 4);
  const payloadSize = new DataView(payload).getUint32(0);
  const payloadBody = payload.slice(CONST.PAYLOAD_LENGTH_BYTES);
  
  if (messageType === CONST.SERVER_AUDIO_ONLY_RESPONSE) {
    // 音频数据响应
    return {
      messageType: CONST.SERVER_AUDIO_ONLY_RESPONSE,
      payload: payloadBody.slice(0, payloadSize),
    };
  }
  
  // JSON响应
  return {
    messageType: CONST.SERVER_FULL_RESPONSE,
    payload: JSON.parse(new TextDecoder().decode(payloadBody.slice(0, payloadSize))),
  };
}

