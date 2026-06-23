import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, clearSession, getSession, getFileUrl, formatIST } from '../../services/api';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import html2pdf from 'html2pdf.js';
import DashboardLayout from '../../components/DashboardLayout/DashboardLayout';
import './Dashboards.css';

const DataRow = ({ label, value }) => (
  <div className="data-row">
    <div className="data-label">{label}</div>
    <div className="data-value">{value || '—'}</div>
  </div>
);

function isImageFile(name, mimeType, fileType) {
  const ext = (fileType || name?.split('.').pop() || '').toLowerCase().replace(/^\./, '');
  return ['jpg', 'jpeg', 'jpe'].includes(ext);
}

function isVideoFile(name, mimeType, fileType) {
  const ext = (fileType || name?.split('.').pop() || '').toLowerCase().replace(/^\./, '');
  return ['asf', 'asx', 'wmv', 'wmx', 'wm', 'avi', 'divx', 'flv', 'mov', 'qt', 'mpeg', 'mpg', 'mpe', 'mp4', 'm4v', 'ogv', 'webm', 'mkv', '3gp', '3gpp', '3g2', '3gp2'].includes(ext);
}

const PreviewFileCard = ({ file, onRemove }) => {
  const name = file.fileName || file.FileName;
  const url = getFileUrl(file.filePath || file.FilePath);
  const fileType = file.fileType || file.FileType;
  const isImage = isImageFile(name, null, fileType);
  const isVideo = isVideoFile(name, null, fileType);

  return (
    <div className="app-preview-card">
      <div className="app-preview-media">
        {url && isImage && (
          <img src={url} alt={name} className="app-preview-thumb" />
        )}
        {url && isVideo && (
          <video src={url} className="app-preview-thumb" controls />
        )}
        {(!url || (!isImage && !isVideo)) && (
          <div className="app-preview-icon">{isVideo ? 'Video' : 'PDF'}</div>
        )}
      </div>
      <div className="app-preview-details">
        <span className="app-preview-section">{file.section || file.Section || 'Doc'}</span>
        <span className="app-preview-name" title={name}>{name}</span>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
          {url && (
            <a href={url} target="_blank" rel="noreferrer" className="app-preview-link no-print">
              View full file
            </a>
          )}
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="no-print"
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
    </div>
  );
};

