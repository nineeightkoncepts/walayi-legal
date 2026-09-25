import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CommissioningRequest, AnnexureItem } from '../../types';
import { 
  FileText, 
  Layers, 
  DollarSign, 
  Wifi, 
  WifiOff, 
  Video, 
  ShieldCheck, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  ArrowRight, 
  Lock, 
  Eye, 
  UserCheck, 
  Smartphone, 
  Hash, 
  Sparkles,
  ExternalLink,
  ChevronRight,
  Filter,
  Search,
  Key,
  Calendar,
  AlertCircle,
  User,
  Stamp
} from 'lucide-react';
import { ApiGatewayConfigModal } from '../admin/ApiGatewayConfigModal';

export const CommissionerDashboard: React.FC = () => {
  const { 
    currentUser, 
    requests, 
    setActiveCommissioningId, 
    setCurrentView,
    updateCommissioningRequest,
    executePayment,
    addNotification
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'PAID' | 'COMPLETED'>('ALL');
  
  // Active workflow state for selected task
  const [selectedTask, setSelectedTask] = useState<CommissioningRequest | null>(null);
  const [workflowStep, setWorkflowStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [showApiConfigModal, setShowApiConfigModal] = useState(false);
  const [simulatingPayment, setSimulatingPayment] = useState(false);

  // Requests actually assigned to this commissioner — a defensive filter
  // on top of the context's own per-user Firestore query, since `requests`
  // is cached under one browser-wide (not per-account) localStorage key
  // and could otherwise show a stale/different account's data for a
  // moment on a shared or multi-account test device.
  const myRequests = requests.filter(r => r.commissionerId === currentUser.id);

  // Filter tasks
  const pendingTasks = myRequests.filter(req => {
    // Match search query
    const matchSearch = req.documentTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        req.deponentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        req.certificateNumber.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchSearch) return false;

    if (filterStatus === 'PENDING') return req.status !== 'COMPLETED' && req.status !== 'CANCELLED';
    if (filterStatus === 'PAID') return req.paymentStatus === 'ESCROWED' || req.paymentStatus === 'RELEASED';
    if (filterStatus === 'COMPLETED') return req.status === 'COMPLETED';
    return true;
  });

  // Calculate summary counts
  const totalTasksCount = myRequests.length;
  const activePendingCount = myRequests.filter(r => r.status !== 'COMPLETED' && r.status !== 'CANCELLED').length;
  const totalEscrowedUGX = myRequests
    .filter(r => r.paymentStatus === 'ESCROWED' || r.paymentStatus === 'RELEASED')
    .reduce((sum, r) => sum + r.serviceFeeUGX, 0);

  const currentHour = new Date().getHours();
  const timeGreeting = currentHour < 12 ? 'Good morning' : (currentHour < 17 ? 'Good afternoon' : 'Good evening');

  // Helper to open the workflow for a specific request
  const handleOpenWorkflow = (task: CommissioningRequest, initialStep: 1 | 2 | 3 | 4 | 5 = 1) => {
    setSelectedTask(task);
    setWorkflowStep(initialStep);
    setActiveCommissioningId(task.id);
  };

  // Helper to simulate instant deponent mobile money payment if task is unpaid
  const handleSimulateDeponentPayment = async (task: CommissioningRequest) => {
    setSimulatingPayment(true);
    try {
      await executePayment({
        serviceFeeUGX: task.serviceFeeUGX,
        provider: 'MTN_MOMO',
        phoneNumber: task.deponentPhone || '+256772000000',
        commissioningId: task.id,
        purpose: 'COMMISSIONING_ESCROW'
      });

      updateCommissioningRequest(task.id, {
        paymentStatus: 'ESCROWED',
        paymentMethod: 'MTN_MOMO',
        paymentReference: `MTN-UG-${Math.floor(10000000 + Math.random() * 90000000)}`,
        status: 'PAID'
      }, {
        eventType: 'PAYMENT_ESCROWED',
        details: `Deponent confirmed payment of UGX ${task.totalAmountUGX.toLocaleString()} via MTN Mobile Money.`
      });

      // Update selected task in state
      setSelectedTask(prev => prev ? {
        ...prev,
        paymentStatus: 'ESCROWED',
        paymentMethod: 'MTN_MOMO',
        status: 'PAID'
      } : null);

      addNotification(
        'Payment Escrow Confirmed',
        `UGX ${task.totalAmountUGX.toLocaleString()} received via MTN MoMo for ${task.documentTitle}.`,
        'PAYMENT'
      );
    } catch (e) {
      console.error(e);
    } finally {
      setSimulatingPayment(false);
    }
  };

  // Enter the live video commissioning room
  const handleEnterCommissioningRoom = (task: CommissioningRequest) => {
    if (task.paymentStatus !== 'ESCROWED' && task.paymentStatus !== 'RELEASED') {
      alert('Statutory Rule: Payment must be completed and escrowed before initiating the video oath room.');
      return;
    }
    setActiveCommissioningId(task.id);
    setCurrentView('room');
  };

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto" id="commissioner-dashboard-root">
      
      {/* Top Professional Header Bar */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-800">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono-code font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              {(currentUser.role || 'COMMISSIONER').replace(/_/g, ' ').toUpperCase()} • {currentUser.stationCity || 'UGANDA'}
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono-code font-bold border flex items-center gap-1.5 ${
              currentUser.admissionStatus === 'ADMITTED'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
            }`}>
              <UserCheck className="w-3.5 h-3.5" />
              {currentUser.admissionStatus === 'ADMITTED' ? 'ADMITTED' : 'ADMISSION PENDING'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-display-legal font-bold tracking-tight text-white">
            {timeGreeting}, {currentUser.fullName || 'Commissioner'}
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Manage incoming affidavits, verify exhibits/annexures, inspect escrow payments, and administer lawful video oath ceremonies.
          </p>
        </div>

        {/* Top Quick Actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => {
              const el = document.getElementById('commissioner-requests-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            id="btn-cfo-view-requests"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>View Requests</span>
          </button>

          <button
            onClick={() => {
              const btn = document.getElementById('btn-open-user-profile-modal');
              if (btn) btn.click();
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            id="btn-cfo-my-profile"
          >
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span>My Profile</span>
          </button>

          <button
            onClick={() => {
              const btn = document.getElementById('btn-open-user-profile-modal');
              if (btn) btn.click();
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            id="btn-cfo-stamp-catalogue"
          >
            <Stamp className="w-3.5 h-3.5 text-emerald-400" />
            <span>My Stamp Catalogue</span>
          </button>

          <button
            onClick={() => setCurrentView('wallet')}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            id="btn-cfo-my-ledger"
          >
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span>My Ledger</span>
          </button>

          <button
            onClick={() => setShowApiConfigModal(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
            id="btn-configure-api-keys"
            title="Configure video and mobile money gateway credentials"
          >
            <Key className="w-4 h-4 text-amber-400" />
            <span>API & Gateway Secrets</span>
          </button>
        </div>
      </div>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 leading-tight">{activePendingCount}</div>
            <div className="text-xs text-slate-500 font-medium">Pending Tasks</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 leading-tight">UGX {totalEscrowedUGX.toLocaleString()}</div>
            <div className="text-xs text-slate-500 font-medium">Escrowed Fee Balance</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 leading-tight">
              {myRequests.filter(r => r.status === 'COMPLETED').length}
            </div>
            <div className="text-xs text-slate-500 font-medium">Completed Oaths</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Wifi className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 leading-tight flex items-center gap-1.5">
              <span>ONLINE</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="text-xs text-slate-500 font-medium">Chambers Video Presence</div>
          </div>
        </div>
      </div>

      {/* Main Section: Pending Tasks & Filter Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden" id="commissioner-requests-section">
        
        {/* Header & Filter Controls */}
        <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <h2 className="font-display-legal font-bold text-lg text-slate-900">
              Pending Commissioning Tasks
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select any pending request below to activate the statutory 5-step commissioning workflow.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search deponent, cert, or title..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                id="input-search-tasks"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center rounded-xl bg-white border border-slate-300 p-0.5 text-xs">
              <button
                onClick={() => setFilterStatus('ALL')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                  filterStatus === 'ALL' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterStatus('PENDING')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                  filterStatus === 'PENDING' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Active Tasks
              </button>
              <button
                onClick={() => setFilterStatus('PAID')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                  filterStatus === 'PAID' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Paid (Escrow)
              </button>
              <button
                onClick={() => setFilterStatus('COMPLETED')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                  filterStatus === 'COMPLETED' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Completed
              </button>
            </div>
          </div>
        </div>

        {/* Task Cards List */}
        {pendingTasks.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-bold text-sm text-slate-700">No matching commissioning tasks found</p>
            <p className="text-xs text-slate-400">All sworn affidavits and statutory declarations are up to date.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {pendingTasks.map((task) => {
              const isPaid = task.paymentStatus === 'ESCROWED' || task.paymentStatus === 'RELEASED';
              const isCompleted = task.status === 'COMPLETED';
              const hasAnnexures = (task.annexures && task.annexures.length > 0) || task.hasAnnexures;
              const annexureCount = task.annexures ? task.annexures.length : (task.hasAnnexures ? 2 : 0);

              // Simulated real-time online status check for deponent
              const isDeponentOnline = task.id === 'req-002' || task.status === 'ACCEPTED' || task.status === 'PAID';

              return (
                <div 
                  key={task.id}
                  className={`p-5 hover:bg-slate-50/80 transition-colors flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 ${
                    selectedTask?.id === task.id ? 'bg-blue-50/50 border-l-4 border-blue-600' : ''
                  }`}
                  id={`commissioner-task-row-${task.id}`}
                >
                  {/* Left Task Information */}
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-mono-code font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                        {task.certificateNumber}
                      </span>

                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                        {(task.documentType || '').replace('_', ' ')}
                      </span>

                      {/* Payment Status Pill */}
                      {isPaid ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          PAID: UGX {task.totalAmountUGX.toLocaleString()} (ESCROWED)
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          UNPAID (UGX {task.totalAmountUGX.toLocaleString()})
                        </span>
                      )}

                      {/* Annexure Pill */}
                      {hasAnnexures ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                          <Layers className="w-3 h-3 text-purple-600" />
                          {annexureCount} Exhibits / Annexures
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">
                          Single Document (No Annexures)
                        </span>
                      )}

                      {/* Deponent Online Status */}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1.5 ${
                        isDeponentOnline 
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${isDeponentOnline ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`} />
                        {isDeponentOnline ? 'Deponent Online & Waiting' : 'Deponent Offline'}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm sm:text-base text-slate-900 leading-snug">
                      {task.documentTitle}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                      <div>
                        Deponent: <strong className="text-slate-900">{task.deponentName}</strong> 
                        <span className="font-mono-code text-[11px] text-slate-500 ml-1">(NIN: {task.deponentNin})</span>
                      </div>
                      <div className="text-slate-400">•</div>
                      <div>
                        File: <span className="font-mono-code text-slate-700">{task.fileName}</span> ({task.fileSizeKb} KB)
                      </div>
                      <div className="text-slate-400">•</div>
                      <div className="text-slate-500">
                        {new Date(task.createdAt).toLocaleDateString()} at {new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  {/* Right Action Trigger */}
                  <div className="flex items-center gap-2 w-full lg:w-auto justify-end shrink-0 pt-2 lg:pt-0">
                    <button
                      onClick={() => handleOpenWorkflow(task, 1)}
                      className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer whitespace-nowrap"
                      id={`btn-activate-workflow-${task.id}`}
                    >
                      <Sparkles className="w-4 h-4 text-blue-200" />
                      <span>Activate Commissioning Workflow</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: 5-STEP GUIDED COMMISSIONING WORKFLOW STUDIO */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-fadeIn overflow-y-auto" id="commissioning-workflow-modal">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-scaleUp m-auto">
            
            {/* Modal Top Header */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold">
                  {workflowStep}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display-legal font-bold text-base sm:text-lg text-white">
                      Statutory Commissioning Workflow
                    </h2>
                    <span className="text-[10px] font-mono-code font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {selectedTask.certificateNumber}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Deponent: <strong className="text-slate-200">{selectedTask.deponentName}</strong> (NIN: {selectedTask.deponentNin})
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedTask(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close Workflow"
                id="btn-close-workflow-modal"
              >
                ✕
              </button>
            </div>

            {/* 5-Step Workflow Bar */}
            <div className="bg-slate-100 border-b border-slate-200 p-2 sm:px-6 overflow-x-auto shrink-0">
              <div className="flex items-center justify-between min-w-[600px] gap-2">
                {[
                  { step: 1, title: '1. View Document', icon: FileText },
                  { step: 2, title: '2. Check Annexures', icon: Layers },
                  { step: 3, title: '3. View Payments', icon: DollarSign },
                  { step: 4, title: '4. Deponent Online?', icon: Wifi },
                  { step: 5, title: '5. Initiate Video Call', icon: Video }
                ].map((item) => (
                  <button
                    key={item.step}
                    onClick={() => setWorkflowStep(item.step as any)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      workflowStep === item.step
                        ? 'bg-blue-600 text-white shadow-xs'
                        : workflowStep > item.step
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'text-slate-600 hover:bg-slate-200'
                    }`}
                    id={`workflow-nav-step-${item.step}`}
                  >
                    <item.icon className={`w-3.5 h-3.5 ${workflowStep === item.step ? 'text-white' : ''}`} />
                    <span>{item.title}</span>
                    {workflowStep > item.step && <CheckCircle className="w-3 h-3 text-emerald-600 ml-0.5" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Step Body Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              
              {/* STEP 1: VIEW DOCUMENT */}
              {workflowStep === 1 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-blue-950 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        Step 1: Instrument & Statutory Document Inspection
                      </h4>
                      <p className="text-xs text-blue-800 leading-relaxed">
                        Verify the original instrument uploaded by the deponent. Check for integrity hash consistency and statutory form compliance before proceeding.
                      </p>
                    </div>
                    <span className="text-[10px] font-mono-code font-bold px-2 py-1 rounded bg-white text-blue-700 border border-blue-200 shrink-0">
                      SHA-256 VALID
                    </span>
                  </div>

                  <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-slate-500 font-medium">Document Title:</span>
                        <div className="font-bold text-slate-900 text-sm mt-0.5">{selectedTask.documentTitle}</div>
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium">Statutory Instrument Type:</span>
                        <div className="font-bold text-slate-900 text-sm uppercase mt-0.5">
                          {(selectedTask.documentType || '').replace('_', ' ')}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium">Original File Name & Size:</span>
                        <div className="font-mono-code text-slate-800 font-semibold mt-0.5">
                          {selectedTask.fileName} ({selectedTask.fileSizeKb} KB)
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium">Deponent Full Legal Name:</span>
                        <div className="font-bold text-slate-900 mt-0.5">
                          {selectedTask.deponentName} • NIN: <span className="font-mono-code text-blue-700">{selectedTask.deponentNin}</span>
                        </div>
                      </div>
                    </div>

                    {/* Cryptographic SHA-256 Digest Stamp */}
                    <div className="p-3 rounded-xl bg-slate-900 text-slate-200 text-xs font-mono-code space-y-1">
                      <div className="flex items-center justify-between text-slate-400 text-[10px]">
                        <span className="flex items-center gap-1">
                          <Lock className="w-3 h-3 text-emerald-400" />
                          CRYPTOGRAPHIC INTEGRITY DIGEST
                        </span>
                        <span className="text-emerald-400 font-bold">TAMPER-EVIDENT</span>
                      </div>
                      <div className="text-[11px] text-amber-300 break-all">
                        {selectedTask.documentSha256}
                      </div>
                    </div>

                    {/* Statutory Statement Text Sample */}
                    <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span>Deponent Declaratory Statement (Text Preview):</span>
                        <span className="text-[10px] text-slate-400 font-normal">Page 1 of 2</span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed italic bg-slate-50 p-3 rounded-lg border border-slate-100">
                        "{selectedTask.statutoryWordingUsed}"
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: CHECK ANNEXURES */}
              {workflowStep === 2 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-200 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-purple-950 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-purple-600" />
                        Step 2: Check & Verify Attached Exhibits / Annexures
                      </h4>
                      <p className="text-xs text-purple-800 leading-relaxed">
                        Pursuant to Section 5 of the Commissioners for Oaths Act, all attached exhibits (annextures) must be individually identified and verified.
                      </p>
                    </div>
                  </div>

                  {selectedTask.annexures && selectedTask.annexures.length > 0 ? (
                    <div className="space-y-3">
                      {selectedTask.annexures.map((annexure: AnnexureItem, idx: number) => (
                        <div key={annexure.id || idx} className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm">
                              {annexure.identifier || `EX-${idx + 1}`}
                            </div>
                            <div>
                              <div className="font-bold text-xs text-slate-900">{annexure.title || annexure.fileName}</div>
                              <div className="text-[11px] text-slate-500 font-mono-code">
                                SHA-256: {annexure.sha256 ? `${annexure.sha256.slice(0, 16)}...` : '7f83b165...'} • {annexure.fileSize || '140 KB'}
                              </div>
                            </div>
                          </div>

                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Exhibit Verified
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50 text-center space-y-2">
                      <Layers className="w-8 h-8 text-slate-400 mx-auto" />
                      <p className="font-bold text-xs text-slate-800">No Annexures Attached</p>
                      <p className="text-xs text-slate-500">
                        This is a standalone statutory affidavit without secondary documentary exhibits.
                      </p>
                    </div>
                  )}

                  <div className="p-3 rounded-xl bg-slate-100 text-slate-700 text-xs flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Statutory exhibit stamping and jurat attachment are automated upon ceremony completion.</span>
                  </div>
                </div>
              )}

              {/* STEP 3: VIEW PAYMENTS */}
              {workflowStep === 3 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-emerald-950 flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-emerald-600" />
                        Step 3: Escrow Payment Verification & Breakdown
                      </h4>
                      <p className="text-xs text-emerald-800 leading-relaxed">
                        Verify that client payment has been confirmed via MTN Mobile Money or Airtel Money OpenAPI. Video calls cannot proceed unless fees are safely escrowed.
                      </p>
                    </div>

                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${
                      selectedTask.paymentStatus === 'ESCROWED' || selectedTask.paymentStatus === 'RELEASED'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-amber-100 text-amber-900 border-amber-300'
                    }`}>
                      {selectedTask.paymentStatus === 'ESCROWED' ? 'FUNDS IN ESCROW' : selectedTask.paymentStatus}
                    </span>
                  </div>

                  {/* Payment Breakdown Card */}
                  <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-xs">
                    <div className="divide-y divide-slate-100 text-xs">
                      <div className="py-2.5 flex items-center justify-between">
                        <span className="text-slate-600">Commissioner Professional Fee:</span>
                        <strong className="text-slate-900">UGX {selectedTask.serviceFeeUGX.toLocaleString()}</strong>
                      </div>
                      <div className="py-2.5 flex items-center justify-between">
                        <span className="text-slate-600">Exhibit Examination & Stamping:</span>
                        <strong className="text-slate-900">UGX 0 (Included)</strong>
                      </div>
                      <div className="py-2.5 flex items-center justify-between">
                        <span className="text-slate-600">Platform & Telecommunications Fee (5%):</span>
                        <strong className="text-slate-900">UGX {selectedTask.platformFeeUGX.toLocaleString()}</strong>
                      </div>
                      <div className="py-3 flex items-center justify-between text-sm font-bold bg-slate-50 px-3 rounded-xl border border-slate-200 mt-2">
                        <span className="text-slate-900">Total Paid Amount:</span>
                        <span className="text-emerald-700">UGX {selectedTask.totalAmountUGX.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Payment Gateway Transaction Data */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-blue-600" />
                        <div>
                          <span className="text-slate-500">Provider: </span>
                          <strong className="text-slate-800">{selectedTask.paymentMethod || 'MTN_MOMO'}</strong>
                        </div>
                      </div>

                      <div>
                        <span className="text-slate-500">Gateway Ref: </span>
                        <strong className="font-mono-code text-blue-700">{selectedTask.paymentReference || 'MTN-UG-9918234'}</strong>
                      </div>

                      <div className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Escrow Verified
                      </div>
                    </div>

                    {/* Unpaid Warning & Quick Resolution Trigger */}
                    {selectedTask.paymentStatus !== 'ESCROWED' && selectedTask.paymentStatus !== 'RELEASED' && (
                      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-3">
                        <div className="flex items-center gap-2 text-amber-900 text-xs font-bold">
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                          Payment is currently UNPAID
                        </div>
                        <p className="text-xs text-amber-800">
                          The deponent must complete the MTN MoMo or Airtel Money payment prompt before the video commissioning room can be unlocked.
                        </p>
                        <button
                          type="button"
                          onClick={() => handleSimulateDeponentPayment(selectedTask)}
                          disabled={simulatingPayment}
                          className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                          id="btn-simulate-deponent-payment"
                        >
                          <Smartphone className="w-3.5 h-3.5" />
                          {simulatingPayment ? 'Processing MoMo Escrow...' : 'Simulate Client MTN MoMo Payment'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 4: VIEW WHETHER DEPONENT IS ONLINE */}
              {workflowStep === 4 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-white flex items-center gap-2">
                        <Wifi className="w-4 h-4 text-emerald-400" />
                        Step 4: Deponent Real-Time Presence & Identity Check
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Confirm that the deponent is connected to the network, has their National ID ready, and has their camera & microphone enabled.
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      DEPONENT ONLINE
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-4">
                    <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-base">
                        {selectedTask.deponentName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="space-y-0.5">
                        <div className="font-bold text-sm text-slate-900">{selectedTask.deponentName}</div>
                        <div className="text-xs text-slate-600 flex items-center gap-2">
                          <span>Phone: <strong>{selectedTask.deponentPhone}</strong></span>
                          <span>•</span>
                          <span>NIN: <strong className="font-mono-code text-blue-700">{selectedTask.deponentNin}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Readiness Checklist */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs">
                        <span className="font-semibold text-emerald-950 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                          WebRTC Media Stream (Camera & Mic Permissions)
                        </span>
                        <span className="font-mono-code text-[11px] font-bold text-emerald-700">READY</span>
                      </div>

                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs">
                        <span className="font-semibold text-emerald-950 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                          NIRA National ID Card Verification
                        </span>
                        <span className="font-mono-code text-[11px] font-bold text-emerald-700">VERIFIED</span>
                      </div>

                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs">
                        <span className="font-semibold text-emerald-950 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                          Solemnisation Book Selection
                        </span>
                        <span className="font-mono-code text-[11px] font-bold text-blue-700">
                          {selectedTask.solemnisationType === 'holy_bible' ? 'Holy Bible' : 'Affirmation'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: INITIATE VIDEO CALL */}
              {workflowStep === 5 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="p-4 rounded-2xl bg-blue-900 text-white flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-white flex items-center gap-2">
                        <Video className="w-4 h-4 text-amber-400" />
                        Step 5: Initiate Video Commissioning Room
                      </h4>
                      <p className="text-xs text-blue-200 leading-relaxed">
                        Start the end-to-end encrypted video room. Both commissioner and deponent will join the room with camera feeds and statutory jurat tools.
                      </p>
                    </div>
                  </div>

                  {/* Payment Gate Enforcement */}
                  {selectedTask.paymentStatus !== 'ESCROWED' && selectedTask.paymentStatus !== 'RELEASED' ? (
                    <div className="p-6 rounded-2xl border-2 border-red-300 bg-red-50 text-center space-y-3">
                      <AlertCircle className="w-10 h-10 text-red-600 mx-auto" />
                      <h4 className="font-bold text-sm text-red-950">Video Call Locked: Payment Required</h4>
                      <p className="text-xs text-red-800 max-w-md mx-auto leading-relaxed">
                        In accordance with Uganda legal commissioning rules, no video call may be initiated until the commissioning fee has been confirmed in escrow.
                      </p>
                      <button
                        type="button"
                        onClick={() => handleSimulateDeponentPayment(selectedTask)}
                        className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold inline-flex items-center gap-2 transition-colors cursor-pointer"
                        id="btn-gate-resolve-payment"
                      >
                        <Smartphone className="w-4 h-4" />
                        Complete MTN MoMo Escrow Payment
                      </button>
                    </div>
                  ) : (
                    <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50 text-center space-y-4">
                      <div className="w-16 h-16 rounded-3xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-xl animate-pulse">
                        <Video className="w-8 h-8" />
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-bold text-base text-slate-900">
                          Ready to Enter Commissioning Room
                        </h4>
                        <p className="text-xs text-slate-600 max-w-md mx-auto">
                          Clicking below will start the secure session for <strong>{selectedTask.deponentName}</strong>. 
                          If the deponent has not entered yet, the room will display the waiting screen.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleEnterCommissioningRoom(selectedTask)}
                        className="px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold inline-flex items-center gap-2.5 shadow-lg shadow-blue-600/30 transition-all cursor-pointer transform hover:-translate-y-0.5"
                        id="btn-enter-commissioning-room-action"
                      >
                        <Video className="w-5 h-5 text-amber-300" />
                        <span>Enter Commissioning Room</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Modal Bottom Footer Navigation */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setWorkflowStep(prev => (prev > 1 ? (prev - 1) as any : 1))}
                disabled={workflowStep === 1}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200 text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                id="btn-workflow-prev"
              >
                ← Previous Step
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">
                  Step {workflowStep} of 5
                </span>

                {workflowStep < 5 ? (
                  <button
                    type="button"
                    onClick={() => setWorkflowStep(prev => (prev < 5 ? (prev + 1) as any : 5))}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    id="btn-workflow-next"
                  >
                    <span>Next Step</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleEnterCommissioningRoom(selectedTask)}
                    disabled={selectedTask.paymentStatus !== 'ESCROWED' && selectedTask.paymentStatus !== 'RELEASED'}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    id="btn-workflow-finish-enter-room"
                  >
                    <Video className="w-4 h-4" />
                    <span>Enter Room Now</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* API Configuration Modal */}
      <ApiGatewayConfigModal
        isOpen={showApiConfigModal}
        onClose={() => setShowApiConfigModal(false)}
      />

    </div>
  );
};
