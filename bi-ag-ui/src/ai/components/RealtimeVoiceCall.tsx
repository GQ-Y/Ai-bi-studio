/**
 * 实时语音通话组件
 * 使用示例：如何在组件中集成实时语音通话功能
 */

import React, { useState } from 'react';
import { useRealtimeVoiceCall } from '../hooks/useRealtimeVoiceCall';
import { Mic, MicOff, Phone, PhoneOff, Volume2 } from 'lucide-react';

export const RealtimeVoiceCall: React.FC = () => {
  const [wsUrl] = useState('ws://localhost:8888');
  
  const {
    isConnected,
    isRecording,
    isPlaying,
    connect,
    disconnect,
    startRecording,
    stopRecording,
    recognizedText,
    error,
  } = useRealtimeVoiceCall(wsUrl);

  const handleConnect = async () => {
    try {
      await connect();
    } catch (err) {
      console.error('连接失败:', err);
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const handleToggleRecording = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      await startRecording();
    }
  };

  return (
    <div className="realtime-voice-call p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">实时语音通话</h3>

      {/* 连接状态 */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <div
            className={`w-3 h-3 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-gray-400'
            }`}
          />
          <span className="text-sm">
            {isConnected ? '已连接' : '未连接'}
          </span>
        </div>

        {isPlaying && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <Volume2 className="w-4 h-4 animate-pulse" />
            <span>正在播放AI回复...</span>
          </div>
        )}
      </div>

      {/* 控制按钮 */}
      <div className="flex gap-2 mb-4">
        {!isConnected ? (
          <button
            onClick={handleConnect}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2"
          >
            <Phone className="w-4 h-4" />
            连接
          </button>
        ) : (
          <>
            <button
              onClick={handleDisconnect}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 flex items-center gap-2"
            >
              <PhoneOff className="w-4 h-4" />
              断开
            </button>
            <button
              onClick={handleToggleRecording}
              disabled={!isConnected}
              className={`px-4 py-2 rounded flex items-center gap-2 ${
                isRecording
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-green-500 text-white hover:bg-green-600'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isRecording ? (
                <>
                  <MicOff className="w-4 h-4" />
                  停止录音
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  开始录音
                </>
              )}
            </button>
          </>
        )}
      </div>

      {/* 识别结果 */}
      {recognizedText && (
        <div className="mb-4 p-3 bg-gray-100 rounded">
          <div className="text-sm text-gray-600 mb-1">识别结果：</div>
          <div className="text-base">{recognizedText}</div>
        </div>
      )}

      {/* 错误信息 */}
      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded text-sm">
          {error}
        </div>
      )}
    </div>
  );
};

