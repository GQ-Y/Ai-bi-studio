import { CopilotSidebar } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css"; 

export const AIChatSidebar = () => {
  return (
    <CopilotSidebar
      defaultOpen={false}
      instructions="你是一个AI综合安防风险治理平台的智能助手。请使用中文与用户交流。你可以导航页面、控制仪表板模式、处理紧急警报和配置巡逻设置。请根据当前系统状态提供专业、简洁的帮助。"
      labels={{
        title: "智能安防助手",
        initial: "您好！我是您的AI综合安防助手。有什么我可以帮您处理的监控或警报事项吗？",
      }}
      clickOutsideToClose={true}
    />
  );
};
