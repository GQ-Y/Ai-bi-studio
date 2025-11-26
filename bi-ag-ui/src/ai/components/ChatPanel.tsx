import React, { useState, useRef, useEffect } from 'react';
import { useCopilotChat } from "@copilotkit/react-core";
import { Role, TextMessage } from "@copilotkit/runtime-client-gql";
import { Send, User, Bot, Mic, MicOff, Volume2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { speechToText, textToSpeechStream } from '../services/voiceService';

/**
 * ChatPanel - 嵌入式AI聊天面板组件
 * 用于在Dashboard的AI Copilot模式中显示
 */
export const ChatPanel: React.FC = () => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // 使用 CopilotKit 的核心 Chat Hook
  const { visibleMessages, appendMessage, isLoading } = useCopilotChat();

  const [inputValue, setInputValue] = useState('');
  
  // 语音功能状态
  const { isRecording, startRecording, stopRecording, cancelRecording, error: recorderError } = useVoiceRecorder();
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [autoPlayVoice, setAutoPlayVoice] = useState(true); // 自动播放AI回复的语音
  const lastAssistantMessageRef = useRef<string>('');

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    
    const content = inputValue;
    setInputValue('');
    
    await appendMessage(new TextMessage({
      role: Role.User,
      content: content,
    }));
  };

  // 处理语音输入
  const handleVoiceInput = async () => {
    if (isRecording) {
      // 停止录音并转换为文本
      setIsProcessingVoice(true);
      setVoiceError(null);

      try {
        const audioBlob = await stopRecording();
        if (!audioBlob) {
          throw new Error('录音失败');
        }

        console.log('[ChatPanel] Transcribing audio...');
        const result = await speechToText(audioBlob);
        
        if (result.text) {
          setInputValue(result.text);
          console.log('[ChatPanel] Transcription successful:', result.text);
        } else {
          setVoiceError('未识别到语音内容');
        }
      } catch (error: unknown) {
        const err = error as Error;
        console.error('[ChatPanel] Voice input error:', err);
        setVoiceError(err.message || '语音识别失败');
        cancelRecording();
      } finally {
        setIsProcessingVoice(false);
      }
    } else {
      // 开始录音
      setVoiceError(null);
      await startRecording();
    }
  };

  // 播放AI回复的语音（流式）
  const playAssistantVoice = React.useCallback(async (text: string) => {
    if (!text || isSpeaking) return;

    setIsSpeaking(true);
    setVoiceError(null);

    try {
      console.log('[ChatPanel] Generating and playing speech for text:', text.substring(0, 50));
      // 使用流式TTS，边生成边播放
      await textToSpeechStream(text);
      console.log('[ChatPanel] Speech playback completed');
    } catch (error: unknown) {
      const err = error as Error;
      console.error('[ChatPanel] TTS error:', err);
      setVoiceError(err.message || '语音播放失败');
    } finally {
      setIsSpeaking(false);
    }
  }, [isSpeaking]);

  // 先定义 processMessageContent 函数
  const processMessageContent = React.useCallback((content: string): string => {
    const processed = content
      .replace(/<details[\s\S]*?<\/details>/gi, '')
      .replace(/&lt;details&gt;[\s\S]*?&lt;\/details&gt;/gi, '')
      .replace(/\n<details>\s*<summary>.*?<\/summary>[\s\S]*?<\/details>\s*/gi, '')
      .replace(/<details>\s*<summary>.*?<\/summary>[\s\S]*?<\/details>/gi, '');
    
    if (!processed.trim()) {
      return '';
    }
    
    return processed.trim();
  }, []);

  // Filter and deduplicate messages
  const displayMessages = React.useMemo(() => {
    const seen = new Set<string>();
    const filtered: unknown[] = [];
    
    for (const msg of visibleMessages) {
      const msgAny = msg as unknown as Record<string, unknown>;
      
      // Safely extract content
      const content = msgAny.content 
        ? (typeof msgAny.content === 'string' ? msgAny.content : JSON.stringify(msgAny.content))
        : '';
      
      const isUser = msgAny.role === Role.User || msgAny.role === 'user';
      
      // Create unique key for deduplication
      const key = `${msgAny.role as string}-${content.substring(0, Math.min(50, content.length))}`;
      
      if (!seen.has(key)) {
        seen.add(key);
        
        // For assistant messages, check if there's actual content
        if (!isUser) {
          const processed = processMessageContent(content);
          if (processed || content.includes('Error') || content.includes('错误')) {
            filtered.push(msg);
          }
        } else {
          filtered.push(msg);
        }
      }
    }
    
    return filtered;
  }, [visibleMessages, processMessageContent]);

  // 自动播放最新的AI回复
  useEffect(() => {
    if (!autoPlayVoice || isLoading || displayMessages.length === 0) return;

    const lastMessage = displayMessages[displayMessages.length - 1] as unknown as Record<string, unknown>;
    const isAssistant = lastMessage.role !== Role.User && lastMessage.role !== 'user';

    if (isAssistant) {
      const content = lastMessage.content 
        ? (typeof lastMessage.content === 'string' ? lastMessage.content : JSON.stringify(lastMessage.content))
        : '';
      
      const processedContent = processMessageContent(content);

      // 只播放新的消息（避免重复播放）
      if (processedContent && processedContent !== lastAssistantMessageRef.current) {
        lastAssistantMessageRef.current = processedContent;
        playAssistantVoice(processedContent);
      }
    }
  }, [displayMessages, isLoading, autoPlayVoice, playAssistantVoice, processMessageContent]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [visibleMessages, isLoading]);

  return (
    <div className="flex flex-col h-full relative z-10">
      {/* 聊天记录区域 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        {/* 如果没有消息，显示欢迎语 */}
        {displayMessages.length === 0 && !isLoading && (
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg">
              <Bot size={20} className="text-white" />
            </div>
            <div className="max-w-[80%]">
              <div className="bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-2xl rounded-tl-none text-sm text-slate-100 shadow-sm">
                <p>您好！我是AI综合安防助手。有什么可以帮您的？</p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-slate-300 text-xs">
                  <li>切换页面视图 (如: 切换到监控中心)</li>
                  <li>控制仪表板模式 (如: 打开监控墙)</li>
                  <li>触发紧急警报 (如: 启动紧急模式)</li>
                  <li>配置巡逻设置 (如: 开始自动巡逻)</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* 消息列表 */}
        {displayMessages.map((msg, idx) => {
          const msgAny = msg as unknown as Record<string, unknown>;
          const isUser = msgAny.role === Role.User || msgAny.role === 'user';
          
          const content = msgAny.content 
            ? (typeof msgAny.content === 'string' ? msgAny.content : JSON.stringify(msgAny.content))
            : '';
          
          const displayContent = isUser ? content : processMessageContent(content);
          const messageKey = `${(msgAny.id as string) || idx}-${msgAny.role as string}`;
          
          return (
            <motion.div 
              key={messageKey}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-lg
                ${isUser 
                  ? 'bg-slate-700 border border-white/10' 
                  : 'bg-gradient-to-br from-blue-400 to-indigo-600'
                }
              `}>
                {isUser ? (
                  <User size={20} className="text-slate-300" />
                ) : (
                  <Bot size={20} className="text-white" />
                )}
              </div>
              
              <div className={`
                max-w-[75%] p-4 rounded-2xl text-sm leading-relaxed backdrop-blur-md border
                ${isUser
                  ? 'bg-blue-600/20 border-blue-500/30 text-white rounded-tr-none shadow-sm'
                  : 'bg-white/10 border-white/10 text-slate-100 rounded-tl-none shadow-sm'
                }
              `}>
                {displayContent}
              </div>
            </motion.div>
          );
        })}
        
        {/* Loading indicator */}
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-4"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg">
              <Bot size={20} className="text-white" />
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/10 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-2 text-slate-300 text-sm">
              <span>正在思考</span>
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1s' }} />
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '200ms', animationDuration: '1s' }} />
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '400ms', animationDuration: '1s' }} />
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* 输入框区域 */}
      <div className="mt-4 space-y-2">
        {/* 错误提示 */}
        {(voiceError || recorderError) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-red-400 text-xs"
          >
            {voiceError || recorderError}
          </motion.div>
        )}

        {/* 语音功能控制条 */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoPlayVoice(!autoPlayVoice)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all ${
                autoPlayVoice 
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                  : 'bg-slate-800/50 text-slate-400 border border-white/10 hover:border-white/20'
              }`}
              title={autoPlayVoice ? '关闭语音播放' : '开启语音播放'}
            >
              <Volume2 size={14} />
              <span>{autoPlayVoice ? '语音播放:开' : '语音播放:关'}</span>
            </button>

            {isSpeaking && (
              <div className="flex items-center gap-1 text-blue-400 text-xs">
                <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse" />
                <span>播放中...</span>
              </div>
            )}
          </div>

          {isRecording && (
            <div className="flex items-center gap-2 text-red-400 text-xs animate-pulse">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              <span>录音中</span>
            </div>
          )}
        </div>

        {/* 输入框 */}
        <div className="relative">
          <input 
            type="text" 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isRecording ? "录音中... 点击麦克风停止" : "输入指令或点击麦克风说话..."} 
            disabled={isLoading || isProcessingVoice || isRecording}
            className="w-full bg-slate-900/50 border border-white/10 rounded-full pl-6 pr-24 py-4 text-white placeholder-slate-400 focus:outline-none focus:border-blue-400/50 focus:bg-slate-900/80 transition-all backdrop-blur-md disabled:opacity-50 disabled:cursor-not-allowed"
          />
          
          {/* 语音输入按钮 */}
          <button 
            onClick={handleVoiceInput}
            disabled={isLoading || isProcessingVoice}
            className={`absolute right-14 top-1/2 -translate-y-1/2 p-2 rounded-full text-white transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-400 shadow-red-500/30 animate-pulse' 
                : 'bg-blue-500/80 hover:bg-blue-500 shadow-blue-500/20'
            }`}
            title={isRecording ? "停止录音" : "开始录音"}
          >
            {isProcessingVoice ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isRecording ? (
              <MicOff size={18} />
            ) : (
              <Mic size={18} />
            )}
          </button>

          {/* 发送按钮 */}
          <button 
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading || isRecording}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-500 hover:bg-blue-400 rounded-full text-white transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-500"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

