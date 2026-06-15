import React, { useMemo, useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { api, getApplicationStorageKey, getSession, clearSession, getFileUrl } from '../../services/api';
import oppiLogo from '../../assets/OPPI-logo-black.png';
import FileUploadField from '../../components/FileUploadField/FileUploadField';
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
  { name: 'companyBrief', label: 'Company Brief', required: true, type: 'textarea' },
  { name: 'innovation', label: 'Innovation in product or service?', required: true, type: 'textarea' },
  { name: 'differentiation', label: 'How does it differ from existing solutions in the market: competitive analysis', required: true, type: 'textarea' },
  { name: 'needAnalysis', label: 'Describe the need analysis for coming up with this solution/product', required: true, type: 'textarea' },
  { name: 'commercialization', label: 'Transnational ability of the product to make it marketable/sale-able commercialization of the product/idea: easy to implement (Please mention NA if not applicable)', required: true, type: 'textarea' },
];

const section2Fields = [
  { name: 'marketing', label: 'How have you marketed your product or service?', required: true, type: 'textarea' },
  { name: 'app', label: 'App', required: true },
  { name: 'websitePresence', label: 'Website', required: true },
  { name: 'socialMedia', label: 'Social media', required: true },
  { name: 'physicalOutlets', label: 'Physical outlets', required: true },
  { name: 'uploads', label: 'Upload PDF, Photo or Video (up to 5 attachments, max 8MB each)', required: true, type: 'file', multiple: true },
  { name: 'futurePlans', label: 'Future expansion plans over the next 3 years', required: true, type: 'textarea' },
];

const section3Fields = [
  { name: 'customerHelp', label: 'How does your start-up help your customer and end-user', required: true, type: 'textarea' },
  { name: 'customerTestimonial', label: 'Customer Testimonial (If not applicable, please mention "NA" in the text space)', required: true, type: 'textarea' },
  { name: 'customerTestimonialUpload', label: 'Upload Customer Testimonial (PDF, Photo or Video, up to 5, 8MB each)', required: false, type: 'file', multiple: true, fileType: 'Testimonial' },
  { name: 'numEmployees', label: 'Number of employees', required: true, type: 'number' },
  { name: 'boardDirectors', label: 'Details of board of directors', required: true, type: 'textarea' },
  { name: 'boardDirectorsUpload', label: 'Upload details of board of directors (PDF, Photo or Video, up to 5, 8MB each)', required: true, type: 'file', multiple: true, fileType: 'Board' },
  { name: 'investors', label: 'Details of the investors', required: true, type: 'textarea' },
  { name: 'investorsUpload', label: 'Upload Details of the investors (PDF, Photo or Video, up to 5, 8MB each)', required: false, type: 'file', multiple: true, fileType: 'Investors' },
  { name: 'mediaMentions', label: 'Media mentions / Accolades (academic publications, campus magazines, research publications, etc.)', required: false, type: 'textarea' },
  { name: 'mediaMentionsUpload', label: 'Upload Media mentions / Accolades (PDF, Photo or Video, up to 5, 8MB each)', required: false, type: 'file', multiple: true, fileType: 'Media' },
  { name: 'patents', label: 'Patents (Include approved and/or applied)', required: false, type: 'textarea' },
  { name: 'benefits', label: 'What are the benefits of your product/service: competitive analysis', required: true, type: 'textarea' },
];

function isImageFile(name, mimeType, fileType) {
  if (mimeType?.startsWith('image/')) return true;
  const ext = (fileType || name?.split('.').pop() || '').toLowerCase().replace(/^\./, '');
  return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
}

function isVideoFile(name, mimeType, fileType) {
  if (mimeType?.startsWith('video/')) return true;
  const ext = (fileType || name?.split('.').pop() || '').toLowerCase().replace(/^\./, '');
  return ['mp4', 'mov'].includes(ext);
}

function mapUploadedFiles(uploadResult, section, localFiles = []) {
  return (uploadResult?.files || []).map((file, index) => {
    const fileName = file.fileName || file.FileName || localFiles[index]?.name;
    const ext = fileName?.split('.').pop()?.toLowerCase();
    return {
      id: file.id ?? file.Id,
      section,
      Section: section,
      fileName,
      FileName: fileName,
      filePath: file.filePath || file.FilePath,
      FilePath: file.filePath || file.FilePath,
      fileSize: localFiles[index]?.size,
      FileSize: localFiles[index]?.size,
      fileType: ext ? `.${ext}` : undefined,
      FileType: ext ? `.${ext}` : undefined,
    };
  });
}

