const API_BASE_URL = "http://74.225.167.29/api";
// export const API_BASE_URL = "http://localhost:5233";
const SESSION_KEY = 'innovationAwardsSession';

export function getFileUrl(filePath) {
  if (!filePath) return null;
  if (filePath.startsWith('http')) return filePath;
  // Nginx proxies /api/* to the backend; static files are served at /uploads on Kestrel
  return `${API_BASE_URL}${filePath}`;
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const session = getSession();

  if (session?.token) {
    headers.set('Authorization', `Bearer ${session.token}`);
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body: options.body instanceof FormData ? options.body : options.body ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 204) {
    return null;
  }

  // Handle 413 Request Entity Too Large (nginx returns HTML, not JSON)
  if (response.status === 413) {
    throw new Error('The file(s) you are trying to upload are too large. Please reduce the file size (max 8MB per file) and try again.');
  }

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    let message = 'Request failed.';
    let errors = null;

    if (data?.errors) {
      if (Array.isArray(data.errors)) {
        errors = data.errors;
        message = data.errors.join(' ');
      } else if (typeof data.errors === 'object') {
        errors = [];
        for (const key in data.errors) {
          if (Array.isArray(data.errors[key])) {
            errors.push(...data.errors[key]);
          } else {
            errors.push(String(data.errors[key]));
          }
        }
        message = errors.join(' ');
      }
    } else if (typeof data === 'string' && data.trim().startsWith('<')) {
      // Response is HTML (e.g. from nginx error pages) — show a generic user-friendly message
      message = `Server error (${response.status}). Please try again or contact support.`;
    } else {
      message = data?.message || (typeof data === 'string' ? data : 'Request failed.');
    }

    const error = new Error(message);
    error.status = response.status;
    if (errors) {
      error.errors = errors;
    }
    throw error;
  }

  return data;
}

export function getSession() {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function saveSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function getApplicationStorageKey(userId) {
  return `innovationAwardsApplicationId:${userId}`;
}

export const api = {
  register: (payload) => request('/auth/register', {
    method: 'POST',
    body: {
      First_Name: payload.firstName,
      Last_Name: payload.lastName,
      Email: payload.emailId,
      Mobile: payload.mobileNumber,
      Password: payload.password || payload.createPassword
    }
  }),
  login: async (payload) => {
    const data = await request('/auth/login', {
      method: 'POST',
      body: { Email: payload.emailId, Password: payload.password }
    });
    return { token: data.access_token, ...data.user };
  },
  createApplication: async () => {
    const data = await request('/application/create', { method: 'POST' });
    return { applicationId: data.id, ...data };
  },
  savePersonalInfo: (applicationId, payload) =>
    request(`/application/page1/${applicationId}`, {
      method: 'POST',
      body: {
        Company_Name: payload.companyName,
        Designation: payload.designation,
        Category_Of_Work: payload.category,
        Other_Category: payload.categoryOther,
        Company_Website: payload.companyWebsite,
        Company_Brief: payload.companyBrief,
        Innovation: payload.innovation,
        Competitive_Analysis: payload.differentiation,
        Need_Analysis: payload.needAnalysis,
        Marketability: payload.commercialization
      }
    }),
  saveCompanyReach: (applicationId, payload) =>
    request(`/application/page2/${applicationId}`, {
      method: 'POST',
      body: {
        Marketing_Strategy: payload.marketing,
        App_Details: payload.app,
        Website_Details: payload.websitePresence,
        Social_Media: payload.socialMedia,
        Physical_Outlets: payload.physicalOutlets,
        Future_Expansion: payload.futurePlans
      }
    }),
  saveCompanyDetails: (applicationId, payload) =>
    request(`/application/page3/${applicationId}`, {
      method: 'POST',
      body: {
        Customer_Benefit: payload.customerHelp,
        Testimonial: payload.customerTestimonial,
        Employee_Count: String(payload.numEmployees),
        Board_Of_Directors: payload.boardDirectors,
        Investors_Details: payload.investors,
        Media_Mentions: payload.mediaMentions,
        Patents: payload.patents,
        Product_Benefits: payload.benefits
      }
    }),
  uploadFiles: (applicationId, fileType, selectedFiles) => {
    if (!selectedFiles?.length) return Promise.resolve(null);
    const formData = new FormData();
    selectedFiles.forEach((file) => formData.append('file', file));
    return request(`/application/upload/${applicationId}/${fileType}`, { method: 'POST', body: formData });
  },
  deleteFile: (fileId) => request(`/application/upload/${fileId}`, { method: 'DELETE' }),
  getPreview: () => request(`/application/mine`),
  submitApplication: (applicationId) => request(`/application/submit/${applicationId}`, { method: 'POST' }),
  getAdminUsers: () => request('/admin/users'),
  updateAdminUser: (id, payload) => request(`/admin/users/${id}`, { method: 'PUT', body: payload }),
  getAdminApps: () => request('/admin/applications'),
  getValidatorApps: () => request('/validator/applications'),
  validatorApprove: (id, payload) => request(`/validator/approve/${id}`, { method: 'POST', body: payload }),
  validatorReject: (id) => request(`/validator/reject/${id}`, { method: 'POST' }),
  getJuryApps: () => request('/jury/applications'),
  juryApprove: (id, payload) => request(`/jury/approve/${id}`, { method: 'POST', body: payload }),
  juryReject: (id) => request(`/jury/reject/${id}`, { method: 'POST' }),
  getAppReview: (id) => request(`/application/review/${id}`),
  forgotPassword: (email) => request('/auth/forgot-password', {
    method: 'POST',
    body: { Email: email }
  }),
  resetPassword: (token, password) => request('/auth/reset-password', {
    method: 'POST',
    body: { Token: token, Password: password }
  }),
  changePassword: (oldPassword, newPassword) => request('/auth/change-password', {
    method: 'POST',
    body: { Old_Password: oldPassword, New_Password: newPassword }
  }),
  getJuryMembers: () => request('/jury-members'),
  createJuryMember: (formData) => request('/admin/jury', { method: 'POST', body: formData }),
  updateJuryMember: (id, formData) => request(`/admin/jury/${id}`, { method: 'PUT', body: formData }),
  deleteJuryMember: (id) => request(`/admin/jury/${id}`, { method: 'DELETE' }),
};
