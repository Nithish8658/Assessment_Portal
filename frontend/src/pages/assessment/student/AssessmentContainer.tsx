import React, { useState } from 'react';
import { DomainCatalogPage } from './DomainCatalogPage';
import { StudentDashboard } from './StudentDashboard';
import { AssessmentLobby } from './AssessmentLobby';
import { AssessmentRunner } from './AssessmentRunner';
import { CandidateResults } from './CandidateResults';
import { RoundSummary, CandidateResult } from '../../../types/assessment';
import apiClient from '../../../api/client';

export const AssessmentContainer: React.FC = () => {
  const [activeView, setActiveView] = useState<'CATALOG' | 'DASHBOARD' | 'LOBBY' | 'RUNNER' | 'RESULTS'>('CATALOG');
  const [selectedDomainSlug, setSelectedDomainSlug] = useState<string | null>(null);
  const [selectedAllocationId, setSelectedAllocationId] = useState<number | null>(null);
  const [selectedRound, setSelectedRound] = useState<RoundSummary | null>(null);
  const [latestResult, setLatestResult] = useState<CandidateResult | null>(null);

  const handleSelectDomain = (slug: string, allocationId?: number) => {
    setSelectedDomainSlug(slug);
    setSelectedAllocationId(allocationId || null);
    setActiveView('DASHBOARD');
  };

  const handleStartRoundFromDashboard = (round: RoundSummary) => {
    setSelectedRound(round);
    setActiveView('LOBBY');
  };

  const handleViewResultFromDashboard = async (roundId: number, attemptId?: number | null) => {
    try {
      let res;
      if (attemptId) {
        res = await apiClient.get(`/assessment/attempts/${attemptId}/result`);
      } else {
        const url = selectedAllocationId
          ? `/assessment/attempts/round/${roundId}/latest-result?allocation_id=${selectedAllocationId}`
          : `/assessment/attempts/round/${roundId}/latest-result`;
        res = await apiClient.get(url);
      }
      setLatestResult(res.data);
      setActiveView('RESULTS');
    } catch (e) {
      console.error('Failed to fetch result', e);
    }
  };

  const handleBeginAttempt = () => {
    setActiveView('RUNNER');
  };

  const handleFinishAttempt = (res: CandidateResult) => {
    setLatestResult(res);
    setActiveView('RESULTS');
  };

  return (
    <div>
      {activeView === 'CATALOG' && (
        <DomainCatalogPage onSelectDomain={handleSelectDomain} />
      )}

      {activeView === 'DASHBOARD' && selectedDomainSlug && (
        <StudentDashboard
          domainSlug={selectedDomainSlug}
          allocationId={selectedAllocationId}
          onBack={() => setActiveView('CATALOG')}
          onStartRound={handleStartRoundFromDashboard}
          onViewResult={handleViewResultFromDashboard}
        />
      )}

      {activeView === 'LOBBY' && selectedRound && (
        <AssessmentLobby
          round={selectedRound}
          onBack={() => setActiveView('DASHBOARD')}
          onBeginAttempt={handleBeginAttempt}
          isStarting={false}
        />
      )}

      {activeView === 'RUNNER' && selectedRound && (
        <AssessmentRunner
          round={selectedRound}
          allocationId={selectedAllocationId}
          onFinish={handleFinishAttempt}
          onCancel={() => setActiveView('DASHBOARD')}
        />
      )}

      {activeView === 'RESULTS' && latestResult && (
        <CandidateResults
          result={latestResult}
          onBackToDashboard={() => setActiveView('DASHBOARD')}
        />
      )}
    </div>
  );
};