function PreviewNewFile({ file }) {
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  return (
    <div className="preview-file-card new">
      <div className="preview-file-media">
        {previewUrl && isImageFile(file.name, file.type) && (
          <img src={previewUrl} alt={file.name} className="preview-file-thumb" />
        )}
        {previewUrl && isVideoFile(file.name, file.type) && (
          <video src={previewUrl} className="preview-file-thumb" controls />
        )}
        {!previewUrl && <div className="preview-file-icon">PDF</div>}
      </div>
      <span className="preview-file-name">{file.name}</span>
    </div>
  );
}

function PreviewExistingFile({ file }) {
  const name = file.fileName || file.FileName;
  const url = getFileUrl(file.filePath || file.FilePath);
  const fileType = file.fileType || file.FileType;
  const showImage = url && isImageFile(name, null, fileType);
  const showVideo = url && isVideoFile(name, null, fileType);

  return (
    <div className="preview-file-card existing">
      <div className="preview-file-media">
        {showImage && <img src={url} alt={name} className="preview-file-thumb" />}
        {showVideo && <video src={url} className="preview-file-thumb" controls />}
        {!showImage && !showVideo && (
          <div className="preview-file-icon">{isVideoFile(name, null, fileType) ? 'Video' : 'PDF'}</div>
        )}
      </div>
      <span className="preview-file-name">{name}</span>
      {url && (
        <a href={url} target="_blank" rel="noreferrer" className="preview-file-link">
          View file
        </a>
      )}
    </div>
  );
}

