import client from './client'

export const interviewApi = {
  start:   (data)              => client.post('/interview/start', data).then(r => r.data),
  get:     (sessionId)         => client.get(`/interview/${sessionId}`).then(r => r.data),
  answer:  (sessionId, data)   => client.post(`/interview/${sessionId}/answer`, data).then(r => r.data),
  summary: (sessionId)         => client.get(`/interview/${sessionId}/summary`).then(r => r.data),
  exportPdf: (sessionId)       => client.get(`/export/${sessionId}/pdf`, { responseType: 'blob' }).then(r => r.data),
}
