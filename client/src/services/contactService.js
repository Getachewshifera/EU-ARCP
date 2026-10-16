import api from './api.js'

const contactService = {
  send: (data) => api.post('/contact', data),
}

export default contactService