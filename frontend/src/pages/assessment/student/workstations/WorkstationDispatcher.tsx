import React from 'react';
import { StartAttemptResponse, CandidateResult } from '../../../../types/assessment';
import { Round1Cognitive } from './Round1Cognitive';
import { Round2Coding } from './Round2Coding';
import { Round3Technical } from './Round3Technical';
import { Round4Debugging } from './Round4Debugging';

import { ChatRound1Communication } from './chat/ChatRound1Communication';
import { ChatRound2CustomerJudgment } from './chat/ChatRound2CustomerJudgment';
import { ChatRound3KnowledgeBase } from './chat/ChatRound3KnowledgeBase';
import { ChatRound4SupportConsole } from './chat/ChatRound4SupportConsole';

import { SQLQueryConsole } from './data_analyst/SQLQueryConsole';
import { PythonSandboxConsole } from './data_analyst/PythonSandboxConsole';
import { TableauProceduralViewer } from './data_analyst/TableauProceduralViewer';
import { BusinessCaseConsole } from './data_analyst/BusinessCaseConsole';
import { IoTHardwarePlacementConsole } from './iot_hardware/IoTHardwarePlacementConsole';
import { UnsupportedRoundAlert } from './UnsupportedRoundAlert';

interface WorkstationDispatcherProps {
  attemptData: StartAttemptResponse;
  onSubmitComplete: (res: CandidateResult) => void;
}

export const WorkstationDispatcher: React.FC<WorkstationDispatcherProps> = ({
  attemptData,
  onSubmitComplete
}) => {
  const roundType = attemptData.round_type?.toUpperCase().trim();

  switch (roundType) {
    case 'COGNITIVE_MCQ':
      return <Round1Cognitive attemptData={attemptData} onSubmitComplete={onSubmitComplete} />;
    case 'CODING':
      return <Round2Coding attemptData={attemptData} onSubmitComplete={onSubmitComplete} />;
    case 'TECHNICAL_MCQ':
      return <Round3Technical attemptData={attemptData} onSubmitComplete={onSubmitComplete} />;
    case 'DEBUGGING':
      return <Round4Debugging attemptData={attemptData} onSubmitComplete={onSubmitComplete} />;

    case 'COMMUNICATION_BENCHMARK':
      return <ChatRound1Communication attemptData={attemptData} onSubmitComplete={onSubmitComplete} />;
    case 'CUSTOMER_JUDGMENT':
      return <ChatRound2CustomerJudgment attemptData={attemptData} onSubmitComplete={onSubmitComplete} />;
    case 'KNOWLEDGE_BASE_PRACTICAL':
      return <ChatRound3KnowledgeBase attemptData={attemptData} onSubmitComplete={onSubmitComplete} />;
    case 'SUPPORT_CONSOLE_SIMULATION':
      return <ChatRound4SupportConsole attemptData={attemptData} onSubmitComplete={onSubmitComplete} />;

    case 'DATA_APTITUDE_MCQ':
      return <Round1Cognitive attemptData={attemptData} onSubmitComplete={onSubmitComplete} />;
    case 'SQL_PRACTICAL':
      return <SQLQueryConsole attemptData={attemptData} onSubmitComplete={onSubmitComplete} />;
    case 'PYTHON_PRACTICAL':
      return <PythonSandboxConsole attemptData={attemptData} onSubmitComplete={onSubmitComplete} />;
    case 'TABLEAU_PRACTICAL':
      return <TableauProceduralViewer attemptData={attemptData} onSubmitComplete={onSubmitComplete} />;
    case 'BUSINESS_CASE_AND_INTERVIEW':
      return <BusinessCaseConsole attemptData={attemptData} onSubmitComplete={onSubmitComplete} />;

    case 'HARDWARE_SELECTION_PLACEMENT':
    case 'HARDWARE_PLACEMENT':
    case 'IOT_HARDWARE_PLACEMENT':
      return <IoTHardwarePlacementConsole attemptData={attemptData} onSubmitComplete={onSubmitComplete} />;

    default:
      return <UnsupportedRoundAlert roundType={roundType || 'UNKNOWN'} />;
  }
};
