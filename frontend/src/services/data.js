import axios from "axios";

const apiBase = import.meta.env.VITE_API_URL || "";
const serverUrl = apiBase
  ? `${apiBase.replace(/\/+$|\s+$/g, "")}/api/data`
  : "/api/data";

const getAll = () => {
  const request = axios.get(serverUrl);

  return request.then((response) => {
    console.log("data:", response.data);
    return response.data;
  });
};

const updateData = (newData) => {
  const request = axios.put(serverUrl, newData);
  return request.then((response) => response.data);
};

export default { getAll, updateData };
