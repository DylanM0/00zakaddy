import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

export const compareOneToOne = async (sourceFile, targetFile, threshold = 90) => {
  const formData = new FormData();
  formData.append('source', sourceFile);
  formData.append('target', targetFile);
  formData.append('threshold', threshold);

  try {
    const response = await api.post('/compare/one-to-one', formData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to compare documents');
  }
};

export const compareOneToMany = async (sourceFile, targetFiles, threshold = 90) => {
  const formData = new FormData();
  formData.append('source', sourceFile);

  targetFiles.forEach((file) => {
    formData.append('targets', file);
  });

  formData.append('threshold', threshold);

  try {
    const response = await api.post('/compare/one-to-many', formData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to compare documents');
  }
};

export const compareManyToMany = async (sourceFiles, targetFiles, threshold = 90) => {
  const formData = new FormData();

  sourceFiles.forEach((file) => {
    formData.append('sources', file);
  });

  targetFiles.forEach((file) => {
    formData.append('targets', file);
  });

  formData.append('threshold', threshold);

  try {
    const response = await api.post('/compare/many-to-many', formData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to compare documents');
  }
};

export const parseFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await api.post('/compare/parse', formData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to parse file');
  }
};

export default api;
