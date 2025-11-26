/**
 * 语音服务API客户端
 * 处理语音识别和语音合成的API调用
 */

const API_BASE_URL = 'http://localhost:4000';

export interface SpeechToTextResult {
  text: string;
  language?: string;
}

export interface TextToSpeechOptions {
  text: string;
}

/**
 * 语音识别 (ASR)
 * 将音频文件转换为文本
 */
export const speechToText = async (audioBlob: Blob): Promise<SpeechToTextResult> => {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');

  const response = await fetch(`${API_BASE_URL}/api/speech-to-text`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || '语音识别失败');
  }

  return response.json();
};

/**
 * 语音合成 (TTS)
 * 将文本转换为语音音频流
 */
export const textToSpeech = async (text: string): Promise<Blob> => {
  const response = await fetch(`${API_BASE_URL}/api/text-to-speech`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ text })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || '语音合成失败');
  }

  return response.blob();
};

/**
 * 流式语音合成并直接播放
 * 边生成边播放，减少等待时间
 */
export const textToSpeechStream = async (text: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/text-to-speech`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ text })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || '语音合成失败');
  }

  // 获取音频blob并播放
  const audioBlob = await response.blob();
  return playAudioBlob(audioBlob);
};

/**
 * 播放音频Blob
 */
export const playAudioBlob = (audioBlob: Blob): Promise<void> => {
  return new Promise((resolve, reject) => {
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);

    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      resolve();
    };

    audio.onerror = (error) => {
      URL.revokeObjectURL(audioUrl);
      reject(error);
    };

    audio.play().catch(reject);
  });
};

