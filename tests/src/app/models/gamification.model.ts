export interface UserPreferences {
    notifications: boolean;
    sound: boolean;
    theme: string;
  }
  
  export interface UserProfile {
    id: string;
    username: string;
    level: number;
    experience: number;
    coins: number;
    streak: number;
    rank: string;
    skills: UserSkill[];
    achievements: UserAchievement[];
    badges: Badge[];
    statistics: UserStatistics;
    preferences: UserPreferences;
  }
  
  export interface UserSkill {
    name: string;
    level: number;
    experience: number;
    progress: number;
    lastPracticed: Date;
  }
  
  export interface UserAchievement {
name: any;
description: any;
    achievementId: string;
    unlocked: boolean;
    unlockedAt?: Date;
    progress: number;
    currentValue: number;
    targetValue: number;
  }
  
  export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    unlocked: boolean;
    unlockedAt?: Date;
    category: string;
  }
  
  export interface UserStatistics {
    totalStudyTime: number;
    completedSubjects: number;
    completedTests: number;
    correctAnswers: number;
    totalAnswers: number;
    streakRecord: number;
    daysActive: number;
  }
  
  export interface LeaderboardEntry {
    userId: string;
    username: string;
    rank: number;
    score: number;
    level: number;
    progress: number;
    avatar?: string;
  }