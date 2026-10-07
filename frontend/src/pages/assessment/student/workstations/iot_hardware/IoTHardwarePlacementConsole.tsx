import React, { useState, useEffect, useRef } from 'react';
import { StartAttemptResponse, CandidateResult, HardwareComponentItem, MotherboardConfig } from '../../../../../types/assessment';
import { TimerHeader } from '../../../../../components/assessment/TimerHeader';
import { TaskSpecDrawer } from './TaskSpecDrawer';
import { MotherboardCanvas } from './MotherboardCanvas';
import { ComponentPalette } from './ComponentPalette';
import apiClient from '../../../../../api/client';
import { Cpu, AlertCircle, CheckCircle2, Shield } from 'lucide-react';

interface IoTHardwarePlacementConsoleProps {
  attemptData: StartAttemptResponse;
  onSubmitComplete: (res: CandidateResult) => void;
}

export const IoTHardwarePlacementConsole: React.FC<IoTHardwarePlacementConsoleProps> = ({
  attemptData,
  onSubmitComplete
}) => {
  const questions = attemptData.questions || [];
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const currentQ = questions[currentQIndex];

  // Placements state per question: { [questionId]: { [slot_id]: component_id } }
  const [allQuestionPlacements, setAllQuestionPlacements] = useState<Record<number, Record<string, string>>>({});
  const [selectedComponent, setSelectedComponent] = useState<HardwareComponentItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<string>('All changes saved');
  const [activeDraggedComponentId, setActiveDraggedComponentId] = useState<string | null>(null);

  const debounceTimerRef = useRef<any>(null);

  // Initialize placements from saved_answers
  useEffect(() => {
    const initialPlacements: Record<number, Record<string, string>> = {};

    questions.forEach((q) => {
      const rawSaved = attemptData.saved_answers?.[q.id] || attemptData.saved_answers?.[String(q.id)];
      if (rawSaved) {
        try {
          const parsed = typeof rawSaved === 'string' ? JSON.parse(rawSaved) : rawSaved;
          const placementList = Array.isArray(parsed) ? parsed : parsed.placements || [];
          const slotMap: Record<string, string> = {};
          placementList.forEach((item: any) => {
            if (item.slot_id && item.component_id) {
              slotMap[item.slot_id] = item.component_id;
            }
          });
          initialPlacements[q.id] = slotMap;
        } catch (e) {
          console.error('Error parsing saved IoT placement payload:', e);
          initialPlacements[q.id] = {};
        }
      } else {
        initialPlacements[q.id] = {};
      }
    });

    setAllQuestionPlacements(initialPlacements);
  }, [attemptData]);

  // Extract motherboard config and component palette from options_json
  const optionsPayload = React.useMemo(() => {
    if (!currentQ) return null;
    const rawOptions = (currentQ as any).options_json || (currentQ as any).options;
    if (typeof rawOptions === 'string') {
      try {
        return JSON.parse(rawOptions);
      } catch (e) {
        return null;
      }
    }
    return rawOptions || null;
  }, [currentQ]);

  const motherboardConfig: MotherboardConfig = optionsPayload?.motherboard_config || {
    board_id: 'DEFAULT-IOT-BOARD',
    board_name: 'Universal IoT Carrier Board',
    slots: [
      { slot_id: 'SLOT_MCU', label: 'MCU Socket', supported_types: ['MICROCONTROLLER'], pin_bus: '3.3V, GPIO, SPI, I2C' },
      { slot_id: 'SLOT_SENSOR_1', label: 'Primary Sensor Header', supported_types: ['SENSOR'], pin_bus: '3.3V, ADC0' },
      { slot_id: 'SLOT_ACTUATOR_1', label: 'Actuator Header', supported_types: ['ACTUATOR'], pin_bus: '5V, GPIO' }
    ]
  };

  const componentPalette: HardwareComponentItem[] = optionsPayload?.component_palette || [];

  const currentPlacements = (currentQ && allQuestionPlacements[currentQ.id]) || {};

  // Autosave handler to backend
  const triggerAutosave = (qId: number, updatedSlotMap: Record<string, string>) => {
    setSaveStatus('Saving changes...');
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const payloadList = Object.entries(updatedSlotMap).map(([slot_id, component_id]) => ({
      slot_id,
      component_id
    }));

    debounceTimerRef.current = setTimeout(async () => {
      try {
        await apiClient.post('/assessment/attempts/save-response', {
          attempt_id: attemptData.attempt_id,
          question_id: qId,
          response_payload: JSON.stringify(payloadList)
        });
        setSaveStatus('All changes saved');
      } catch (err: any) {
        console.error('Failed to autosave hardware placement:', err);
        if (err?.response?.status === 410) {
          setSaveStatus('Round time ended');
        } else {
          setSaveStatus('Error saving');
        }
      }
    }, 600);
  };

  // Mount/Drop component into slot
  const handleDropComponent = (slotId: string, componentId: string) => {
    if (!currentQ) return;

    setAllQuestionPlacements((prev) => {
      const qMap = { ...(prev[currentQ.id] || {}) };

      // If this component was already mounted in another slot, move it (remove from previous slot)
      Object.keys(qMap).forEach((existingSlot) => {
        if (qMap[existingSlot] === componentId) {
          delete qMap[existingSlot];
        }
      });

      // Assign to target slot
      qMap[slotId] = componentId;

      triggerAutosave(currentQ.id, qMap);
      return { ...prev, [currentQ.id]: qMap };
    });

    setSelectedComponent(null);
  };

  // Remove component from slot
  const handleRemoveComponent = (slotId: string) => {
    if (!currentQ) return;

    setAllQuestionPlacements((prev) => {
      const qMap = { ...(prev[currentQ.id] || {}) };
      delete qMap[slotId];

      triggerAutosave(currentQ.id, qMap);
      return { ...prev, [currentQ.id]: qMap };
    });
  };

  // Reset all slots on board for current question
  const handleResetBoard = () => {
    if (!currentQ) return;

    setAllQuestionPlacements((prev) => {
      const updated = { ...prev, [currentQ.id]: {} };
      triggerAutosave(currentQ.id, {});
      return updated;
    });
    setSelectedComponent(null);
  };

  // Final Assessment Submission
  const handleSubmitAssessment = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Flush current question answer
      if (currentQ) {
        const payloadList = Object.entries(currentPlacements).map(([slot_id, component_id]) => ({
          slot_id,
          component_id
        }));

        await apiClient.post('/assessment/attempts/save-response', {
          attempt_id: attemptData.attempt_id,
          question_id: currentQ.id,
          response_payload: JSON.stringify(payloadList)
        });
      }

      // Submit complete attempt for server evaluation
      const res = await apiClient.post('/assessment/attempts/submit', {
        attempt_id: attemptData.attempt_id
      });
      onSubmitComplete(res.data);
    } catch (err: any) {
      console.error('Failed to submit IoT hardware assessment:', err);
      alert(err?.response?.data?.detail || 'Failed to submit assessment. Please check your network connection.');
      setIsSubmitting(false);
    }
  };

  if (!currentQ) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#11110F] text-[#F8F5ED]">
        <p className="text-xs font-mono text-[#9E988A]">No hardware assessment tasks found for this round.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#11110F] text-[#F8F5ED] overflow-hidden select-none font-sans">
      {/* Top Standard Assessment Timer Header */}
      <TimerHeader
        attemptData={attemptData}
        onSubmit={handleSubmitAssessment}
        isSubmitting={isSubmitting}
        saveStatus={saveStatus}
      />

      {/* Main 3-Zone Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Problem Specs & Real-Time Slot Verification */}
        <TaskSpecDrawer
          question={currentQ}
          motherboardConfig={motherboardConfig}
          placements={currentPlacements}
          totalQuestions={questions.length}
          currentQIndex={currentQIndex}
          onSelectQuestion={(idx) => {
            setCurrentQIndex(idx);
            setSelectedComponent(null);
            setActiveDraggedComponentId(null);
          }}
        />

        {/* Center Panel: Realistic Industrial PCB Motherboard */}
        <MotherboardCanvas
          boardConfig={motherboardConfig}
          placements={currentPlacements}
          palette={componentPalette}
          onDropComponent={handleDropComponent}
          onRemoveComponent={handleRemoveComponent}
          onResetBoard={handleResetBoard}
          selectedComponentToPlace={selectedComponent}
          onStartDragPlaced={(cId) => setActiveDraggedComponentId(cId)}
        />

        {/* Right Panel: Hardware Component Bin / Palette */}
        <ComponentPalette
          components={componentPalette}
          placements={currentPlacements}
          onSelectComponent={setSelectedComponent}
          selectedComponent={selectedComponent}
          onStartDragComponent={(cId) => setActiveDraggedComponentId(cId)}
          onEndDragComponent={() => setActiveDraggedComponentId(null)}
        />
      </div>
    </div>
  );
};
