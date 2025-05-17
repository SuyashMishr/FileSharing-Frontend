
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

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
