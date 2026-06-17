import client from './client'

export const resumeApi = {
  upload: (file) => {
    const form = new FormData()
    form.append('file', file)
    return client.post('/resume/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data)
  },
  list:     ()                          => client.get('/resume/').then(r => r.data),
  get:      (id)                        => client.get(`/resume/${id}`).then(r => r.data),
  atsScore: (id, role, jobDescription)  => client.post(`/resume/${id}/ats-score`, {
    role,
    job_description: jobDescription,
  }).then(r => r.data),
}
