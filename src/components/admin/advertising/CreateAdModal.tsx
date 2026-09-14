import React, { useState } from 'react';
import { AdvertisementType, AdPlacement, AdPriority, AdStatus, CreativeType, Advertisement } from '../../../types/advertising';
import { AdService } from '../../../services/adService';
import { useApp } from '../../../context/AppContext';
import { 
  X, 
  Upload, 
  Image as ImageIcon, 
  Video, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Link2,
  Calendar,
  Layers,
  MapPin,
  Target,
  FileText
} from 'lucide-react';

interface CreateAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdCreated: (ad: Advertisement) => void;
  initialAd?: Advertisement | null;
}

export const CreateAdModal: React.FC<CreateAdModalProps> = ({
  isOpen,
  onClose,
  onAdCreated,
  initialAd
}) => {
  const { currentUser, users } = useApp();

  const [advertiserName, setAdvertiserName] = useState(initialAd?.advertiserName || '');
  const [campaignName, setCampaignName] = useState(initialAd?.campaignName || '');
  const [advertisementType, setAdvertisementType] = useState<AdvertisementType>(initialAd?.advertisementType || 'banner');
  const [creativeType, setCreativeType] = useState<CreativeType>(initialAd?.creativeType || 'image');
  const [imageUrl, setImageUrl] = useState(initialAd?.imageUrl || 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80');
  const [videoUrl, setVideoUrl] = useState(initialAd?.videoUrl || '');
  const [headline, setHeadline] = useState(initialAd?.headline || '');
  const [description, setDescription] = useState(initialAd?.description || '');
  const [callToAction, setCallToAction] = useState(initialAd?.callToAction || 'Learn More');
  const [destinationUrl, setDestinationUrl] = useState(initialAd?.destinationUrl || 'https://wallahi.ug');
  const [placement, setPlacement] = useState<AdPlacement>(initialAd?.placement || 'home_dashboard');
  const [targetAudience, setTargetAudience] = useState(initialAd?.targetAudience || 'All Platform Users');
  const [targetLocation, setTargetLocation] = useState(initialAd?.targetLocation || 'All Uganda');
  const [priority, setPriority] = useState<AdPriority>(initialAd?.priority || 'MEDIUM');
  const [status, setStatus] = useState<AdStatus>(initialAd?.status || 'LIVE');
  const [startDate, setStartDate] = useState(initialAd?.startDate || new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(initialAd?.endDate || new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0]);
  const [budgetUGX, setBudgetUGX] = useState<number>(initialAd?.budgetUGX || 1000000);
  const [sponsoredProfessionalId, setSponsoredProfessionalId] = useState<string>(initialAd?.sponsoredProfessionalId || '');

  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadError(null);
    if (!file) return;

    // Validate image format
    const validFormats = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validFormats.includes(file.type)) {
      setUploadError('Invalid format. Please upload JPG, PNG, or WebP image.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size exceeds 5MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!advertiserName.trim() || !campaignName.trim() || !headline.trim() || !destinationUrl.trim()) {
      setUploadError('Please fill in all required fields (Advertiser, Campaign Name, Headline, Destination URL).');
      return;
    }

    setIsSubmitting(true);

    try {
      if (initialAd) {
        // Edit Mode
        const updated = AdService.updateAd(
          initialAd.id,
          {
            advertiserName,
            campaignName,
            advertisementType,
            creativeType,
            imageUrl,
            videoUrl,
            headline,
            description,
            callToAction,
            destinationUrl,
            placement,
            targetAudience,
            targetLocation,
            priority,
            status,
            startDate,
            endDate,
            budgetUGX,
            sponsoredProfessionalId: (advertisementType === 'sponsored_professional' || advertisementType === 'featured_professional') ? sponsoredProfessionalId : undefined
          },
          currentUser.email,
          currentUser.fullName
        );
        if (updated) {
          onAdCreated(updated);
          onClose();
        }
      } else {
        // Create Mode
        const created = AdService.createAd(
          {
            advertiserName,
            campaignName,
            advertisementType,
            creativeType,
            imageUrl,
            videoUrl,
            headline,
            description,
            callToAction,
            destinationUrl,
            placement,
            targetAudience,
            targetLocation,
            priority,
            status,
            startDate,
            endDate,
            budgetUGX,
            spentUGX: 0,
            sponsoredProfessionalId: (advertisementType === 'sponsored_professional' || advertisementType === 'featured_professional') ? sponsoredProfessionalId : undefined,
            createdBy: currentUser.email,
            approvedBy: status === 'LIVE' || status === 'APPROVED' ? currentUser.email : undefined
          },
          currentUser.email,
          currentUser.fullName
        );
        onAdCreated(created);
        onClose();
      }
    } catch (err: any) {
      setUploadError(err.message || 'Failed to save advertisement campaign.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter verified professionals for sponsored ads
  const verifiedPros = users.filter(u => u.authorities && u.authorities.some(a => a.status === 'VERIFIED'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-fadeIn" id="create-ad-modal-backdrop">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto my-8">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                MASTER ADMIN CONTROL
              </span>
              <span className="text-xs text-slate-400 font-mono-code">WALAYI Direct Engine</span>
            </div>
            <h2 className="text-xl font-display-legal font-bold text-slate-900 mt-1">
              {initialAd ? 'Edit Advertisement Campaign' : 'Create New Advertisement Campaign'}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            id="btn-close-ad-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {uploadError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Section 1: Campaign Identity */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase font-mono-code flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              1. Campaign Identification & Advertiser
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Advertiser / Brand Name *
                </label>
                <input
                  type="text"
                  required
                  value={advertiserName}
                  onChange={(e) => setAdvertiserName(e.target.value)}
                  placeholder="e.g. Stanbic Bank / Uganda Law Society"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  id="input-ad-advertiser"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Campaign Title / Reference *
                </label>
                <input
                  type="text"
                  required
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="e.g. Digital Escrow Trust Accounts 2026"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  id="input-ad-campaign-name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Advertisement Type
                </label>
                <select
                  value={advertisementType}
                  onChange={(e) => setAdvertisementType(e.target.value as AdvertisementType)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  id="select-ad-type"
                >
                  <option value="banner">Banner Advertisement</option>
                  <option value="native">Native Advertisement</option>
                  <option value="house_ad">House Advertisement (WALAYI)</option>
                  <option value="sponsored_cle">Sponsored Educational / CLE</option>
                  <option value="sponsored_service">Sponsored Legal Service</option>
                  <option value="sponsored_professional">Sponsored Professional</option>
                  <option value="featured_professional">Featured Professional</option>
                  <option value="institutional_campaign">Institutional Campaign</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Placement Slot *
                </label>
                <select
                  value={placement}
                  onChange={(e) => setPlacement(e.target.value as AdPlacement)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  id="select-ad-placement"
                >
                  <option value="home_dashboard">Home Dashboard</option>
                  <option value="marketplace">Marketplace</option>
                  <option value="commissioner_search">Commissioner Search</option>
                  <option value="professional_directory">Professional Directory</option>
                  <option value="legal_services">Legal Services</option>
                  <option value="educational_content">Educational / CLE Content</option>
                  <option value="completion_success">Completion / Success Screen</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as AdPriority)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  id="select-ad-priority"
                >
                  <option value="HIGH">HIGH (Priority Weight)</option>
                  <option value="MEDIUM">MEDIUM (Standard)</option>
                  <option value="LOW">LOW (Backfill)</option>
                </select>
              </div>
            </div>

            {/* If Sponsored Pro is selected, pick verified pro */}
            {(advertisementType === 'sponsored_professional' || advertisementType === 'featured_professional') && (
              <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-2">
                <label className="block text-xs font-bold text-indigo-900">
                  Select Verified Professional to Promote *
                </label>
                <select
                  value={sponsoredProfessionalId}
                  onChange={(e) => setSponsoredProfessionalId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-indigo-300 text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  id="select-sponsored-pro"
                >
                  <option value="">-- Choose verified practitioner --</option>
                  {verifiedPros.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} ({p.role.toUpperCase()} • {p.stationCity})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-indigo-700">
                  Verified professional listing will be decorated with a clear "SPONSORED" or "FEATURED" badge without altering statutory verification status.
                </p>
              </div>
            )}
          </div>

          {/* Section 2: Creative Upload & Preview */}
          <div className="space-y-4 pt-3 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 uppercase font-mono-code flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
              2. Creative Asset & Upload
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Upload Input & URL option */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Upload Creative Image (JPG, PNG, WebP)
                  </label>
                  <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-slate-50 hover:bg-blue-50/30">
                    <Upload className="w-6 h-6 text-slate-400 mb-1" />
                    <span className="text-xs font-bold text-slate-700">Click to upload image file</span>
                    <span className="text-[10px] text-slate-400 font-mono-code">Max 5MB • 16:9 or 4:1 recommended</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload-creative"
                    />
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Or Creative Asset Image URL
                  </label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono-code focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    id="input-ad-image-url"
                  />
                </div>
              </div>

              {/* Creative Live Preview */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Creative Preview
                </label>
                <div className="h-40 rounded-2xl bg-slate-900 border border-slate-200 overflow-hidden relative flex items-center justify-center">
                  {imageUrl && imageUrl.trim().length > 0 ? (
                    <img 
                      src={imageUrl} 
                      alt="Creative Preview" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="text-center text-slate-400 text-xs">
                      <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-50" />
                      <span>No image selected</span>
                    </div>
                  )}
                  <div className="absolute top-2 left-2 bg-black/70 text-white text-[9px] font-mono-code font-bold px-2 py-0.5 rounded">
                    PREVIEW
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Section 3: Copywriting & Destination */}
          <div className="space-y-4 pt-3 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 uppercase font-mono-code flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-indigo-600" />
              3. Copywriting, Call-to-Action & Target Link
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Headline / Main Title *
              </label>
              <input
                type="text"
                required
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. Master Remote Witnessing Under Uganda Electronic Transactions Act"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                id="input-ad-headline"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ad Description / Body Copy *
              </label>
              <textarea
                required
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Clear, professional legal description. Keep it concise and dignified."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                id="textarea-ad-description"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Call to Action (Button Text) *
                </label>
                <input
                  type="text"
                  required
                  value={callToAction}
                  onChange={(e) => setCallToAction(e.target.value)}
                  placeholder="e.g. Register for CLE / Learn More"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  id="input-ad-cta"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Destination URL *
                </label>
                <input
                  type="url"
                  required
                  value={destinationUrl}
                  onChange={(e) => setDestinationUrl(e.target.value)}
                  placeholder="https://example.com/target-landing"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono-code focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  id="input-ad-destination"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Schedule, Audience & Status */}
          <div className="space-y-4 pt-3 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 uppercase font-mono-code flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
              4. Targeting, Scheduling & Status Lifecycle
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Geographic Location
                </label>
                <input
                  type="text"
                  value={targetLocation}
                  onChange={(e) => setTargetLocation(e.target.value)}
                  placeholder="e.g. Kampala, All Uganda"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  id="input-ad-location"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Campaign Start Date *
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono-code"
                  id="input-ad-start-date"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Campaign End Date *
                </label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono-code"
                  id="input-ad-end-date"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Campaign Budget (UGX)
                </label>
                <input
                  type="number"
                  min="0"
                  step="50000"
                  value={budgetUGX}
                  onChange={(e) => setBudgetUGX(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono-code focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  id="input-ad-budget"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Initial Campaign Status *
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as AdStatus)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  id="select-ad-status"
                >
                  <option value="LIVE">LIVE (Immediately active in placement)</option>
                  <option value="APPROVED">APPROVED (Scheduled to run according to dates)</option>
                  <option value="PENDING_REVIEW">PENDING REVIEW (Submit for review)</option>
                  <option value="DRAFT">DRAFT (Saved internally)</option>
                  <option value="SUSPENDED">SUSPENDED (Held)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
              id="btn-submit-ad-campaign"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{initialAd ? 'Save Campaign Changes' : 'Publish / Schedule Campaign'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
