import React from 'react';

export interface FrameData {
  id: number;
  title: string;
  content: string;
  color: 'blue' | 'green' | 'orange' | 'purple' | 'yellow' | 'red' | 'gray';
  icon?: React.ReactNode;
}

export interface AnalysisResult {
  rawText: string;
  frames: FrameData[];
}

export enum AppState {
  IDLE,
  ANALYZING,
  SUCCESS,
  ERROR
}