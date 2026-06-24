import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { api, getApplicationStorageKey, getSession, clearSession, getFileUrl } from '../../services/api';
import oppiLogo from '../../assets/OPPI-logo-black.png';
import FileUploadField from '../../components/FileUploadField/FileUploadField';
import './ApplicationForm.css';

const steps = [
  'Personal Info',
  'About Company',
  'Company Details',
  'Submit & Review',
];

const section1Fields = [
  { name: 'firstName', label: 'First Name', required: true },
  { name: 'lastName', label: 'Last Name', required: true },
  { name: 'email', label: 'Email Id (Login)', required: true, autoFilled: true, type: 'email' },
  { name: 'mobile', label: 'Mobile Number', required: true, autoFilled: true, type: 'tel' },
  { name: 'companyName', label: 'Company Name', required: true },
  { name: 'designation', label: 'Designation', required: true },
  { name: 'category', label: 'Category of work', required: true, type: 'select', options: ['Healthcare finance', 'Products', 'Devices', 'Consultation', 'Services (Platform to connect for Ex video)', 'Others'] },
  { name: 'categoryOther', label: 'Others (specify)', required: true, showIf: (data) => data.category === 'Others' },
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
  { name: 'uploads', label: 'Upload PDF, JPEG or Video (MP4/MOV/AVI) (up to 5 attachments, max 8MB each)', required: true, type: 'file', multiple: true },
  { name: 'futurePlans', label: 'Future expansion plans over the next 3 years', required: true, type: 'textarea' },
];

const section3Fields = [
  { name: 'customerHelp', label: 'How does your start-up help your customer and end-user', required: true, type: 'textarea' },
  { name: 'customerTestimonial', label: 'Customer Testimonial (If not applicable, please mention "NA" in the text space)', required: true, type: 'textarea' },
  { name: 'customerTestimonialUpload', label: 'Upload Customer Testimonial (PDF, JPEG or Video (MP4/MOV/AVI), up to 5, 8MB each)', required: false, type: 'file', multiple: true, fileType: 'Testimonial' },
  { name: 'numEmployees', label: 'Number of employees', required: true, type: 'number' },
  { name: 'boardDirectors', label: 'Details of board of directors', required: true, type: 'textarea' },
  { name: 'boardDirectorsUpload', label: 'Upload details of board of directors (PDF, JPEG or Video (MP4/MOV/AVI), up to 5, 8MB each)', required: true, type: 'file', multiple: true, fileType: 'Board' },
  { name: 'investors', label: 'Details of the investors', required: true, type: 'textarea' },
  { name: 'investorsUpload', label: 'Upload Details of the investors (PDF, JPEG or Video (MP4/MOV/AVI), up to 5, 8MB each)', required: false, type: 'file', multiple: true, fileType: 'Investors' },
  { name: 'mediaMentions', label: 'Media mentions / Accolades (academic publications, campus magazines, research publications, etc.)', required: false, type: 'textarea' },
  { name: 'mediaMentionsUpload', label: 'Upload Media mentions / Accolades (PDF, JPEG or Video (MP4/MOV/AVI), up to 5, 8MB each)', required: false, type: 'file', multiple: true, fileType: 'Media' },
  { name: 'patents', label: 'Patents (Include approved and/or applied)', required: false, type: 'textarea' },
  { name: 'benefits', label: 'What are the benefits of your product/service: competitive analysis', required: true, type: 'textarea' },
];

function isImageFile(name, mimeType, fileType) {
  const ext = (fileType || name?.split('.').pop() || '').toLowerCase().replace(/^\./, '');
  return ['jpg', 'jpeg', 'jpe'].includes(ext);
}

function isVideoFile(name, mimeType, fileType) {
  const ext = (fileType || name?.split('.').pop() || '').toLowerCase().replace(/^\./, '');
  return ['asf', 'asx', 'wmv', 'wmx', 'wm', 'avi', 'divx', 'flv', 'mov', 'qt', 'mpeg', 'mpg', 'mpe', 'mp4', 'm4v', 'ogv', 'webm', 'mkv', '3gp', '3gpp', '3g2', '3gp2'].includes(ext);
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

function getFieldError(field, value, allData = {}) {
  if (field.showIf && !field.showIf(allData)) return '';

  const trimmedValue = typeof value === 'string' ? value.trim() : value;

  if (field.required) {
    const isEmpty = trimmedValue == null || trimmedValue === '';
    if (isEmpty) return 'Required';
  }

  if (!trimmedValue) return '';

  if (field.type === 'email') {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(String(trimmedValue))) return 'Enter a valid email address';
  }

  if (field.type === 'tel') {
    const digits = String(trimmedValue).replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 15) return 'Enter a valid mobile number';
  }

  if (field.type === 'number' && Number.isNaN(Number(trimmedValue))) {
    return 'Enter a valid number';
  }

  if (field.name === 'companyWebsite') {
    try {
      new URL(String(trimmedValue).startsWith('http') ? String(trimmedValue) : `https://${trimmedValue}`);
    } catch {
      return 'Enter a valid website URL';
    }
  }

  return '';
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

