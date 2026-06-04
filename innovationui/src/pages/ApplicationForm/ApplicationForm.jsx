import React, { useMemo, useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { api, getApplicationStorageKey, getSession, clearSession } from '../../services/api';
import oppiLogo from '../../assets/OPPI-logo-black.png';
import '../Dashboards/Dashboards.css'; // Use dashboard styling for header
import './ApplicationForm.css';

const steps = [
  'Personal Information',
  'About the Company',
  'About the Company (contd.)',
  'Preview & Submit',
];

const section1Fields = [
  { name: 'firstName', label: 'First Name', required: true},
  { name: 'lastName', label: 'Last Name', required: true },
  { name: 'email', label: 'Email Id (Login)', required: true, autoFilled: true, type: 'email' },
  { name: 'mobile', label: 'Mobile Number', required: true, autoFilled: true, type: 'tel' },
  { name: 'companyName', label: 'Company Name', required: true },
  { name: 'designation', label: 'Designation', required: true },
  { name: 'category', label: 'Category of work', required: true, type: 'select', options: ['IT', 'Manufacturing', 'Healthcare', 'Education', 'Others'] },
  { name: 'categoryOther', label: 'Others (specify)', required: false, showIf: (data) => data.category === 'Others' },
  { name: 'companyWebsite', label: 'Company Website', required: true },
  { name: 'companyBrief', label: 'Company Brief', required: true },
  { name: 'innovation', label: 'Innovation in product or service?', required: true },
  { name: 'differentiation', label: 'How does it differ from existing solutions in the market: competitive analysis', required: true },
  { name: 'needAnalysis', label: 'Describe the need analysis for coming up with this solution/product', required: true },
  { name: 'commercialization', label: 'Transnational ability of the product to make it marketable/sale-able commercialization of the product/idea: easy to implement (Please mention NA if not applicable)', required: true },
];

const section2Fields = [
  { name: 'businessPresence', label: 'Business presence and reach (followers, downloads, active users, registered users, website traffic, etc.)', required: true },
  { name: 'marketing', label: 'How have you marketed your product or service?', required: true },
  { name: 'app', label: 'App', required: true },
  { name: 'websitePresence', label: 'Website', required: true },
  { name: 'socialMedia', label: 'Social media', required: true },
  { name: 'physicalOutlets', label: 'Physical outlets', required: true },
  { name: 'uploads', label: 'Upload PDF, Photo or Video (up to 5 attachments, max 8MB each)', required: true, type: 'file', multiple: true },
  { name: 'futurePlans', label: 'Future expansion plans over the next 3 years', required: true },
];

const section3Fields = [
  { name: 'customerHelp', label: 'How does your start-up help your customer and end-user', required: true },
  { name: 'customerTestimonial', label: 'Customer Testimonial (If not applicable, please mention "NA" in the text space)', required: true },
  { name: 'customerTestimonialUpload', label: 'Upload Customer Testimonial (PDF, Photo or Video, up to 5, 8MB each)', required: false, type: 'file', multiple: true, fileType: 'Testimonial' },
  { name: 'numEmployees', label: 'Number of employees', required: true },
  { name: 'boardDirectors', label: 'Details of board of directors', required: true },
  { name: 'boardDirectorsUpload', label: 'Upload details of board of directors (PDF, Photo or Video, up to 5, 8MB each)', required: true, type: 'file', multiple: true, fileType: 'Board' },
  { name: 'investors', label: 'Details of the investors', required: true },
  { name: 'investorsUpload', label: 'Upload Details of the investors (PDF, Photo or Video, up to 5, 8MB each)', required: false, type: 'file', multiple: true, fileType: 'Investors' },
  { name: 'mediaMentions', label: 'Media mentions / Accolades (academic publications, campus magazines, research publications, etc.)', required: false },
  { name: 'mediaMentionsUpload', label: 'Upload Media mentions / Accolades (PDF, Photo or Video, up to 5, 8MB each)', required: false, type: 'file', multiple: true, fileType: 'Media' },
  { name: 'patents', label: 'Patents (Include approved and/or applied)', required: false },
  { name: 'benefits', label: 'What are the benefits of your product/service: competitive analysis', required: true },
];

function ApplicationForm() {
  const session = getSession();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [files, setFiles] = useState({});
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [applicationId, setApplicationId] = useState(() => {
    if (!session?.userId) return null;
    return localStorage.getItem(getApplicationStorageKey(session.userId));
  });
  const [formData, setFormData] = useState(() => ({
    firstName: session?.first_name || '',
    lastName: session?.last_name || '',
    email: session?.email || '',
    mobile: session?.mobile || '',
  }));

  const visibleSection1Fields = useMemo(
    () => section1Fields.filter((field) => !field.showIf || field.showIf(formData)),
    [formData]
  );

  const [existingFiles, setExistingFiles] = useState([]);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const checkExisting = async () => {
      try {
        const data = await api.getPreview();
        if (data && data.status && data.status !== 'DRAFT') {
           navigate('/my-application', { replace: true });
           return; // Do not clear initializing state, let it redirect
        } else if (data && data.status === 'DRAFT') {
           setApplicationId(String(data.id));
           
           // Populate existing text data
           setFormData(prev => {
             const newData = { ...prev };
             
             if (data.personal_info) {
              debugger
               newData.companyName = data.personal_info.companyName || data.personal_info.CompanyName || '';
               newData.designation = data.personal_info.designation || data.personal_info.Designation || '';
               newData.category = data.personal_info.categoryOfWork || data.personal_info.CategoryOfWork || '';
               newData.categoryOther = data.personal_info.otherCategory || data.personal_info.OtherCategory || '';
               newData.companyWebsite = data.personal_info.companyWebsite || data.personal_info.CompanyWebsite || '';
               newData.companyBrief = data.personal_info.companyBrief || data.personal_info.CompanyBrief || '';
               newData.innovation = data.personal_info.innovation || data.personal_info.Innovation || '';
               newData.differentiation = data.personal_info.competitiveAnalysis || data.personal_info.CompetitiveAnalysis || '';
               newData.needAnalysis = data.personal_info.needAnalysis || data.personal_info.NeedAnalysis || '';
               newData.commercialization = data.personal_info.marketability || data.personal_info.Marketability || '';
             }
             
             if (data.company_reach) {
               newData.businessPresence = data.company_reach.marketingStrategy || data.company_reach.MarketingStrategy || '';
               newData.app = data.company_reach.appDetails || data.company_reach.AppDetails || '';
               newData.websitePresence = data.company_reach.websiteDetails || data.company_reach.WebsiteDetails || '';
               newData.socialMedia = data.company_reach.socialMedia || data.company_reach.SocialMedia || '';
               newData.physicalOutlets = data.company_reach.physicalOutlets || data.company_reach.PhysicalOutlets || '';
               newData.futurePlans = data.company_reach.futureExpansion || data.company_reach.FutureExpansion || '';
             }
             
             if (data.company_detail) {
               newData.customerHelp = data.company_detail.customerBenefit || data.company_detail.CustomerBenefit || '';
               newData.customerTestimonial = data.company_detail.testimonial || data.company_detail.Testimonial || '';
               newData.numEmployees = data.company_detail.employeeCount || data.company_detail.EmployeeCount || '';
               newData.boardDirectors = data.company_detail.boardOfDirectors || data.company_detail.BoardOfDirectors || '';
               newData.investors = data.company_detail.investorsDetails || data.company_detail.InvestorsDetails || '';
               newData.mediaMentions = data.company_detail.mediaMentions || data.company_detail.MediaMentions || '';
               newData.patents = data.company_detail.patents || data.company_detail.Patents || '';
               newData.benefits = data.company_detail.productBenefits || data.company_detail.ProductBenefits || '';
             }
             
             return newData;
           });

           // Store existing files so we can bypass file validation
           if (data.file_uploads) {
               setExistingFiles(data.file_uploads);
           }
           setIsInitializing(false);
        }
      } catch (err) {
        // If no application exists, ignore.
        setIsInitializing(false);
      }
    };
    checkExisting();
  }, [navigate]);

  if (!session?.token) {
    return <Navigate to="/login" replace />;
  }

  if (isInitializing) {
    return <div className="dashboard-loading">Loading application...</div>;
  }

  const handleLogout = () => {
    clearSession();
    navigate('/auth');
  };

  const handleNext = () => setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
  const handleBack = () => setActiveStep((prev) => Math.max(prev - 1, 0));

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    const fileList = Array.from(selectedFiles);

    if (fileList.length > 5) {
      setErrors((prev) => ({ ...prev, [name]: 'Maximum 5 files allowed' }));
      return;
    }

    if (fileList.some((file) => file.size > 8 * 1024 * 1024)) {
      setErrors((prev) => ({ ...prev, [name]: 'Each file must be less than 8MB' }));
      return;
    }

    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setFiles((prev) => ({ ...prev, [name]: fileList }));
  };

  const validateFields = (fields) => {
    const newErrors = {};

    fields.forEach((field) => {
      if (field.showIf && !field.showIf(formData)) return;

      if (field.required && field.type === 'file') {
        const hasNewFiles = files[field.name] && files[field.name].length > 0;
        const targetSection = field.fileType || 'ReachDocs';
        const hasExistingFiles = existingFiles.some(f => (f.section || f.Section) === targetSection);
        
        if (!hasNewFiles && !hasExistingFiles) {
          newErrors[field.name] = 'Required';
        }
      }

      if (field.required && field.type !== 'file' && (!formData[field.name] || String(formData[field.name]).trim() === '')) {
        newErrors[field.name] = 'Required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const ensureApplication = async () => {
    if (applicationId) return applicationId;

    const created = await api.createApplication({ userId: session.userId });
    const nextApplicationId = created.applicationId;
    localStorage.setItem(getApplicationStorageKey(session.userId), String(nextApplicationId));
    setApplicationId(String(nextApplicationId));
    return nextApplicationId;
  };

  const runSave = async (saveAction, successMessage) => {
    setServerError('');
    setStatusMessage('');
    setIsSaving(true);

    try {
      await saveAction();
      setStatusMessage(successMessage);
      handleNext();
    } catch (err) {
      setServerError(err.message || 'Unable to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleNextSection1 = (e) => {
    e.preventDefault();
    if (!validateFields(section1Fields)) return;

    runSave(async () => {
      const id = await ensureApplication();
      await api.savePersonalInfo(id, {
        companyName: formData.companyName,
        designation: formData.designation,
        category: formData.category,
        categoryOther: formData.categoryOther || null,
        companyWebsite: formData.companyWebsite,
        companyBrief: formData.companyBrief,
        innovation: formData.innovation,
        differentiation: formData.differentiation,
        needAnalysis: formData.needAnalysis,
        commercialization: formData.commercialization,
      });
    }, 'Personal information saved.');
  };

  const handleNextSection2 = (e) => {
    e.preventDefault();
    if (!validateFields(section2Fields)) return;

    runSave(async () => {
      const id = await ensureApplication();
      await api.saveCompanyReach(id, {
        businessPresence: formData.businessPresence,
        marketing: formData.marketing,
        app: formData.app,
        websitePresence: formData.websitePresence,
        socialMedia: formData.socialMedia,
        physicalOutlets: formData.physicalOutlets,
        futurePlans: formData.futurePlans,
      });
      await api.uploadFiles(id, 'ReachDocs', files.uploads || []);
    }, 'Company reach saved.');
  };

  const handleNextSection3 = (e) => {
    e.preventDefault();
    if (!validateFields(section3Fields)) return;

    runSave(async () => {
      const id = await ensureApplication();
      await api.saveCompanyDetails(id, {
        customerHelp: formData.customerHelp,
        customerTestimonial: formData.customerTestimonial,
        numEmployees: Number(formData.numEmployees),
        boardDirectors: formData.boardDirectors,
        investors: formData.investors,
        mediaMentions: formData.mediaMentions || null,
        patents: formData.patents || null,
        benefits: formData.benefits,
      });

      for (const field of section3Fields.filter((item) => item.type === 'file' && files[item.name]?.length)) {
        await api.uploadFiles(id, field.fileType, files[field.name]);
      }
    }, 'Company details saved.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setStatusMessage('');
    setIsSaving(true);

    try {
      const id = await ensureApplication();
      await api.submitApplication(id);
      setSubmitted(true);
      setTimeout(() => navigate('/my-application'), 2000);
    } catch (err) {
      setServerError(err.message || 'Unable to submit. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderTextField = (field) => (
    <div className="form-group" key={field.name}>
      <label>{field.label} {field.required && <span className="required">*</span>}</label>
      <input
        type={field.type || 'text'}
        name={field.name}
        value={formData[field.name] || ''}
        onChange={handleInputChange}
        required={field.required}
        disabled={field.autoFilled || isSaving}
        autoComplete="off"
      />
      {errors[field.name] && <span className="error">{errors[field.name]}</span>}
    </div>
  );

  const renderFileField = (field) => (
    <div className="form-group" key={field.name}>
      <label>{field.label} {field.required && <span className="required">*</span>}</label>
      <input
        type="file"
        name={field.name}
        multiple={field.multiple}
        accept=".pdf,image/*,video/*"
        onChange={handleFileChange}
        disabled={isSaving}
      />
      {files[field.name] && files[field.name].length > 0 && (
        <ul className="file-list">
          {files[field.name].map((file, idx) => (
            <li key={`${file.name}-${idx}`}>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</li>
          ))}
        </ul>
      )}
      {errors[field.name] && <span className="error">{errors[field.name]}</span>}
    </div>
  );

  const renderField = (field) => {
    if (field.showIf && !field.showIf(formData)) return null;
    if (field.type === 'file') return renderFileField(field);

    if (field.type === 'select') {
      return (
        <div className="form-group" key={field.name}>
          <label>{field.label} {field.required && <span className="required">*</span>}</label>
          <select
            name={field.name}
            value={formData[field.name] || ''}
            onChange={handleInputChange}
            required={field.required}
            disabled={isSaving}
          >
            <option value="">Select</option>
            {field.options.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          {errors[field.name] && <span className="error">{errors[field.name]}</span>}
        </div>
      );
    }

    return renderTextField(field);
  };

  const renderSection1 = () => <div className="section-fields">{section1Fields.map(renderField)}</div>;
  const renderSection2 = () => <div className="section-fields">{section2Fields.map(renderField)}</div>;
  const renderSection3 = () => <div className="section-fields">{section3Fields.map(renderField)}</div>;

  const renderPreview = () => (
    <div className="section-fields preview-section">
      <h3>Personal Information</h3>
      <ul>
        {visibleSection1Fields.filter((f) => !f.type || f.type === 'select').map((field) => (
          <li key={field.name}><strong>{field.label}:</strong> {formData[field.name] || '-'}</li>
        ))}
      </ul>
      <h3>About the Company</h3>
      <ul>
        {section2Fields.filter((f) => !f.type).map((field) => (
          <li key={field.name}><strong>{field.label}:</strong> {formData[field.name] || '-'}</li>
        ))}
        {section2Fields.filter((f) => f.type === 'file').map((field) => (
          <li key={field.name}><strong>{field.label}:</strong>
            <ul>
              {(files[field.name] || []).map((file, idx) => (
                <li key={`${file.name}-${idx}`}>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      <h3>About the Company (contd.)</h3>
      <ul>
        {section3Fields.filter((f) => !f.type).map((field) => (
          <li key={field.name}><strong>{field.label}:</strong> {formData[field.name] || '-'}</li>
        ))}
        {section3Fields.filter((f) => f.type === 'file').map((field) => (
          <li key={field.name}><strong>{field.label}:</strong>
            <ul>
              {(files[field.name] || []).map((file, idx) => (
                <li key={`${file.name}-${idx}`}>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );

  const renderThankYou = () => (
    <div className="thank-you">
      <h2>Thank you for your submission!</h2>
      <p>Your application has been submitted successfully. Redirecting to your dashboard...</p>
    </div>
  );

  const renderStep = () => {
    if (activeStep === 3) return submitted ? renderThankYou() : renderPreview();
    if (activeStep === 0) return renderSection1();
    if (activeStep === 1) return renderSection2();
    if (activeStep === 2) return renderSection3();
    return null;
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-header no-print">
        <div className="dashboard-logo">
          <img src={oppiLogo} alt="OPPI Logo" />
          <span>Application Form</span>
        </div>
        <div style={{display:'flex', gap:'10px'}}>
          <button className="btn-action" onClick={() => navigate('/change-password')}>Change Password</button>
          <button className="btn-logout" onClick={handleLogout}>Log Out</button>
        </div>
      </div>
      
      <div className="dashboard-content" style={{ maxWidth: '900px', margin: '40px auto' }}>
        <div className="application-card" style={{ padding: '30px', background: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <div className="application-header" style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '2rem', color: '#1a1a1a', marginBottom: '0.5rem', fontWeight: 700 }}>Innovation Application</h2>
            {applicationId && <p className="form-hint" style={{ color: '#666' }}>Application ID: {applicationId}</p>}
          </div>
          <div className="stepper" style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {steps.map((label, idx) => (
              <div key={label} className={`step ${activeStep === idx ? 'active' : ''}`} style={{ padding: '8px 16px', borderRadius: '20px', background: activeStep === idx ? '#4f46e5' : '#f3f4f6', color: activeStep === idx ? 'white' : '#666', fontSize: '0.9rem' }}>
                {label}
              </div>
            ))}
          </div>
          {statusMessage && <p className="form-success" style={{ color: 'green', marginBottom: '10px' }}>{statusMessage}</p>}
          {serverError && <p className="form-error" style={{ color: 'red', marginBottom: '10px' }}>{serverError}</p>}
          <form noValidate onSubmit={
            activeStep === 0 ? handleNextSection1 :
            activeStep === 1 ? handleNextSection2 :
            activeStep === 2 ? handleNextSection3 :
            activeStep === 3 && !submitted ? handleSubmit :
            undefined
          }>
            {renderStep()}
            {!submitted && (
              <div className="form-navigation" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
                {activeStep > 0 && activeStep < steps.length && (
                  <button type="button" onClick={handleBack} disabled={isSaving} className="btn-action">Previous</button>
                )}
                {activeStep < 3 && <button type="submit" disabled={isSaving} className="btn-action approve">{isSaving ? 'Saving...' : 'Next'}</button>}
                {activeStep === 3 && <button type="submit" disabled={isSaving} className="btn-action approve">{isSaving ? 'Submitting...' : 'Submit'}</button>}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

export default ApplicationForm;
