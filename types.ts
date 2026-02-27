
export enum AppStep {
  UPLOAD = 'UPLOAD',
  ANALYZING = 'ANALYZING',
  SELECTION = 'SELECTION',
  GENERATING = 'GENERATING',
  RESULT = 'RESULT',
  HISTORY = 'HISTORY'
}

export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO'
}

export enum AppTab {
  PROFILE = 'PROFILE',
  CREATE = 'CREATE',
  POSTS = 'POSTS'
}

export interface UploadedContent {
  file: File;
  previewUrl: string;
  type: MediaType;
  base64: string;
  mimeType: string;
  width: number;
  height: number;
}

export interface WebSource {
  title: string;
  uri: string;
}

export interface CatProfile {
  id: string;
  name: string;
  breed: string;
  age: string;
  gender: 'boy' | 'girl';
  isNeutered: boolean;
  personality: string;
  hobbies: string;
  relationship?: string; // Optional relationship description
  avatar?: string; // Base64 string of the pet's avatar
}

export interface TrendStyle {
  id: string;
  title: string;
  description: string;
  visualStyle: string; // e.g., "Cyberpunk", "Soft Aesthetic", "High Energy"
  suggestedOverlayText: string;
  emoji: string;
  colorHex: string;
}

export interface GeneratedResult {
  title?: string;
  caption: string;
  hashtags: string[];
  overlayText: string;
  visualStyle: string;
  timestamp: number;
  previewUrl: string; // Stored for history
  // Editing properties
  brightness?: number; // 0-200, default 100
  contrast?: number;   // 0-200, default 100
  overlayColor?: string;
  // Crop/Pan properties
  zoom?: number; // 1.0 - 3.0
  panX?: number;
  panY?: number;
  // Overlay Position
  overlayX?: number;
  overlayY?: number;
  
  // Context for History Reconstruction
  base64?: string;
  originalWidth?: number;
  originalHeight?: number;
  containerWidth?: number;
  containerHeight?: number;
}

export interface HistoryItem extends GeneratedResult {
  id: string;
}