function ApplicationForm() {
  const session = getSession();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [files, setFiles] = useState({});
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
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
               newData.marketing = data.company_reach.marketingStrategy || data.company_reach.MarketingStrategy || '';
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
        console.log(err);
        setIsInitializing(false);
      }
    };
    checkExisting();
  }, [navigate]);

  if (!session?.token) {
    return <Navigate to="/login" replace />;
  }

  if (isInitializing) {
    return (
      <div className="application-loading">
        <img src={oppiLogo} alt="OPPI Logo" className="application-loading-logo" />
        <div className="application-loading-spinner" />
        <span>Loading application...</span>
      </div>
    );
  }

  const getFileFieldSection = (field) => field.fileType || 'ReachDocs';

  const getExistingFilesForField = (field) =>
    existingFiles.filter((f) => (f.section || f.Section) === getFileFieldSection(field));

  const renderPreviewFiles = (field) => {
    const uploaded = getExistingFilesForField(field);
    const newlySelected = files[field.name] || [];

    if (uploaded.length === 0 && newlySelected.length === 0) return null;

    return (
      <div className="preview-file-grid">
        {uploaded.map((file) => (
          <PreviewExistingFile key={`existing-${file.id || file.Id}-${file.fileName || file.FileName}`} file={file} />
        ))}
        {newlySelected.map((file, idx) => (
          <PreviewNewFile key={`new-${file.name}-${idx}`} file={file} />
        ))}
      </div>
    );
  };

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

  const handleFilesChange = (name, fileList) => {
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setFiles((prev) => ({ ...prev, [name]: fileList }));
  };

  const handleRemoveNewFile = (name, index) => {
    setFiles((prev) => ({
      ...prev,
      [name]: (prev[name] || []).filter((_, idx) => idx !== index),
    }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
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

  const runSave = async (saveAction) => {
    setServerError('');
    setIsSaving(true);

    try {
      await saveAction();
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
    });
  };

  const handleNextSection2 = (e) => {
    e.preventDefault();
    if (!validateFields(section2Fields)) return;

    runSave(async () => {
      const id = await ensureApplication();
      await api.saveCompanyReach(id, {
        marketing: formData.marketing,
        app: formData.app,
        websitePresence: formData.websitePresence,
        socialMedia: formData.socialMedia,
        physicalOutlets: formData.physicalOutlets,
        futurePlans: formData.futurePlans,
      });
      if (files.uploads?.length) {
        const uploadResult = await api.uploadFiles(id, 'ReachDocs', files.uploads);
        setExistingFiles((prev) => [...prev, ...mapUploadedFiles(uploadResult, 'ReachDocs', files.uploads)]);
        setFiles((prev) => ({ ...prev, uploads: [] }));
      }
    });
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
        const uploadResult = await api.uploadFiles(id, field.fileType, files[field.name]);
        setExistingFiles((prev) => [...prev, ...mapUploadedFiles(uploadResult, field.fileType, files[field.name])]);
        setFiles((prev) => ({ ...prev, [field.name]: [] }));
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
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
      {field.type === 'textarea' ? (
        <textarea
          name={field.name}
          value={formData[field.name] || ''}
          onChange={handleInputChange}
          required={field.required}
          disabled={field.autoFilled || isSaving}
          rows={4}
        />
      ) : (
        <input
          type={field.type || 'text'}
          name={field.name}
          value={formData[field.name] || ''}
          onChange={handleInputChange}
          required={field.required}
          disabled={field.autoFilled || isSaving}
          autoComplete="off"
        />
      )}
      {errors[field.name] && <span className="error">{errors[field.name]}</span>}
    </div>
  );

  const renderFileField = (field) => (
    <FileUploadField
      key={field.name}
      field={field}
      existingFiles={getExistingFilesForField(field)}
      selectedFiles={files[field.name] || []}
      onFilesChange={handleFilesChange}
      onRemoveNew={handleRemoveNewFile}
      disabled={isSaving}
      error={errors[field.name]}
    />
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
        {visibleSection1Fields.filter((f) => f.type !== 'file').map((field) => (
          <li key={field.name}><strong>{field.label}:</strong> {formData[field.name] || '-'}</li>
        ))}
      </ul>
      <h3>About the Company</h3>
      <ul>
        {section2Fields.filter((f) => f.type !== 'file').map((field) => (
          <li key={field.name}><strong>{field.label}:</strong> {formData[field.name] || '-'}</li>
        ))}
        {section2Fields.filter((f) => f.type === 'file').map((field) => (
          <li key={field.name} className="preview-file-row">
            <strong>{field.label}:</strong>
            {renderPreviewFiles(field) || <span className="preview-empty">No files attached</span>}
          </li>
        ))}
      </ul>
      <h3>About the Company (contd.)</h3>
      <ul>
        {section3Fields.filter((f) => f.type !== 'file').map((field) => (
          <li key={field.name}><strong>{field.label}:</strong> {formData[field.name] || '-'}</li>
        ))}
        {section3Fields.filter((f) => f.type === 'file').map((field) => (
          <li key={field.name} className="preview-file-row">
            <strong>{field.label}:</strong>
            {renderPreviewFiles(field) || <span className="preview-empty">No files attached</span>}
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
    <div className="application-page">
      <header className="application-header-bar no-print">
        <div className="application-header-logo">
          <img src={oppiLogo} alt="OPPI Logo" />
          <span>Application Form</span>
        </div>
        <div className="application-header-actions">
          {applicationId && (
            <span className="application-id-badge">Application ID: {applicationId}</span>
          )}
          <button type="button" className="btn-header" onClick={() => navigate('/change-password')}>Change Password</button>
          <button type="button" className="btn-header logout" onClick={handleLogout}>Log Out</button>
        </div>
      </header>

      <div className="application-container">
        <div className="application-content-wrapper">
          <div className="application-card">
            <div className="application-header">
              <div className="application-card-brand">
                <img src={oppiLogo} alt="OPPI Logo" className="application-card-logo" />
                <div className="application-card-title">
                  <h2>Innovation Application</h2>
                </div>
              </div>
            </div>

            {serverError && <p className="form-error">{serverError}</p>}

            {!submitted && (
              <nav className="section-nav" aria-label="Application sections">
                {steps.map((label, idx) => (
                  <div
                    key={label}
                    className={`section-nav-item ${activeStep === idx ? 'active' : ''} ${activeStep > idx ? 'completed' : ''}`}
                  >
                    {label}
                  </div>
                ))}
              </nav>
            )}

            {!submitted && activeStep < steps.length && (
              <h3 className="section-title">{steps[activeStep]}</h3>
            )}

            <form noValidate onSubmit={
              activeStep === 0 ? handleNextSection1 :
              activeStep === 1 ? handleNextSection2 :
              activeStep === 2 ? handleNextSection3 :
              activeStep === 3 && !submitted ? handleSubmit :
              undefined
            }>
              {renderStep()}
              {!submitted && (
                <div className="form-navigation">
                  {activeStep > 0 && activeStep < steps.length && (
                    <button type="button" onClick={handleBack} disabled={isSaving} className="btn-prev">Previous</button>
                  )}
                  {activeStep < 3 && <button type="submit" disabled={isSaving} className="btn-next">{isSaving ? 'Saving...' : 'Next'}</button>}
                  {activeStep === 3 && <button type="submit" disabled={isSaving} className="btn-submit">{isSaving ? 'Submitting...' : 'Submit Application'}</button>}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ApplicationForm;
