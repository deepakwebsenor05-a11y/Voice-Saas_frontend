import axios from 'axios';

const api = axios.create({
    baseURL: 'https://voice-frontend.netlify.app/api',
    withCredentials: true,
});

export default api;