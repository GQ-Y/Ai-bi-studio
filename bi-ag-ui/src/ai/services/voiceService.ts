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
 * 清理文本以适合TTS朗读
 * 移除Markdown格式符号和其他不适合语音的内容
 */
/**
 * 连接音频SSE流
 * 接收后端实时生成的TTS音频
 */
export const connectAudioStream = (
  sessionId: string,
  onAudio: (audioBlob: Blob, text: string, index: number) => void,
  onComplete: () => void,
  onError: (error: Error) => void
): (() => void) => {
  console.log('[Audio Stream] Connecting to SSE:', sessionId);

  const eventSource = new EventSource(`${API_BASE_URL}/api/audio-stream/${sessionId}`);
  
  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      
      if (data.type === 'audio') {
        // 将base64转为Blob
        const audioBytes = Uint8Array.from(atob(data.audio), c => c.charCodeAt(0));
        const audioBlob = new Blob([audioBytes], { type: 'audio/mpeg' });
        
        console.log(`[Audio Stream] Received chunk ${data.index} (${audioBlob.size} bytes)`);
        onAudio(audioBlob, data.text, data.index);
        
      } else if (data.type === 'complete') {
        console.log('[Audio Stream] Stream complete');
        onComplete();
        eventSource.close();
      }
    } catch (error) {
      console.error('[Audio Stream] Parse error:', error);
    }
  };
  
  eventSource.onerror = (error) => {
    console.error('[Audio Stream] SSE error:', error);
    onError(new Error('音频流连接失败'));
    eventSource.close();
  };
  
  // 返回清理函数
  return () => {
    console.log('[Audio Stream] Closing connection');
    eventSource.close();
  };
};

/**
 * 完整AI语音合成
 * 后端将完整文本一次性合成语音，不切分
 */
export const completeAISpeech = async (text: string): Promise<Blob> => {
  console.log('[Complete AI Speech] Requesting TTS for text length:', text.length);

  try {
    const response = await fetch(`${API_BASE_URL}/api/complete-ai-speech`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      throw new Error(`Complete AI Speech failed: ${response.status}`);
    }

    const audioBlob = await response.blob();
    console.log(`[Complete AI Speech] Received complete audio: ${audioBlob.size} bytes`);
    
    return audioBlob;

  } catch (error) {
    console.error('[Complete AI Speech] Error:', error);
    throw error;
  }
};

/**
 * 流式AI语音合成
 * 后端负责切分文本并合成语音，前端接收并播放
 */
export const streamAISpeech = async (
  text: string,
  onAudioChunk: (audioBlob: Blob, index: number, total: number) => void,
  onComplete: () => void,
  onError: (error: Error) => void
): Promise<void> => {
  console.log('[Stream AI Speech] Starting stream for text length:', text.length);

  try {
    const response = await fetch(`${API_BASE_URL}/api/stream-ai-speech`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      throw new Error(`Stream AI Speech failed: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No reader available');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        console.log('[Stream AI Speech] Stream ended');
        break;
      }

      // 解码并累积数据
      buffer += decoder.decode(value, { stream: true });
      
      // 处理完整的SSE消息（以\n\n分隔）
      const messages = buffer.split('\n\n');
      buffer = messages.pop() || ''; // 保留不完整的消息

      for (const message of messages) {
        if (!message.trim() || !message.startsWith('data: ')) {
          continue;
        }

        try {
          const jsonData = JSON.parse(message.substring(6)); // 移除 'data: ' 前缀

          if (jsonData.type === 'audio') {
            // 收到音频chunk
            const audioBytes = Uint8Array.from(atob(jsonData.audio), c => c.charCodeAt(0));
            const audioBlob = new Blob([audioBytes], { type: 'audio/mp3' });
            
            console.log(`[Stream AI Speech] Received chunk ${jsonData.index + 1}/${jsonData.total} (${audioBlob.size} bytes)`);
            onAudioChunk(audioBlob, jsonData.index, jsonData.total);
            
          } else if (jsonData.type === 'complete') {
            console.log(`[Stream AI Speech] All ${jsonData.totalChunks} chunks received`);
            onComplete();
            
          } else if (jsonData.type === 'error') {
            console.error('[Stream AI Speech] Chunk error:', jsonData.message);
            onError(new Error(jsonData.message));
          }
        } catch (parseError) {
          console.error('[Stream AI Speech] Parse error:', parseError, 'Message:', message);
        }
      }
    }

  } catch (error) {
    console.error('[Stream AI Speech] Error:', error);
    onError(error as Error);
  }
};

export const cleanTextForTTS = (text: string): string => {
  let cleaned = text;

  // 移除Markdown标题符号 (# ## ### 等)
  cleaned = cleaned.replace(/^#{1,6}\s+/gm, '');
  
  // 移除Markdown列表符号 (- * + 开头)
  cleaned = cleaned.replace(/^[\s]*[-*+]\s+/gm, '');
  
  // 移除有序列表数字 (1. 2. 3. 等)
  cleaned = cleaned.replace(/^[\s]*\d+\.\s+/gm, '');
  
  // 移除Markdown引用符号 (>)
  cleaned = cleaned.replace(/^[\s]*>\s+/gm, '');
  
  // 移除Markdown代码块标记 (```)
  cleaned = cleaned.replace(/```[\s\S]*?```/g, '代码块');
  
  // 移除行内代码标记 (` `)
  cleaned = cleaned.replace(/`([^`]+)`/g, '$1');
  
  // 移除Markdown粗体/斜体标记 (** __ * _)
  cleaned = cleaned.replace(/(\*\*|__)(.*?)\1/g, '$2');
  cleaned = cleaned.replace(/(\*|_)(.*?)\1/g, '$2');
  
  // 移除Markdown链接，保留文本 [text](url) -> text
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  
  // 移除HTML标签
  cleaned = cleaned.replace(/<[^>]+>/g, '');
  
  // 将多个换行符替换为单个换行
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  
  // 将换行符替换为句号和空格，使语音更自然
  cleaned = cleaned.replace(/\n+/g, '。 ');
  
  // 移除多余的空格
  cleaned = cleaned.replace(/\s{2,}/g, ' ');
  
  // 移除开头和结尾的空白
  cleaned = cleaned.trim();
  
  // 确保句子之间有适当的停顿
  cleaned = cleaned.replace(/([。！？])\s*([^。！？\s])/g, '$1 $2');

  return cleaned;
};

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
  // 清理文本，移除Markdown格式
  const cleanedText = cleanTextForTTS(text);
  
  const response = await fetch(`${API_BASE_URL}/api/text-to-speech`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ text: cleanedText })
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
  // 清理文本，移除Markdown格式
  const cleanedText = cleanTextForTTS(text);
  
  console.log('[TTS] Original text:', text.substring(0, 100));
  console.log('[TTS] Cleaned text:', cleanedText.substring(0, 100));
  
  const response = await fetch(`${API_BASE_URL}/api/text-to-speech`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ text: cleanedText })
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

