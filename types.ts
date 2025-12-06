export interface Activity {
  label: string;
  startDescription: string;
  endDescription: string;
}

export interface MemeElements {
  catTypes: string[];
  activities: Activity[];     // For Funny/Meme mode
  kidActivities: Activity[];  // For Cute/Kid mode
  costumes: string[];
  locations: string[];
  visualStyles: string[];
  overlayTexts: string[];     // For Funny/Meme mode
  kidOverlayTexts: string[];  // For Cute/Kid mode
}

export interface GeneratedResult {
  imagePrompt: string;
  motionPrompt: string; // Changed from videoPromptStart/End to a single motion prompt
  caption: string;
  youtubeTitle: string;
  youtubeDescription: string;
  youtubeTags: string;
}

export type ThemeType = 'funny' | 'cute';
export type SelectionCategory = keyof MemeElements;

export interface SelectionState {
  catTypes: string;
  activities: string; 
  costumes: string;
  locations: string;
  visualStyles: string;
  overlayTexts: string;
}