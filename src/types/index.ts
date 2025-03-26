export type UserRole = 'user' | 'admin' | 'va';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  createdAt: Date;
}

export interface Card {
  id: string;
  name: string;
  year: number;
  manufacturer: string;
  cardNumber: string;
  player: string;
  purchasePrice: number;
  purchaseDate: Date;
  status: 'raw' | 'submitted' | 'graded' | 'listed' | 'sold';
  grade?: number;
  salePrice?: number;
  saleDate?: Date;
  userId: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  assignedTo: string;
  assignedBy: string;
  createdAt: Date;
  updatedAt: Date;
  cardId?: string;
}

export interface DealAnalysis {
  id: string;
  cardId: string;
  predictedGrade: number;
  confidenceScore: number;
  estimatedValue: number;
  potentialProfit: number;
  roi: number;
  createdAt: Date;
  userId: string;
} 