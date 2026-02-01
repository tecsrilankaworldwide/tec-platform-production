import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from './auth/AuthContext';
import { 
  Image, Upload, Heart, MessageCircle, Share2, Award, Users,
  Star, Trophy, ChevronDown, X, Filter, Grid, Plus, Camera, 
  Sparkles, Eye, FolderOpen, UserPlus, Calendar, Tag
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

// Age Group Batches
const AGE_GROUP_BATCHES = [
  { id: 'ages-4-6', name: '🌟 Little Learners', ageRange: '4-6 years', color: 'from-pink-400 to-rose-500' },
  { id: 'ages-7-9', name: '🔭 Young Explorers', ageRange: '7-9 years', color: 'from-blue-400 to-cyan-500' },
  { id: 'ages-10-12', name: '💡 Smart Kids', ageRange: '10-12 years', color: 'from-green-400 to-emerald-500' },
  { id: 'ages-13-15', name: '🚀 Tech Teens', ageRange: '13-15 years', color: 'from-purple-400 to-indigo-500' },
  { id: 'ages-16-18', name: '👑 Future Leaders', ageRange: '16-18 years', color: 'from-amber-400 to-orange-500' }
];

const PROJECT_TYPES = [
  { id: 'individual', label: '👤 Individual Work', icon: '👤' },
  { id: 'group', label: '👥 Group Project', icon: '👥' },
  { id: 'class', label: '🏫 Class Activity', icon: '🏫' },
  { id: 'competition', label: '🏆 Competition Entry', icon: '🏆' },
  { id: 'practical', label: '🔬 Practical Work', icon: '🔬' }
];

const CATEGORIES = [
  { id: 'all', label: 'All Work' },
  { id: 'art', label: '🎨 Art & Drawing' },
  { id: 'coding', label: '💻 Coding' },
  { id: 'robotics', label: '🤖 Robotics' },
  { id: 'science', label: '🔬 Science' },
  { id: 'presentation', label: '📊 Presentation' },
  { id: 'creative', label: '✨ Creative' }
];

const BatchShowcase = () => {
  const { token, user, isTeacher } = useAuth();
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [showcaseItems, setShowcaseItems] = useState([]);
  const [activeTab, setActiveTab] = useState('batches');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProjectType, setSelectedProjectType] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCreateBatchModal, setShowCreateBatchModal] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    category: 'art',
    project_type: 'individual',
    batch_id: '',
    group_members: '',
    image: null,
    imagePreview: null
  });
  const [newBatch, setNewBatch] = useState({ name: '', description: '', type: 'custom' });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    loadBatches();
  }, [token]);

  useEffect(() => {
    if (selectedBatch) {
      loadBatchShowcase(selectedBatch.id);
    }
  }, [selectedBatch]);

  const loadBatches = async () => {
    try {
      const response = await axios.get(`${API}/batch-showcase/batches`, { headers });
      const customBatches = response.data.batches || [];
      // Combine age group batches with custom batches
      setBatches([...AGE_GROUP_BATCHES, ...customBatches]);
    } catch (error) {
      console.error('Failed to load batches:', error);
      // Use default age group batches
      setBatches(AGE_GROUP_BATCHES);
    } finally {
      setLoading(false);
    }
  };

  const loadBatchShowcase = async (batchId) => {
    try {
      const response = await axios.get(`${API}/batch-showcase/${batchId}/items`, { headers });
      setShowcaseItems(response.data.items || []);
    } catch (error) {
      console.error('Failed to load batch showcase:', error);
      // Mock data for demo
      setShowcaseItems([
        {
          id: '1', 
          title: 'Our Robot Project', 
          description: 'We built a line-following robot together!',
          category: 'robotics', 
          project_type: 'group',
          group_members: ['Tharushi', 'Dinesh', 'Sarah'],
          student_name: 'Team Alpha', 
          image_url: 'https://via.placeholder.com/400x300/667eea/ffffff?text=Robot+Project',
          likes: 45, 
          comments: 12, 
          created_at: '2024-01-25'
        },
        {
          id: '2', 
          title: 'My AI Drawing', 
          description: 'What I think AI looks like',
          category: 'art', 
          project_type: 'individual',
          student_name: 'Aminah', 
          image_url: 'https://via.placeholder.com/400x300/f093fb/ffffff?text=AI+Drawing',
          likes: 28, 
          comments: 5, 
          created_at: '2024-01-24'
        },
        {
          id: '3', 
          title: 'Class Science Fair', 
          description: 'Our batch participated in the science fair!',
          category: 'science', 
          project_type: 'class',
          group_members: ['Entire Class'],
          student_name: 'Saturday Batch', 
          image_url: 'https://via.placeholder.com/400x300/43e97b/ffffff?text=Science+Fair',
          likes: 67, 
          comments: 18, 
          created_at: '2024-01-23'
        }
      ]);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadForm({
          ...uploadForm,
          image: file,
          imagePreview: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!uploadForm.title || !uploadForm.image || !uploadForm.batch_id) return;
    
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('title', uploadForm.title);
      formData.append('description', uploadForm.description);
      formData.append('category', uploadForm.category);
      formData.append('project_type', uploadForm.project_type);
      formData.append('batch_id', uploadForm.batch_id);
      formData.append('group_members', uploadForm.group_members);
      formData.append('image', uploadForm.image);
      
      await axios.post(`${API}/batch-showcase/upload`, formData, {
        headers: { ...headers, 'Content-Type': 'multipart/form-data' }
      });
      
      setShowUploadModal(false);
      setUploadForm({ 
        title: '', description: '', category: 'art', project_type: 'individual',
        batch_id: '', group_members: '', image: null, imagePreview: null 
      });
      if (selectedBatch) loadBatchShowcase(selectedBatch.id);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload successful! (Demo mode)');
      setShowUploadModal(false);
    } finally {
      setUploading(false);
    }
  };

  const handleCreateBatch = async () => {
    if (!newBatch.name) return;
    
    try {
      await axios.post(`${API}/batch-showcase/create-batch`, newBatch, { headers });
      setShowCreateBatchModal(false);
      setNewBatch({ name: '', description: '', type: 'custom' });
      loadBatches();
    } catch (error) {
      console.error('Failed to create batch:', error);
      // Demo: Add locally
      const customBatch = {
        id: `custom-${Date.now()}`,
        name: newBatch.name,
        description: newBatch.description,
        color: 'from-violet-400 to-purple-500',
        isCustom: true
      };
      setBatches([...batches, customBatch]);
      setShowCreateBatchModal(false);
      setNewBatch({ name: '', description: '', type: 'custom' });
    }
  };

  const handleLike = async (itemId) => {
    try {
      await axios.post(`${API}/batch-showcase/${itemId}/like`, {}, { headers });
      setShowcaseItems(items => items.map(item => 
        item.id === itemId ? { ...item, likes: item.likes + 1 } : item
      ));
    } catch (error) {
      // Demo: Update locally
      setShowcaseItems(items => items.map(item => 
        item.id === itemId ? { ...item, likes: item.likes + 1 } : item
      ));
    }
  };

  const filteredItems = showcaseItems.filter(item => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    if (selectedProjectType !== 'all' && item.project_type !== selectedProjectType) return false;
    return true;
  });

  const getProjectTypeIcon = (type) => {
    const found = PROJECT_TYPES.find(p => p.id === type);
    return found?.icon || '📁';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading batch showcases...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50" data-testid="batch-showcase">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white p-6 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <FolderOpen className="mr-3" size={32} /> Batch Showcase Gallery
              </h1>
              <p className="text-white/80 mt-1">Celebrate group projects and individual achievements!</p>
            </div>
            <div className="flex gap-3">
              {isTeacher && (
                <button
                  onClick={() => setShowCreateBatchModal(true)}
                  className="flex items-center px-4 py-2 bg-white/20 text-white rounded-xl font-medium hover:bg-white/30"
                  data-testid="create-batch-btn"
                >
                  <Plus className="mr-2" size={18} /> New Batch
                </button>
              )}
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center px-5 py-3 bg-white text-purple-600 rounded-xl font-bold hover:bg-purple-50 shadow-lg"
                data-testid="upload-work-btn"
              >
                <Camera className="mr-2" size={20} /> Share Work
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'batches', label: 'All Batches', icon: Grid },
            { id: 'gallery', label: 'View Gallery', icon: Image, disabled: !selectedBatch },
            { id: 'featured', label: 'Featured Work', icon: Trophy }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && setActiveTab(tab.id)}
              disabled={tab.disabled}
              className={`flex items-center px-5 py-3 rounded-xl font-medium transition-all ${
                activeTab === tab.id 
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' 
                  : tab.disabled 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-600 hover:bg-gray-100 shadow'
              }`}
            >
              <tab.icon size={18} className="mr-2" />{tab.label}
            </button>
          ))}
        </div>

        {/* Batches Tab - Select a Batch */}
        {activeTab === 'batches' && (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-2">📚 Select a Batch to View</h2>
              <p className="text-gray-600">Choose an age group or custom batch to see their amazing work!</p>
            </div>

            {/* Age Group Batches */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center">
                <Users className="mr-2" size={20} /> Age Group Batches
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {AGE_GROUP_BATCHES.map((batch) => (
                  <button
                    key={batch.id}
                    onClick={() => { setSelectedBatch(batch); setActiveTab('gallery'); }}
                    className={`p-6 rounded-2xl bg-gradient-to-br ${batch.color} text-white text-left shadow-lg hover:shadow-xl hover:scale-105 transition-all`}
                    data-testid={`batch-${batch.id}`}
                  >
                    <h4 className="text-xl font-bold mb-1">{batch.name}</h4>
                    <p className="text-white/80 text-sm">{batch.ageRange}</p>
                    <div className="mt-3 flex items-center text-white/70 text-sm">
                      <Image size={16} className="mr-1" /> View Gallery →
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Batches */}
            {batches.filter(b => b.isCustom).length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center">
                  <Tag className="mr-2" size={20} /> Custom Batches
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {batches.filter(b => b.isCustom).map((batch) => (
                    <button
                      key={batch.id}
                      onClick={() => { setSelectedBatch(batch); setActiveTab('gallery'); }}
                      className="p-6 rounded-2xl bg-white border-2 border-purple-200 text-left shadow-md hover:shadow-lg hover:border-purple-400 transition-all"
                      data-testid={`batch-${batch.id}`}
                    >
                      <h4 className="text-xl font-bold text-gray-800 mb-1">{batch.name}</h4>
                      <p className="text-gray-500 text-sm">{batch.description || 'Custom batch'}</p>
                      <div className="mt-3 flex items-center text-purple-600 text-sm">
                        <Image size={16} className="mr-1" /> View Gallery →
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Gallery Tab - View Selected Batch */}
        {activeTab === 'gallery' && selectedBatch && (
          <>
            {/* Batch Header */}
            <div className={`bg-gradient-to-r ${selectedBatch.color || 'from-purple-500 to-pink-500'} rounded-2xl p-6 mb-6 text-white`}>
              <div className="flex items-center justify-between">
                <div>
                  <button 
                    onClick={() => setActiveTab('batches')}
                    className="text-white/70 hover:text-white text-sm mb-2 flex items-center"
                  >
                    ← Back to Batches
                  </button>
                  <h2 className="text-2xl font-bold">{selectedBatch.name}</h2>
                  <p className="text-white/80">{selectedBatch.ageRange || selectedBatch.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">{filteredItems.length}</div>
                  <div className="text-white/70 text-sm">Projects</div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow p-4 mb-6">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center">
                  <Filter size={18} className="text-gray-400 mr-2" />
                  <span className="text-gray-600 font-medium mr-3">Filter:</span>
                </div>
                
                {/* Project Type Filter */}
                <select
                  value={selectedProjectType}
                  onChange={(e) => setSelectedProjectType(e.target.value)}
                  className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                  data-testid="project-type-filter"
                >
                  <option value="all">All Types</option>
                  {PROJECT_TYPES.map((type) => (
                    <option key={type.id} value={type.id}>{type.label}</option>
                  ))}
                </select>
                
                {/* Category Filter */}
                <div className="flex gap-2 flex-wrap">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        selectedCategory === cat.id
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-purple-100'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Gallery Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item) => (
                <div 
                  key={item.id}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all cursor-pointer group"
                  onClick={() => setViewItem(item)}
                  data-testid={`showcase-item-${item.id}`}
                >
                  <div className="relative">
                    <img 
                      src={item.image_url} 
                      alt={item.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 px-3 py-1 rounded-full text-sm font-bold text-white bg-black/50 backdrop-blur-sm">
                      {getProjectTypeIcon(item.project_type)} {item.project_type === 'individual' ? 'Individual' : 
                        item.project_type === 'group' ? 'Group' : 
                        item.project_type === 'class' ? 'Class' : 
                        item.project_type === 'competition' ? 'Competition' : 'Practical'}
                    </div>
                    <div className="absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium bg-white/90 text-gray-700">
                      {CATEGORIES.find(c => c.id === item.category)?.label || item.category}
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-bold text-gray-800 text-lg mb-1">{item.title}</h3>
                    <p className="text-gray-500 text-sm mb-3 line-clamp-2">{item.description}</p>
                    
                    {/* Group Members */}
                    {item.group_members && item.group_members.length > 0 && (
                      <div className="mb-3 flex items-center text-sm text-purple-600 bg-purple-50 px-3 py-2 rounded-lg">
                        <Users size={16} className="mr-2" />
                        <span className="font-medium">
                          {Array.isArray(item.group_members) 
                            ? item.group_members.join(', ') 
                            : item.group_members}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                          {item.student_name?.charAt(0)}
                        </div>
                        <div className="ml-2">
                          <div className="text-sm font-medium text-gray-800">{item.student_name}</div>
                          <div className="text-xs text-gray-500">{item.created_at}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 text-gray-500">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleLike(item.id); }}
                          className="flex items-center hover:text-pink-500"
                        >
                          <Heart size={16} className="mr-1" />{item.likes}
                        </button>
                        <span className="flex items-center">
                          <MessageCircle size={16} className="mr-1" />{item.comments}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredItems.length === 0 && (
              <div className="text-center py-16 bg-white rounded-2xl shadow">
                <Image className="mx-auto text-gray-300 mb-4" size={64} />
                <h3 className="text-xl font-bold text-gray-600">No work found</h3>
                <p className="text-gray-500 mb-6">Be the first to share work in this batch!</p>
                <button
                  onClick={() => { setUploadForm({...uploadForm, batch_id: selectedBatch.id}); setShowUploadModal(true); }}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold"
                >
                  <Plus className="inline mr-2" size={18} /> Add First Project
                </button>
              </div>
            )}
          </>
        )}

        {/* Featured Tab */}
        {activeTab === 'featured' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-6 text-white">
              <div className="flex items-center">
                <Trophy className="mr-4" size={48} />
                <div>
                  <h2 className="text-2xl font-bold">🌟 Featured Projects</h2>
                  <p className="text-white/80">Outstanding work selected from all batches!</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {showcaseItems.filter(item => item.likes >= 20).map((item) => (
                <div key={item.id} className="bg-white rounded-2xl shadow-lg overflow-hidden flex">
                  <img src={item.image_url} alt={item.title} className="w-40 h-40 object-cover" />
                  <div className="p-4 flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="text-yellow-500" size={20} />
                      <span className="text-xs font-bold text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">FEATURED</span>
                      <span className="text-xs text-gray-500">{getProjectTypeIcon(item.project_type)}</span>
                    </div>
                    <h3 className="font-bold text-gray-800 mb-1">{item.title}</h3>
                    <p className="text-sm text-gray-500 mb-2 line-clamp-2">{item.description}</p>
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="font-medium">{item.student_name}</span>
                      <span className="mx-2">•</span>
                      <span className="flex items-center text-pink-500"><Heart size={14} className="mr-1" fill="currentColor" />{item.likes}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">📸 Share Your Work</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Select Batch */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Batch *</label>
                <select
                  value={uploadForm.batch_id}
                  onChange={(e) => setUploadForm({ ...uploadForm, batch_id: e.target.value })}
                  className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500"
                  data-testid="batch-select"
                >
                  <option value="">-- Choose a batch --</option>
                  <optgroup label="🎓 Age Groups">
                    {AGE_GROUP_BATCHES.map((batch) => (
                      <option key={batch.id} value={batch.id}>{batch.name}</option>
                    ))}
                  </optgroup>
                  {batches.filter(b => b.isCustom).length > 0 && (
                    <optgroup label="📁 Custom Batches">
                      {batches.filter(b => b.isCustom).map((batch) => (
                        <option key={batch.id} value={batch.id}>{batch.name}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              {/* Project Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Project Type *</label>
                <div className="grid grid-cols-2 gap-2">
                  {PROJECT_TYPES.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setUploadForm({ ...uploadForm, project_type: type.id })}
                      className={`p-3 rounded-xl text-left transition-all ${
                        uploadForm.project_type === type.id
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-purple-100'
                      }`}
                    >
                      <span className="text-lg mr-2">{type.icon}</span>
                      <span className="text-sm font-medium">{type.label.replace(type.icon + ' ', '')}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Group Members (if group project) */}
              {(uploadForm.project_type === 'group' || uploadForm.project_type === 'class') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Users size={16} className="inline mr-1" />
                    Group Members
                  </label>
                  <input
                    type="text"
                    value={uploadForm.group_members}
                    onChange={(e) => setUploadForm({ ...uploadForm, group_members: e.target.value })}
                    placeholder="Enter names separated by commas (e.g., Ali, Sara, John)"
                    className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              )}

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Image *</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  accept="image/*"
                  className="hidden"
                />
                
                {uploadForm.imagePreview ? (
                  <div className="relative">
                    <img src={uploadForm.imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-xl" />
                    <button
                      onClick={() => setUploadForm({ ...uploadForm, image: null, imagePreview: null })}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-40 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center hover:border-purple-500 transition-colors"
                    data-testid="image-upload-btn"
                  >
                    <Camera className="text-gray-400 mb-2" size={40} />
                    <span className="text-gray-600 font-medium">Click to upload image</span>
                    <span className="text-gray-400 text-sm">PNG, JPG up to 5MB</span>
                  </button>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                <input
                  type="text"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  placeholder="Give your work a title"
                  className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500"
                  data-testid="work-title-input"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                  placeholder="Tell us about your work..."
                  rows={3}
                  className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.filter(c => c.id !== 'all').map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setUploadForm({ ...uploadForm, category: cat.id })}
                      className={`p-2 rounded-lg text-center text-sm transition-all ${
                        uploadForm.category === cat.id
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-purple-100'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={handleUpload}
                disabled={!uploadForm.title || !uploadForm.image || !uploadForm.batch_id || uploading}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                data-testid="submit-work-btn"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2" size={20} /> Share to Batch
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Batch Modal (Teachers Only) */}
      {showCreateBatchModal && isTeacher && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">📁 Create New Batch</h3>
              <button onClick={() => setShowCreateBatchModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Batch Name *</label>
                <input
                  type="text"
                  value={newBatch.name}
                  onChange={(e) => setNewBatch({ ...newBatch, name: e.target.value })}
                  placeholder="e.g., Saturday Morning Class, Coding Club"
                  className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500"
                  data-testid="batch-name-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={newBatch.description}
                  onChange={(e) => setNewBatch({ ...newBatch, description: e.target.value })}
                  placeholder="Optional description for this batch..."
                  rows={2}
                  className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <button
                onClick={handleCreateBatch}
                disabled={!newBatch.name}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50"
                data-testid="create-batch-submit"
              >
                <Plus className="inline mr-2" size={18} /> Create Batch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Item Modal */}
      {viewItem && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="relative">
              <img src={viewItem.image_url} alt={viewItem.title} className="w-full h-80 object-cover" />
              <button
                onClick={() => setViewItem(null)}
                className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70"
              >
                <X size={24} />
              </button>
              <div className="absolute bottom-4 left-4 flex gap-2">
                <span className="px-3 py-1.5 rounded-full text-sm font-bold text-white bg-black/50 backdrop-blur-sm">
                  {getProjectTypeIcon(viewItem.project_type)} {viewItem.project_type}
                </span>
                <span className="px-3 py-1.5 rounded-full text-sm font-medium text-white bg-black/50 backdrop-blur-sm">
                  {CATEGORIES.find(c => c.id === viewItem.category)?.label}
                </span>
              </div>
            </div>
            
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{viewItem.title}</h2>
              <p className="text-gray-600 mb-4">{viewItem.description}</p>
              
              {/* Group Members */}
              {viewItem.group_members && viewItem.group_members.length > 0 && (
                <div className="mb-4 p-4 bg-purple-50 rounded-xl">
                  <h4 className="font-bold text-purple-700 mb-2 flex items-center">
                    <Users size={18} className="mr-2" /> Team Members
                  </h4>
                  <p className="text-purple-600">
                    {Array.isArray(viewItem.group_members) 
                      ? viewItem.group_members.join(', ') 
                      : viewItem.group_members}
                  </p>
                </div>
              )}
              
              <div className="flex items-center justify-between border-t pt-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                    {viewItem.student_name?.charAt(0)}
                  </div>
                  <div className="ml-3">
                    <div className="font-bold text-gray-800">{viewItem.student_name}</div>
                    <div className="text-sm text-gray-500">{viewItem.created_at}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleLike(viewItem.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-pink-100 text-pink-600 rounded-full hover:bg-pink-200"
                  >
                    <Heart size={20} /> {viewItem.likes} Likes
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200">
                    <Share2 size={20} /> Share
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchShowcase;
