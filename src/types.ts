export interface TranscriptSegment {
  speaker: string;
  timestamp: string;
  text: string;
  sentiment: number; // Range: -1.0 to +1.0
}

export interface SentimentTimelinePoint {
  timestamp: string;
  engagementSalesperson: number; // Range: 0 to 100
  engagementProspect: number;    // Range: 0 to 100
  topic: string;
}

export interface KeyMetrics {
  talkRatioSales: number;     // 0 to 100%
  objectionHandling: number;  // 0 to 100
  needsDiscovery: number;     // 0 to 100
  closingAttempt: number;     // 0 to 100
}

export interface CoachingCard {
  strengths: string[];        // Exactly 3 strengths
  missedOpportunities: string[]; // Exactly 3 missed opportunities
  overallScore: number;       // 0 to 100
  summary: string;
  keyMetrics: KeyMetrics;
}

export interface SalesCallAnalysis {
  transcript: TranscriptSegment[];
  sentimentTimeline: SentimentTimelinePoint[];
  coaching: CoachingCard;
}

export interface SampleCall {
  id: string;
  title: string;
  duration: string;
  filename: string;
}