export default function ViewApplication({ isMine }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState(null);
  const [juryMembers, setJuryMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  const session = getSession();
  const userRole = session?.role;

  useEffect(() => {
    const fetchApp = async () => {
      try {
        const [appData, juryData] = await Promise.all([
          isMine ? api.getPreview() : api.getAppReview(id),
          api.getJuryMembers().catch(() => [])
        ]);
        setApp(appData);
        setJuryMembers(juryData || []);
      } catch (err) {
        setError('Failed to load application details');
      } finally {
        setLoading(false);
      }
    };
    fetchApp();
  }, [id, isMine]);

  const handleRemoveExistingFile = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;
    try {
      await api.deleteFile(fileId);
      setApp((prev) => ({
        ...prev,
        file_uploads: prev.file_uploads.filter((f) => (f.id || f.Id) !== fileId),
      }));
    } catch (err) {
      alert(err.message || 'Failed to delete file. Please try again.');
    }
  };

  const handleLogout = () => {
    clearSession();
    navigate('/auth');
  };

  const handleChangePassword = () => {
    navigate('/change-password');
  };

  const handleDownloadZip = async () => {
    setDownloading(true);
    try {
      const zip = new JSZip();

      // 1. Generate PDF of the application details
      const element = document.getElementById('application-content');
      const pdfBlob = await html2pdf().from(element).set({
        margin: [10, 10, 10, 10], // top, left, bottom, right
        filename: `Application_${app.id}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, ignoreElements: (el) => el.classList && el.classList.contains('no-print') },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      }).outputPdf('blob');
      
      zip.file(`Application_${app.id}.pdf`, pdfBlob);

      // 2. Fetch all attached files and add to zip
      if (app.file_uploads && app.file_uploads.length > 0) {
        const attachmentsFolder = zip.folder('Attachments');
        
        const fetchPromises = app.file_uploads.map(async (file, index) => {
          const url = getFileUrl(file.filePath || file.FilePath);
          try {
            // Bypass cache to avoid 304 Not Modified responses lacking CORS headers
            const response = await fetch(url, { cache: 'no-store' });
            if (!response.ok && response.status !== 304) {
              throw new Error(`HTTP Error: ${response.status}`);
            }
            const blob = await response.blob();
            
            // Extract actual extension from filePath
            let ext = (file.filePath || file.FilePath || '').split('.').pop() || '';
            if (ext.includes('/') || ext.length > 5) ext = ''; // Safety check
            
            let saveName = file.fileName || `attachment_${index}`;
            
            // Add extension if missing
            if (ext && !saveName.toLowerCase().endsWith(`.${ext.toLowerCase()}`)) {
              saveName = `${saveName}.${ext}`;
            }
            
            // Add section prefix to avoid duplicates
            const sectionSafe = (file.section || 'Doc').replace(/[^a-z0-9]/gi, '_');
            saveName = `${sectionSafe}_${saveName}`;

            attachmentsFolder.file(saveName, blob);
          } catch (err) {
            console.error(`Failed to fetch ${file.fileName}`, err);
            attachmentsFolder.file(`${file.fileName}_ERROR.txt`, "Failed to download this attachment. It may no longer exist or is restricted.");
          }
        });
        
        await Promise.all(fetchPromises);
      }

      // 3. Generate the ZIP file and trigger download
      const zipContent = await zip.generateAsync({ type: 'blob' });
      saveAs(zipContent, `Application_${app.id}_Full.zip`);
      
    } catch (err) {
      console.error('Error generating zip:', err);
      alert('Failed to generate the ZIP file. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <div className="dashboard-loading">Loading application details...</div>;
  if (error || !app) return <div className="dashboard-error">{error || 'Application not found'}</div>;

  const pi = app.personal_info || {};
  const cr = app.company_reach || {};
  const cd = app.company_detail || {};

  // Fix for 'my-application' Applicant Info fields:
  // If view is 'mine', display current user's info from session if available, otherwise fallback to app object or '—'
  let applicantName, applicantEmail, applicantMobile;
  if (isMine) {
    // For my application, use session info if available
    applicantName =
      session?.first_name || session?.last_name
        ? `${session?.first_name || ''}${session?.last_name ? ' ' + session.last_name : ''}`.trim()
        : (app.user_name || (app.user_first_name ? `${app.user_first_name} ${app.user_last_name}` : 'You'));
    applicantEmail = session?.email || app.user_email || '—';
    applicantMobile = session?.mobile || app.user_mobile || '—';
    // Clean up all empty string results
    applicantName = applicantName && applicantName.trim() !== '' ? applicantName : 'You';
    applicantEmail = applicantEmail && applicantEmail.trim() !== '' ? applicantEmail : '—';
    applicantMobile = applicantMobile && applicantMobile.trim() !== '' ? applicantMobile : '—';
  } else {
    // For other user's app, fall back to existing logic
    applicantName = app.user_name || (app.user_first_name ? `${app.user_first_name} ${app.user_last_name}` : '—');
    applicantEmail = app.user_email || '—';
    applicantMobile = app.user_mobile || '—';
  }

  const totalJuries = juryMembers.filter(m => m.type === 'JURY').length;

  return (
    <DashboardLayout
      title={isMine ? 'Applicant Dashboard' : 'Application Review'}
      headerActions={isMine ? (
        <>
          <button className="btn-action" onClick={handleChangePassword}>Change Password</button>
          <button className="btn-logout" onClick={handleLogout}>Log Out</button>
        </>
      ) : null}
      className={isMine ? 'applicant-dashboard' : 'review-dashboard'}
    >
      <div className="dashboard-content" style={{ maxWidth: '900px', margin: '40px auto' }}>
        <div className="view-header no-print">
          <h2>Application #{app.id}</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            {userRole === 'ADMIN' && (
              <button className="btn-action edit-text" onClick={() => navigate(`/admin/edit-application/${app.id}`)}>
                EDIT APPLICATION
              </button>
            )}
            <button className="btn-action approve" onClick={handleDownloadZip} disabled={downloading}>
              {downloading ? 'GENERATING ZIP...' : 'DOWNLOAD APPLICATION (ZIP)'}
            </button>
            {!isMine && <button className="btn-action" onClick={() => navigate(-1)}>← Back to Dashboard</button>}
          </div>
        </div>

        <div id="application-content" style={{ padding: '20px', background: 'white' }}>
          <div className="info-cards">
            <div className="info-card">
              <h4>Applicant Info</h4>
              <div><strong>Name:</strong> {applicantName}</div>
              <div><strong>Email:</strong> {applicantEmail}</div>
              <div><strong>Mobile:</strong> {applicantMobile}</div>
            </div>
            {!isMine && (
              <div className="info-card highlight">
                <h4>Status Info</h4>
                <div><strong>Status:</strong> <span className={`status-text ${app.status.toLowerCase().replace('_', '-')}`}>{app.status}</span></div>
                <div><strong>Submitted:</strong> {formatIST(app.submitted_at)}</div>
                {app.remarks && (
                  <div style={{ marginTop: '0.5rem', color: '#334155' }}>
                    <strong>Remarks:</strong> {app.remarks}
                  </div>
                )}
                {(userRole === 'ADMIN' || userRole === 'JURY') && (
                  <>
                    <div style={{ borderTop: '1px solid #cbd5e1', marginTop: '0.75rem', paddingTop: '0.75rem' }}>
                      <strong>Jury Approvals:</strong> {app.jury_approval_count || 0} / {totalJuries || 3}
                    </div>
                    <div>
                      <strong>Overall Avg Score:</strong> {app.average_score ? app.average_score.toFixed(2) : '—'} / 5.00
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="dashboard-section">
            <h3>1. Personal & Company Info</h3>
            <div className="section-data">
              <DataRow label="Company Name" value={pi.companyName || pi.CompanyName} />
              <DataRow label="Designation" value={pi.designation || pi.Designation} />
              <DataRow label="Category of Work" value={(pi.categoryOfWork || pi.CategoryOfWork) === 'Others' ? (pi.otherCategory || pi.OtherCategory) : (pi.categoryOfWork || pi.CategoryOfWork)} />
              <DataRow label="Company Website" value={pi.companyWebsite || pi.CompanyWebsite} />
              <DataRow label="Company Brief" value={pi.companyBrief || pi.CompanyBrief} />
              <DataRow label="Innovation" value={pi.innovation || pi.Innovation} />
              <DataRow label="Competitive Analysis" value={pi.competitiveAnalysis || pi.CompetitiveAnalysis} />
              <DataRow label="Need Analysis" value={pi.needAnalysis || pi.NeedAnalysis} />
              <DataRow label="Marketability" value={pi.marketability || pi.Marketability} />
            </div>
          </div>

          <div className="dashboard-section">
            <h3>2. Company Reach</h3>
            <div className="section-data">
              <DataRow label="Marketing Strategy" value={cr.marketingStrategy || cr.MarketingStrategy} />
              <DataRow label="App Details" value={cr.appDetails || cr.AppDetails} />
              <DataRow label="Website Details" value={cr.websiteDetails || cr.WebsiteDetails} />
              <DataRow label="Social Media" value={cr.socialMedia || cr.SocialMedia} />
              <DataRow label="Physical Outlets" value={cr.physicalOutlets || cr.PhysicalOutlets} />
              <DataRow label="Future Expansion (3 Yrs)" value={cr.futureExpansion || cr.FutureExpansion} />
            </div>
          </div>

          <div className="dashboard-section">
            <h3>3. About the Company — Details</h3>
            <div className="section-data">
              <DataRow label="Customer Benefit" value={cd.customerBenefit || cd.CustomerBenefit} />
              <DataRow label="Testimonial" value={cd.testimonial || cd.Testimonial} />
              <DataRow label="Employees" value={cd.employeeCount || cd.EmployeeCount} />
              <DataRow label="Board of Directors" value={cd.boardOfDirectors || cd.BoardOfDirectors} />
              <DataRow label="Investors" value={cd.investorsDetails || cd.InvestorsDetails} />
              <DataRow label="Media Mentions" value={cd.mediaMentions || cd.MediaMentions} />
              <DataRow label="Patents" value={cd.patents || cd.Patents} />
              <DataRow label="Product Benefits" value={cd.productBenefits || cd.ProductBenefits} />
            </div>
          </div>

          {(userRole === 'ADMIN' || userRole === 'VALIDATOR' || userRole === 'JURY') && app.validator_reviews && app.validator_reviews.length > 0 && (
            <div className="dashboard-section no-print">
              <h3>Validator Reviews Breakdown</h3>
              <div className="table-responsive">
                <table className="jury-scores-table">
                  <thead>
                    <tr>
                      <th>Validator</th>
                      <th>Innovation & IP (25%)</th>
                      <th>Team Strength (25%)</th>
                      <th>Business Plan (25%)</th>
                      <th>Impact (25%)</th>
                      <th>Weighted Score</th>
                      <th>Remarks</th>
                      <th>Reviewed At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {app.validator_reviews.map(r => (
                      <tr key={r.id}>
                        <td>{r.validator_name}</td>
                        <td>{r.innovationIpScore} / 5</td>
                        <td>{r.teamStrengthScore} / 5</td>
                        <td>{r.businessPlanScore} / 5</td>
                        <td>{r.impactScore} / 5</td>
                        <td><strong>{r.weightedScore.toFixed(2)}</strong> / 5.00</td>
                        <td>{r.remarks || '—'}</td>
                        <td>{formatIST(r.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {(userRole === 'ADMIN' || userRole === 'VALIDATOR' || userRole === 'JURY') && app.jury_reviews && app.jury_reviews.length > 0 && (
            <div className="dashboard-section no-print">
              <h3>Jury Reviews Breakdown</h3>
              <div className="table-responsive">
                <table className="jury-scores-table">
                  <thead>
                    <tr>
                      <th>Jury Member</th>
                      <th>Innovation & IP (25%)</th>
                      <th>Team Strength (25%)</th>
                      <th>Business Plan (25%)</th>
                      <th>Impact (25%)</th>
                      <th>Weighted Score</th>
                      <th>Remarks</th>
                      <th>Reviewed At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {app.jury_reviews.map(r => (
                      <tr key={r.id}>
                        <td>{r.jury_name}</td>
                        <td>{r.innovationIpScore} / 5</td>
                        <td>{r.teamStrengthScore} / 5</td>
                        <td>{r.businessPlanScore} / 5</td>
                        <td>{r.impactScore} / 5</td>
                        <td><strong>{r.weightedScore.toFixed(2)}</strong> / 5.00</td>
                        <td>{r.remarks || '—'}</td>
                        <td>{formatIST(r.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="dashboard-section">
            <h3>Attached Files</h3>
            {app.file_uploads && app.file_uploads.length > 0 ? (
              <div className="app-preview-grid">
                {app.file_uploads.map(f => {
                  const canDelete = app.status === 'DRAFT' || userRole === 'ADMIN';
                  return (
                    <PreviewFileCard
                      key={f.id}
                      file={f}
                      onRemove={canDelete ? () => handleRemoveExistingFile(f.id) : null}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="no-data">No files attached.</div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
