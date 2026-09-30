import axios from 'axios';
import {
  DashboardSummary,
  AttentionMatrixItem,
  FindingDistributionItem,
  Entity,
  EntityDetail,
  Finding,
  IngestionJob,
  PeerBenchmarkingData,
  User
} from '../types';

export const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('satsa_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const SATSAApi = {
  // Authentication (Section 16: Login Page)
  login: async (username: string, password: string): Promise<User> => {
    const res = await api.post('/auth/login', { username, password });
    if (res.data.access_token) {
      localStorage.setItem('satsa_token', res.data.access_token);
      localStorage.setItem('satsa_user', JSON.stringify(res.data));
    }
    return res.data;
  },

  getCurrentUser: (): User | null => {
    const data = localStorage.getItem('satsa_user');
    return data ? JSON.parse(data) : null;
  },

  logout: () => {
    localStorage.removeItem('satsa_token');
    localStorage.removeItem('satsa_user');
  },

  // Dashboard (Section 12)
  getDashboardSummary: async (): Promise<DashboardSummary> => {
    const res = await api.get<DashboardSummary>('/dashboard/summary');
    return res.data;
  },

  getAttentionMatrix: async (): Promise<AttentionMatrixItem[]> => {
    const res = await api.get<AttentionMatrixItem[]>('/dashboard/attention-matrix');
    return res.data;
  },

  getFindingDistribution: async (): Promise<FindingDistributionItem[]> => {
    const res = await api.get<FindingDistributionItem[]>('/dashboard/finding-distribution');
    return res.data;
  },

  getPriorityReviewQueue: async (limit = 20): Promise<Finding[]> => {
    const res = await api.get<Finding[]>('/dashboard/review-queue', { params: { limit } });
    return res.data;
  },

  // Data Ingestion & Schema Validation (Section 4 & 5)
  getIngestionJobs: async (): Promise<IngestionJob[]> => {
    const res = await api.get<IngestionJob[]>('/ingestion/jobs');
    return res.data;
  },

  uploadDataset: async (file: File, entityId = 'CSE-01'): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entity_id', entityId);
    const res = await api.post('/ingestion/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  runAnalysis: async (): Promise<any> => {
    const res = await api.post('/ingestion/run-analysis');
    return res.data;
  },

  loadDemoDataset: async (): Promise<any> => {
    const res = await api.post('/ingestion/load-demo');
    return res.data;
  },

  // Findings & Review Queue (Section 7, 8, 10, 11, 14)
  getFindings: async (params?: {
    entity_id?: string;
    finding_type?: string;
    priority?: string;
    severity?: string;
    reviewed?: boolean;
  }): Promise<Finding[]> => {
    const res = await api.get<Finding[]>('/findings', { params });
    return res.data;
  },

  getFindingDetail: async (findingId: string): Promise<Finding> => {
    const res = await api.get<Finding>(`/findings/${findingId}`);
    return res.data;
  },

  reviewFinding: async (findingId: string, decision: string, notes: string): Promise<any> => {
    const res = await api.post(`/findings/${findingId}/review`, { decision, notes });
    return res.data;
  },

  // Entities & Assessment (Section 13)
  getEntities: async (): Promise<Entity[]> => {
    const res = await api.get<Entity[]>('/entities');
    return res.data;
  },

  getEntityDetail: async (entityId: string): Promise<EntityDetail> => {
    const res = await api.get<EntityDetail>(`/entities/${entityId}`);
    return res.data;
  },

  // Peer Benchmarking (Section 10)
  getPeerMetrics: async (): Promise<PeerBenchmarkingData> => {
    const res = await api.get<PeerBenchmarkingData>('/benchmarking/metrics');
    return res.data;
  }
};

export default api;
