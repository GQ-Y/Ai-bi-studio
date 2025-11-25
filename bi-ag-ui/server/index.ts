import express from 'express';
import cors from 'cors';
import { CopilotRuntime, copilotRuntimeNodeExpressEndpoint } from '@copilotkit/runtime';
import { OpenAIAdapter } from '@copilotkit/runtime';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = 4000;

app.use(cors());
app.use(express.json());

// SiliconFlow Configuration
// Using Kimi model which supports reasoning and tools better
const openai = new OpenAI({
  apiKey: process.env.SILICONFLOW_API_KEY || 'sk-sedikaywkisyertdnwzqbwgdncqndeqfjgrcutiirgbebfgk',
  baseURL: 'https://api.siliconflow.cn/v1',
});

const copilotRuntime = new CopilotRuntime();

const SYSTEM_PROMPT = `你是一个AI综合安防风险治理平台的智能助手。
你的职责是协助用户管理安防系统、监控视频流、处理警报和执行巡逻任务。
请严格遵守以下要求：
1. **语言要求**：所有回复（包括思考过程）必须严格使用**中文**。
2. **思考过程**：在回答前，请先进行深入思考，分析用户意图和当前系统状态。
3. **隐式思考**：你的思考过程将被折叠显示，请专注于分析，但不要在思考过程中直接与用户对话。
4. **回复风格**：专业、客观、简洁、高效。直接解决用户问题，不要有过多的寒暄。
5. **上下文意识**：时刻关注提供的系统状态（如activeAlerts, currentView等），并据此调整建议。`;

class SiliconFlowAdapter extends OpenAIAdapter {
    constructor() {
        // Changed model to Kimi-K2-Thinking as requested
        super({ openai: openai as any, model: "moonshotai/Kimi-K2-Thinking" });
    }

