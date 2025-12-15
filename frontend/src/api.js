import axios from 'axios';

const API_Base = 'http://localhost:3000/api';

export const api = axios.create({
    baseURL: API_Base,
});

export const sendMessage = async (message, history) => {
    return api.post('/chat', { message, previousHistory: history });
};

export const uploadFile = async (formData) => {
    return api.post('/ingest/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};

export const ingestUrl = async (url) => {
    return api.post('/ingest/url', { url });
};
