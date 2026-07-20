export type UserRole = "user" | "security" | "admin";
export type ReportType = "lost" | "found";
export type ReportStatus =
  | "draft"
  | "active"
  | "possible_match_found"
  | "claim_submitted"
  | "under_review"
  | "awaiting_collection"
  | "returned"
  | "closed"
  | "rejected"
  | "archived";

export type ClaimStatus = "submitted" | "under_review" | "more_information" | "approved" | "rejected";
export type MatchStatus = "recommended" | "reviewed" | "confirmed" | "dismissed";

export interface ItemReport {
  id: string;
  reportType: ReportType;
  title: string;
  category: string;
  brand?: string;
  model?: string;
  primaryColour: string;
  description: string;
  incidentDate: string;
  location: string;
  specificArea?: string;
  status: ReportStatus;
  imageUrl?: string;
  createdAt: string;
}

export interface MatchCandidate {
  id: string;
  lostReportId: string;
  foundReportId: string;
  lostTitle: string;
  foundTitle: string;
  overallScore: number;
  imageScore: number;
  textScore: number;
  categoryScore: number;
  colourScore: number;
  brandScore: number;
  locationScore: number;
  dateScore: number;
  explanation: string;
  status: MatchStatus;
}

export interface MatchInput {
  imageSimilarity: number;
  textSimilarity: number;
  categoryMatch: number;
  colourSimilarity: number;
  brandSimilarity: number;
  locationSimilarity: number;
  dateSimilarity: number;
}

export interface MatchWeights {
  image: number;
  text: number;
  category: number;
  colour: number;
  brand: number;
  location: number;
  date: number;
}
