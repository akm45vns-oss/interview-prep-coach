import client from './client'

export const dashboardApi = {
  get:             ()     => client.get('/dashboard/').then(r => r.data),
  generateRoadmap: (data) => client.post('/dashboard/roadmap', data).then(r => r.data),
  getRoadmaps:     ()     => client.get('/dashboard/roadmaps').then(r => r.data),
}
