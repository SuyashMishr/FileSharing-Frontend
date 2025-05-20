
import axios from 'axios';

// For development vs production environments
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://filesharing-backend-t3ym.onrender.com'
  : 'http://localhost:8000';

export const uploadFile = async (data) => {
  try {
    const response = await axios.post("http://localhost:8000/upload", data, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    });
    console.log("✅ Server response:", response.data);
    return response.data;
  } catch (error) {
    console.error('Error uploading file:', error);
    return null;
  }
};