    async process(request: any): Promise<any> {
        // Extract necessary data
        const { messages, eventSource, actions } = request;
        
        console.log(`[SiliconFlowAdapter] Processing request. Actions count: ${actions?.length || 0}`);

        // 1. Better Message Role Mapping Logic and System Prompt Injection
        const openAIMessages = messages.map((msg: any) => {
             let role = 'user'; // Default fallback
             let content = msg.content;

             if (msg.role === 'system') {
                 role = 'system';
             } else if (msg.role === 'assistant') {
                 role = 'assistant';
             } else if (msg.role === 'user') {
                 role = 'user';
             } else if (msg.type === 'TextMessage') {
                 role = msg.role || 'user'; 
             } else if (msg.type === 'ActionExecutionMessage') {
                 // Skip action execution messages in history - they cause issues
                 return null;
             } else if (msg.type === 'ResultMessage') {
                 // Skip result messages in history - they cause issues without tool_call_id
                 return null;
             }

             // Sanity check
             const validRoles = ['system', 'assistant', 'user'];
             if (!validRoles.includes(role)) {
                 console.warn(`[SiliconFlowAdapter] Invalid role: ${role}, falling back to user`);
                 role = 'user';
             }
             
             if (typeof content !== 'string') {
                 content = JSON.stringify(content || "");
             }
             
             // Validate content
             if (!content || content.trim() === '') {
                 console.warn(`[SiliconFlowAdapter] Empty content for role ${role}, skipping`);
                 return null;
             }

             return { role, content };
        }).filter((msg: any) => msg !== null); // Remove null entries

        console.log(`[SiliconFlowAdapter] Processed ${openAIMessages.length} messages from ${messages.length} original messages`);

        // Inject or prepend System Prompt
        // Check if the first message is system, if so, append/replace. If not, prepend.
        if (openAIMessages.length > 0 && openAIMessages[0].role === 'system') {
            openAIMessages[0].content = `${SYSTEM_PROMPT}\n\n${openAIMessages[0].content}`;
        } else {
            openAIMessages.unshift({ role: 'system', content: SYSTEM_PROMPT });
        }

        // Helper to convert CopilotKit actions to OpenAI tools
        // Due to CopilotKit parameter serialization issues, we hardcode known action schemas
        const KNOWN_ACTION_SCHEMAS: Record<string, any> = {
            navigateToPage: {
                type: "object",
                properties: {
                    page: {
                        type: "string",
                        description: "The target page view. Options: dashboard, monitor, alert, patrol, broadcast. Also accepts Chinese: 综合态势/监控中心/预警中心/巡查治理/广播喊话"
                    }
                },
                required: ["page"]
            },
            setDashboardMode: {
                type: "object",
                properties: {
                    mode: {
                        type: "string",
                        description: "The dashboard center panel mode. Options: video-grid (监控墙), map (地图), ai-chat (AI助手)"
                    }
                },
                required: ["mode"]
            },
            setEmergencyMode: {
                type: "object",
                properties: {
                    active: {
                        type: "boolean",
                        description: "True to activate emergency mode, false to deactivate"
                    }
                },
                required: ["active"]
            },
            toggleSidebar: {
                type: "object",
                properties: {},
                description: "Toggle the navigation sidebar. No parameters needed."
            },
            configurePatrol: {
                type: "object",
                properties: {
                    active: {
                        type: "boolean",
                        description: "Start or stop automated camera patrolling"
                    },
                    interval: {
                        type: "number",
                        description: "Time interval between camera switches in minutes"
                    }
                }
            }
        };

        const tools = actions && actions.length > 0 ? actions.map((action: any) => {
            // Use hardcoded schema if available, otherwise use flexible schema
            const parametersSchema = KNOWN_ACTION_SCHEMAS[action.name] || {
                type: "object",
                properties: {},
                additionalProperties: true,
                description: `Parameters for ${action.name}. The model should infer appropriate parameters from the context.`
            };
            
            console.log(`[SiliconFlowAdapter] Using schema for ${action.name}:`, JSON.stringify(parametersSchema, null, 2));
            
            return {
                type: "function",
                function: {
                    name: action.name,
                    description: action.description,
                    parameters: parametersSchema,
                }
            };
        }) : undefined;

        // Manually handle the stream events
        eventSource.stream(async (eventStream$: any) => {
            let startedTextMessage = false;
            let messageId: string | undefined;
            const toolCallMap = new Map<number, string>(); // index -> id
            
            // State for handling reasoning collapsible
            let hasStartedReasoning = false;
            let hasFinishedReasoning = false;

            try {
                console.log("[SiliconFlowAdapter] Requesting streaming completion from SiliconFlow (Kimi-K2-Thinking)...");

                const payload = {
                    model: "moonshotai/Kimi-K2-Thinking",
                    messages: openAIMessages,
                    tools: tools, 
                    stream: true,
                    stream_options: { include_usage: true }
                };
                
                // Log payload summary
                console.log("[SiliconFlowAdapter] Request summary:");
                console.log("  - Messages count:", openAIMessages.length);
                console.log("  - Tools count:", tools?.length || 0);
                if (tools && tools.length > 0) {
                    console.log("  - Tool names:", tools.map((t: any) => t.function.name).join(", "));
                }

                const stream = await openai.chat.completions.create(payload as any);
                
                for await (const chunk of stream) {
                    if (!chunk.choices || chunk.choices.length === 0) {
                        continue;
                    }

                    const delta = chunk.choices[0].delta;
                    if (!delta) continue;

                    // Extract reasoning and content
                    const reasoning = (delta as any).reasoning_content || "";
                    const content = delta.content || "";
                    
                    // Track reasoning state but DON'T send it to the user
                    if (reasoning && !hasStartedReasoning) {
                        hasStartedReasoning = true;
                        console.log("[SiliconFlowAdapter] Model started reasoning (hidden from user)");
                    }

                    // Skip reasoning chunks but don't break the stream
                    if (reasoning && !content) {
                        // Just reasoning, no content - skip but continue processing stream
                        continue;
                    }

                    // If we were reasoning and now have content, mark reasoning as finished
                    if (content && hasStartedReasoning && !hasFinishedReasoning) {
                        hasFinishedReasoning = true;
                        console.log("[SiliconFlowAdapter] Model finished reasoning, starting to output");
                    }

                    // Only send actual content (not reasoning)
                    if (content) {
                        if (!startedTextMessage) {
                            messageId = chunk.id || `msg_${Date.now()}`; 
                            eventStream$.sendTextMessageStart({ messageId });
                            startedTextMessage = true;
                        }
                        
                        eventStream$.sendTextMessageContent({
                            messageId: messageId!,
                            content: content
                        });
                    }

                    // Handle tool calls
                    if (delta.tool_calls) {
                        // If tool calls trigger and we were thinking, ensure thinking is closed
                         if (hasStartedReasoning && !hasFinishedReasoning) {
                            // Send the closing tag if not sent yet
                            const closingTag = "\n\n</details>\n\n";
                            if (startedTextMessage && messageId) {
                                eventStream$.sendTextMessageContent({
                                    messageId: messageId,
                                    content: closingTag
                                });
                            }
                            hasFinishedReasoning = true;
                        }

                        for (const toolCall of delta.tool_calls) {
                            const index = toolCall.index;
                            
                            if (toolCall.id) {
                                // New tool call start
                                const id = toolCall.id;
                                toolCallMap.set(index, id);
                                
                                eventStream$.sendActionExecutionStart({
                                    actionExecutionId: id,
                                    actionName: toolCall.function?.name || "",
                                    parentMessageId: chunk.id || messageId || `msg_${Date.now()}`
                                });
                            }

                            const args = toolCall.function?.arguments;
                            if (args && toolCallMap.has(index)) {
                                eventStream$.sendActionExecutionArgs({
                                    actionExecutionId: toolCallMap.get(index)!,
                                    args: args
                                });
                            }
                        }
                    }
                }
                
                // Check if we need to close the details tag at the end of stream
                // (e.g. if the model only returned reasoning and then stopped, or errored)
                if (hasStartedReasoning && !hasFinishedReasoning) {
                     const closingTag = "\n\n</details>\n\n";
                     if (startedTextMessage && messageId) {
                        eventStream$.sendTextMessageContent({
                            messageId: messageId,
                            content: closingTag
                        });
                     }
                }

                // End text message if started
                if (startedTextMessage && messageId) {
                    eventStream$.sendTextMessageEnd({ messageId });
                }

                // End all tool calls
                for (const id of toolCallMap.values()) {
                    eventStream$.sendActionExecutionEnd({ actionExecutionId: id });
                }
                
                console.log("[SiliconFlowAdapter] Stream completed successfully.");
                eventStream$.complete();

            } catch (err: any) {
                console.error("[SiliconFlowAdapter] API Error:", err);
                
                // Handle common errors...
                if (err.status === 429) {
                     const msg = "SiliconFlow rate limit exceeded. Please try again later.";
                     if (!startedTextMessage) { 
                         eventStream$.sendTextMessageStart({ messageId: "error" });
                         eventStream$.sendTextMessageContent({ messageId: "error", content: msg });
                         eventStream$.sendTextMessageEnd({ messageId: "error" });
                     } else {
                         eventStream$.sendTextMessageContent({ messageId: messageId || "error", content: `\n\n[Error: ${msg}]` });
                         if (messageId) eventStream$.sendTextMessageEnd({ messageId });
                     }
                     eventStream$.complete();
                     return;
                }
                
                 if (err.status === 400) {
                     const msg = "Model API Error (400): Invalid request.";
                     if (!startedTextMessage) {
                         eventStream$.sendTextMessageStart({ messageId: "error" });
                         eventStream$.sendTextMessageContent({ messageId: "error", content: msg });
                         eventStream$.sendTextMessageEnd({ messageId: "error" });
                     }
                     eventStream$.complete();
                     return;
                }

                if (!startedTextMessage) {
                     try {
                        eventStream$.sendTextMessageStart({ messageId: "error" });
                        eventStream$.sendTextMessageContent({ messageId: "error", content: `Error: ${err.message || "Unknown error"}` });
                        eventStream$.sendTextMessageEnd({ messageId: "error" });
                     } catch (e) {
                        console.error("Failed to send error to stream", e);
                     }
                }

                eventStream$.error(err);
            }
        });

        return {
            threadId: request.threadId || "default_thread"
        };
    }
}

const serviceAdapter = new SiliconFlowAdapter();

// Use the Express adapter provided by the library
app.use('/copilotkit', (req, res, next) => {
  const handler = copilotRuntimeNodeExpressEndpoint({
    endpoint: '/copilotkit',
    runtime: copilotRuntime,
    serviceAdapter,
  });
  
  return handler(req, res, next);
});

app.get('/', (req, res) => {
  res.send('BI Agent Copilot Runtime is running!');
});

app.listen(port, () => {
  console.log(`Copilot Runtime running at http://localhost:${port}`);
});