function PreviewExistingFile({ file, onRemove }) {
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
        {url && (
          <a href={url} target="_blank" rel="noreferrer" className="preview-file-link">
            View file
          </a>
        )}
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            style={{
              background: 'none',
              border: 'none',
              color: '#ef4444',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: '600',
              padding: 0,
            }}
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

function ApplicationForm() {
  const session = getSession();
  const navigate = useNavigate();
  const { id: routeId } = useParams();
  const actionRef = useRef('next');
  const [activeStep, setActiveStep] = useState(0);
  const [files, setFiles] = useState({});
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveExitModal, setShowSaveExitModal] = useState(false);
  const [applicationId, setApplicationId] = useState(() => {
    if (routeId) return routeId;
    if (!session?.userId) return null;
    return localStorage.getItem(getApplicationStorageKey(session.userId));
  });
  const [formData, setFormData] = useState(() => {
    const isEditingSpecificApp = !!routeId;
    return {
      firstName: isEditingSpecificApp ? '' : (session?.first_name || ''),
      lastName: isEditingSpecificApp ? '' : (session?.last_name || ''),
      email: isEditingSpecificApp ? '' : (session?.email || ''),
      mobile: isEditingSpecificApp ? '' : (session?.mobile || ''),
    };
  });

  const visibleSection1Fields = useMemo(
    () => section1Fields.filter((field) => !field.showIf || field.showIf(formData)),
    [formData]
  );

  const [existingFiles, setExistingFiles] = useState([]);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const checkExisting = async () => {
      try {
        const isEditingSpecificApp = !!routeId;
        const data = isEditingSpecificApp ? await api.getAppReview(routeId) : await api.getPreview();

        if (data) {
          if (!isEditingSpecificApp && data.status && data.status !== 'DRAFT') {
            navigate('/thank-you', { replace: true });
            return;
          }

          setApplicationId(String(data.id));

          // Populate existing text data
          setFormData(prev => {
            const newData = { ...prev };

            if (isEditingSpecificApp) {
              const nameParts = (data.user_name || '').trim().split(/\s+/);
              newData.firstName = nameParts[0] || '';
              newData.lastName = nameParts.slice(1).join(' ') || '';
              newData.email = data.user_email || '';
              newData.mobile = data.user_mobile || '';
            }

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
        }
        setIsInitializing(false);
      } catch (err) {
        // If no application exists, ignore.
        console.log(err);
        setIsInitializing(false);
      }
    };
    checkExisting();
  }, [navigate, routeId]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeStep]);

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
          <PreviewExistingFile
            key={`existing-${file.id || file.Id}-${file.fileName || file.FileName}`}
            file={file}
            onRemove={!isSaving ? () => handleRemoveExistingFile(field.name, file.id || file.Id) : null}
          />
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
    setFormData((prev) => {
      const nextData = { ...prev, [name]: value };
      if (name === 'category' && value !== 'Others') {
        nextData.categoryOther = '';
      }
      return nextData;
    });

    const field = [...section1Fields, ...section2Fields, ...section3Fields].find((item) => item.name === name);
    if (field && errors[name]) {
      const nextError = getFieldError(field, value, { ...formData, [name]: value });
      setErrors((prev) => ({ ...prev, [name]: nextError || undefined }));
    }

    if (name === 'category' && value !== 'Others') {
      setErrors((prev) => ({ ...prev, categoryOther: undefined }));
    }
  };

  const handleFieldBlur = (field) => {
    const nextError = getFieldError(field, formData[field.name], formData);
    if (nextError || errors[field.name]) {
      setErrors((prev) => ({ ...prev, [field.name]: nextError || undefined }));
    }
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

  const handleRemoveExistingFile = async (name, fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;
    setServerError('');
    setIsSaving(true);
    try {
      await api.deleteFile(fileId);
      setExistingFiles((prev) => prev.filter((f) => (f.id || f.Id) !== fileId));
    } catch (err) {
      setServerError(err.message || 'Unable to delete file. Please try again.');
    } finally {
      setIsSaving(false);
    }
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

      if (field.type !== 'file') {
        const nextError = getFieldError(field, formData[field.name], formData);
        if (nextError) {
          newErrors[field.name] = nextError;
        }
      }
    });

    setErrors(newErrors);

    const errorKeys = Object.keys(newErrors);
    if (errorKeys.length > 0) {
      setTimeout(() => {
        const firstErrorField = fields.find((f) => newErrors[f.name]);
        if (firstErrorField) {
          const element = document.getElementsByName(firstErrorField.name)[0];
          if (element) {
            if (firstErrorField.type === 'file') {
              const container = element.closest('.form-group');
              if (container) {
                container.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            } else {
              element.focus({ preventScroll: true });
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }
        }
      }, 50);
    }

    return errorKeys.length === 0;
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
      if (actionRef.current === 'exit') {
        setShowSaveExitModal(true);
      } else {
        handleNext();
      }
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
      navigate('/thank-you');
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
          onBlur={() => handleFieldBlur(field)}
          required={field.required}
          disabled={field.autoFilled || isSaving}
          rows={4}
          className={errors[field.name] ? 'invalid' : ''}
        />
      ) : (
        <input
          type={field.type || 'text'}
          name={field.name}
          value={formData[field.name] || ''}
          onChange={handleInputChange}
          onBlur={() => handleFieldBlur(field)}
          required={field.required}
          disabled={field.autoFilled || isSaving}
          autoComplete="off"
          className={errors[field.name] ? 'invalid' : ''}
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
      onRemoveExisting={handleRemoveExistingFile}
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
            onBlur={() => handleFieldBlur(field)}
            required={field.required}
            disabled={isSaving}
            className={errors[field.name] ? 'invalid' : ''}
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
      {/* Section 1: Personal Info */}
      <div className="preview-card-group">
        <div className="preview-card-header">
          <div className="preview-card-title">
            <span className="preview-card-icon">👤</span>
            <h3>Personal Information</h3>
          </div>
        </div>
        <div className="preview-card-body">
          <ul className="preview-list">
            {visibleSection1Fields.filter((f) => f.type !== 'file').map((field) => (
              <li key={field.name} className="preview-row">
                <span className="preview-label">{field.label}:</span>
                <span className="preview-value">{formData[field.name] || '—'}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Section 2: About Company */}
      <div className="preview-card-group">
        <div className="preview-card-header">
          <div className="preview-card-title">
            <span className="preview-card-icon">🏢</span>
            <h3>About the Company</h3>
          </div>
        </div>
        <div className="preview-card-body">
          <ul className="preview-list">
            {section2Fields.filter((f) => f.type !== 'file').map((field) => (
              <li key={field.name} className="preview-row">
                <span className="preview-label">{field.label}:</span>
                <span className="preview-value">{formData[field.name] || '—'}</span>
              </li>
            ))}
            {section2Fields.filter((f) => f.type === 'file').map((field) => (
              <li key={field.name} className="preview-file-row">
                <span className="preview-label">{field.label}:</span>
                <div className="preview-file-content">
                  {renderPreviewFiles(field) || <span className="preview-empty">No files attached</span>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Section 3: Company Details */}
      <div className="preview-card-group">
        <div className="preview-card-header">
          <div className="preview-card-title">
            <span className="preview-card-icon">📊</span>
            <h3>Company Details</h3>
          </div>
        </div>
        <div className="preview-card-body">
          <ul className="preview-list">
            {section3Fields.filter((f) => f.type !== 'file').map((field) => (
              <li key={field.name} className="preview-row">
                <span className="preview-label">{field.label}:</span>
                <span className="preview-value">{formData[field.name] || '—'}</span>
              </li>
            ))}
            {section3Fields.filter((f) => f.type === 'file').map((field) => (
              <li key={field.name} className="preview-file-row">
                <span className="preview-label">{field.label}:</span>
                <div className="preview-file-content">
                  {renderPreviewFiles(field) || <span className="preview-empty">No files attached</span>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );

  const renderStep = () => {
    if (activeStep === 3) return renderPreview();
    if (activeStep === 0) return renderSection1();
    if (activeStep === 1) return renderSection2();
    if (activeStep === 2) return renderSection3();
    return null;
  };

  return (
    <div className="application-page">
      <div className="application-header-wrapper">
        <header className="application-header-bar no-print">
          <div className="application-header-logo">
            <img src={oppiLogo} alt="OPPI Logo" />
          </div>
          <div className="application-header-actions">
            {applicationId && (
              <span className="application-id-badge">Application ID: {applicationId}</span>
            )}
            {routeId && (
              <button type="button" className="btn-header dashboard" onClick={() => navigate('/admin')}>BACK TO DASHBOARD</button>
            )}
            <button type="button" className="btn-header change-pwd" onClick={() => navigate('/change-password')}>CHANGE PASSWORD</button>
            <button type="button" className="btn-header logout" onClick={handleLogout}>LOG OUT <span className="logout-icon">→</span></button>
          </div>
        </header>
      </div>

      <div className="application-container">
        <div className="application-content-wrapper">


          <div className="progress-tracker-container">
            <nav className="section-nav" aria-label="Application sections">
              {steps.map((label, idx) => (
                <div
                  key={label}
                  className={`section-nav-item ${activeStep === idx ? 'active' : ''} ${activeStep > idx ? 'completed' : ''}`}
                >
                  <div className="step-circle">{idx + 1}</div>
                  <span className="step-label">{label}</span>
                </div>
              ))}
            </nav>
          </div>

          <div className="application-card">
            {serverError && <p className="form-error">{serverError}</p>}

            {activeStep < 3 && (
              <div className="form-instructions">
                <h3>Fill in your details</h3>
                <p>All data entered during registration will be auto-filled. Please verify and complete the remaining fields.</p>
              </div>
            )}
            {activeStep === 3 && (
              <div className="form-instructions">
                <h3>Review & Submit</h3>
                <p>Please review your details before final submission.</p>
              </div>
            )}

            <form noValidate onSubmit={
              activeStep === 0 ? handleNextSection1 :
                activeStep === 1 ? handleNextSection2 :
                  activeStep === 2 ? handleNextSection3 :
                    activeStep === 3 ? handleSubmit :
                      undefined
            }>
              {renderStep()}
              <div className="form-navigation">
                <div className="form-nav-left">
                  {activeStep < 3 && (
                    <div className="page-indicator">
                      <span className="page-text">Page {activeStep + 1} of 4</span>
                      <div className="page-progress-bar">
                        <div className="page-progress-fill" style={{ width: `${((activeStep + 1) / 4) * 100}%` }}></div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="form-nav-right">
                  {activeStep > 0 && activeStep < steps.length && (
                    <button type="button" onClick={handleBack} disabled={isSaving} className="btn-prev">Previous</button>
                  )}
                  {activeStep < 3 && (
                    <>
                      {!routeId && (
                        <button type="submit" onClick={() => { actionRef.current = 'exit'; }} disabled={isSaving} className="btn-save-exit">Save & Exit</button>
                      )}
                      <button
                        type="submit"
                        onClick={() => { actionRef.current = 'next'; }}
                        disabled={isSaving}
                        className="btn-next"
                      >
                        {isSaving ? 'Saving...' : (
                          <>
                            Continue <span aria-hidden="true">&nbsp;&nbsp;&nbsp;</span>
                            <span aria-hidden="true">&gt;</span>
                          </>
                        )}
                      </button>

                    </>

                  )}
                  {activeStep === 3 && (
                    <button
                      type={routeId ? 'button' : 'submit'}
                      onClick={routeId ? () => navigate('/admin') : (() => { actionRef.current = 'next'; })}
                      disabled={isSaving}
                      className="btn-submit"
                    >
                      {routeId ? 'Finish & Return to Dashboard' : (isSaving ? 'Submitting...' : 'Submit Application')}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
      {showSaveExitModal && (
        <div className="save-exit-modal-overlay">
          <div className="save-exit-modal">
            <div className="save-exit-modal-icon">✓</div>
            <h2>Application Saved</h2>
            <p>
              Thank you for your registration. Your application is saved with us. You can fill up the complete application by 7th August’ 2026.
            </p>
            <button
              onClick={() => {
                setShowSaveExitModal(false);
                navigate(routeId ? '/admin' : '/');
              }}
              className="save-exit-modal-btn"
            >
              Go Back to Home Page
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ApplicationForm;
