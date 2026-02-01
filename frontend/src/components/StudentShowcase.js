import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from './auth/AuthContext';
import { 
  Image, Upload, Heart, MessageCircle, Share2, Award, 
  Star, Trophy, Medal, ChevronLeft, ChevronRight, X,
  Filter, Grid, List, Plus, Camera, Sparkles, Eye
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

const LEVEL_INFO = {
  1: { name: 'Beginner Explorer', icon: '🌱', color: 'from-green-400 to-emerald-500' },
  2: { name: 'Young Learner', icon: '🌿', color: 'from-teal-400 to-cyan-500' },
  3: { name: 'Knowledge Seeker', icon: '🧠', color: 'from-blue-400 to-indigo-500' },
  4: { name: 'Smart Thinker', icon: '💡', color: 'from-purple-400 to-pink-500' },
  5: { name: 'Rising Star', icon: '⭐', color: 'from-yellow-400 to-orange-500' },
  6: { name: 'Future Leader', icon: '🚀', color: 'from-red-400 to-rose-500' },
  7: { name: 'Master Explorer', icon: '👑', color: 'from-amber-400 to-yellow-500' }
};

const CATEGORIES = [
  { id: 'all', label: 'All Work', icon: Grid },
  { id: 'art', label: 'Art & Drawing', icon: Image },
  { id: 'project', label: 'Projects', icon: Sparkles },
  { id: 'coding', label: 'Coding', icon: Star },
  { id: 'writing', label: 'Creative Writing', icon: MessageCircle },
  { id: 'science', label: 'Science', icon: Trophy }
];

const StudentShowcase = () => {
  const { token, user } = useAuth();
  const [showcaseItems, setShowcaseItems] = useState([]);
  const [myItems, setMyItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('gallery');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    category: 'art',
    image: null,
    imagePreview: null
  });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    loadShowcaseItems();
    loadMyItems();
  }, [token]);

  const loadShowcaseItems = async () => {
    try {
      const response = await axios.get(`${API}/showcase/gallery`, { headers });
      setShowcaseItems(response.data.items || []);
    } catch (error) {
      console.error('Failed to load showcase:', error);
      // Mock data for demo
      setShowcaseItems([
        {
          id: '1', title: 'My First AI Drawing', description: 'I drew what AI looks like to me!',
          category: 'art', level: 1, student_name: 'Tharushi', student_index: 'SRI-F-1002',
          image_url: 'https://via.placeholder.com/400x300/667eea/ffffff?text=AI+Drawing',
          likes: 24, comments: 5, created_at: '2024-01-25'
        },
        {
          id: '2', title: 'Pattern Recognition Project', description: 'Found patterns in nature!',
          category: 'project', level: 2, student_name: 'Dinesh', student_index: 'IND-E-1001',
          image_url: 'https://via.placeholder.com/400x300/764ba2/ffffff?text=Patterns',
          likes: 18, comments: 3, created_at: '2024-01-24'
        },
        {
          id: '3', title: 'My Robot Friend Story', description: 'A story about my robot friend',
          category: 'writing', level: 1, student_name: 'Aminah', student_index: 'MAL-F-1001',
          image_url: 'https://via.placeholder.com/400x300/f093fb/ffffff?text=Story',
          likes: 31, comments: 8, created_at: '2024-01-23'
        },
        {
          id: '4', title: 'Simple Calculator Code', description: 'My first coding project!',
          category: 'coding', level: 3, student_name: 'Raj', student_index: 'IND-S-1001',
          image_url: 'https://via.placeholder.com/400x300/4facfe/ffffff?text=Code',
          likes: 42, comments: 12, created_at: '2024-01-22'
        },
        {
          id: '5', title: 'Science Experiment', description: 'Testing water filtration',
          category: 'science', level: 4, student_name: 'Sarah', student_index: 'UAE-T-1001',
          image_url: 'https://via.placeholder.com/400x300/43e97b/ffffff?text=Science',
          likes: 28, comments: 6, created_at: '2024-01-21'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadMyItems = async () => {
    try {
      const response = await axios.get(`${API}/showcase/my-work`, { headers });
      setMyItems(response.data.items || []);
    } catch (error) {
      console.error('Failed to load my items:', error);
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
    if (!uploadForm.title || !uploadForm.image) return;
    
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('title', uploadForm.title);
      formData.append('description', uploadForm.description);
      formData.append('category', uploadForm.category);
      formData.append('image', uploadForm.image);
      
      await axios.post(`${API}/showcase/upload`, formData, {
        headers: { ...headers, 'Content-Type': 'multipart/form-data' }
      });
      
      setShowUploadModal(false);
      setUploadForm({ title: '', description: '', category: 'art', image: null, imagePreview: null });
      loadMyItems();
      loadShowcaseItems();
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleLike = async (itemId) => {
    try {
      await axios.post(`${API}/showcase/${itemId}/like`, {}, { headers });
      setShowcaseItems(items => items.map(item => 
        item.id === itemId ? { ...item, likes: item.likes + 1 } : item
      ));
    } catch (error) {
      console.error('Failed to like:', error);
    }
  };

  const filteredItems = showcaseItems.filter(item => {
    if (selectedLevel !== 'all' && item.level !== parseInt(selectedLevel)) return false;
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    return true;
  });

  const userLevel = user?.level || 1;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading showcase...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white p-6 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <Sparkles className="mr-3" size={32} /> Student Showcase
              </h1>
              <p className="text-white/80 mt-1">Celebrate amazing work from learners around the world!</p>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center px-5 py-3 bg-white text-purple-600 rounded-xl font-bold hover:bg-purple-50 shadow-lg"
              data-testid="upload-work-btn"
            >
              <Plus className="mr-2" size={20} /> Share My Work
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'gallery', label: 'Gallery', icon: Grid },
            { id: 'my-work', label: 'My Work', icon: Image },
            { id: 'featured', label: 'Featured', icon: Star }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-5 py-3 rounded-xl font-medium transition-all ${
                activeTab === tab.id 
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' 
                  : 'bg-white text-gray-600 hover:bg-gray-100 shadow'
              }`}
            >
              <tab.icon size={18} className="mr-2" />{tab.label}
            </button>
          ))}
        </div>

        {/* Gallery Tab */}
        {activeTab === 'gallery' && (
          <>
            {/* Filters */}
            <div className="bg-white rounded-xl shadow p-4 mb-6">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center">
                  <Filter size={18} className="text-gray-400 mr-2" />
                  <span className="text-gray-600 font-medium mr-3">Filter by:</span>
                </div>
                
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                  data-testid="level-filter"
                >
                  <option value="all">All Levels</option>
                  {Object.entries(LEVEL_INFO).map(([level, info]) => (
                    <option key={level} value={level}>{info.icon} Level {level}: {info.name}</option>
                  ))}
                </select>
                
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

            {/* Level Banner */}
            {selectedLevel !== 'all' && (
              <div className={`bg-gradient-to-r ${LEVEL_INFO[selectedLevel]?.color || 'from-purple-500 to-pink-500'} rounded-xl p-6 mb-6 text-white`}>
                <div className="flex items-center">
                  <span className="text-5xl mr-4">{LEVEL_INFO[selectedLevel]?.icon}</span>
                  <div>
                    <h2 className="text-2xl font-bold">Level {selectedLevel}: {LEVEL_INFO[selectedLevel]?.name}</h2>
                    <p className="text-white/80">Amazing work from our {LEVEL_INFO[selectedLevel]?.name}s!</p>
                  </div>
                </div>
              </div>
            )}

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
                    <div className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${LEVEL_INFO[item.level]?.color || 'from-purple-500 to-pink-500'}`}>
                      {LEVEL_INFO[item.level]?.icon} Level {item.level}
                    </div>
                    <div className="absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium bg-white/90 text-gray-700">
                      {CATEGORIES.find(c => c.id === item.category)?.label || item.category}
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-bold text-gray-800 text-lg mb-1">{item.title}</h3>
                    <p className="text-gray-500 text-sm mb-3 line-clamp-2">{item.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                          {item.student_name?.charAt(0)}
                        </div>
                        <div className="ml-2">
                          <div className="text-sm font-medium text-gray-800">{item.student_name}</div>
                          <div className="text-xs text-gray-500">{item.student_index}</div>
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
              <div className="text-center py-16">
                <Image className="mx-auto text-gray-300 mb-4" size={64} />
                <h3 className="text-xl font-bold text-gray-600">No work found</h3>
                <p className="text-gray-500">Be the first to share your work in this category!</p>
              </div>
            )}
          </>
        )}

        {/* My Work Tab */}
        {activeTab === 'my-work' && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">My Uploaded Work</h2>
              <div className={`px-4 py-2 rounded-full bg-gradient-to-r ${LEVEL_INFO[userLevel]?.color || 'from-purple-500 to-pink-500'} text-white font-medium`}>
                {LEVEL_INFO[userLevel]?.icon} {LEVEL_INFO[userLevel]?.name}
              </div>
            </div>
            
            {myItems.length === 0 ? (
              <div className="text-center py-12">
                <Camera className="mx-auto text-gray-300 mb-4" size={64} />
                <h3 className="text-xl font-bold text-gray-600 mb-2">No work uploaded yet</h3>
                <p className="text-gray-500 mb-6">Share your amazing projects, drawings, and creations!</p>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-pink-700"
                >
                  <Plus className="inline mr-2" size={18} /> Upload Your First Work
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {myItems.map((item) => (
                  <div key={item.id} className="rounded-xl border-2 border-gray-200 overflow-hidden hover:border-purple-400 transition-all">
                    <img src={item.image_url} alt={item.title} className="w-full h-32 object-cover" />
                    <div className="p-3">
                      <h4 className="font-bold text-gray-800">{item.title}</h4>
                      <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
                        <span>{item.category}</span>
                        <span className="flex items-center"><Heart size={14} className="mr-1" />{item.likes}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Featured Tab */}
        {activeTab === 'featured' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-6 text-white">
              <div className="flex items-center">
                <Trophy className="mr-4" size={48} />
                <div>
                  <h2 className="text-2xl font-bold">This Week's Featured Work</h2>
                  <p className="text-white/80">Outstanding creations selected by our teachers!</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {showcaseItems.filter(item => item.likes >= 20).slice(0, 4).map((item) => (
                <div key={item.id} className="bg-white rounded-2xl shadow-lg overflow-hidden flex">
                  <img src={item.image_url} alt={item.title} className="w-40 h-40 object-cover" />
                  <div className="p-4 flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="text-yellow-500" size={20} />
                      <span className="text-xs font-bold text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">FEATURED</span>
                    </div>
                    <h3 className="font-bold text-gray-800 mb-1">{item.title}</h3>
                    <p className="text-sm text-gray-500 mb-2">{item.description}</p>
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
              <h3 className="text-xl font-bold text-gray-800">Share Your Work</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
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
                    className="w-full h-48 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center hover:border-purple-500 transition-colors"
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
                      className={`p-3 rounded-lg text-center transition-all ${
                        uploadForm.category === cat.id
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-purple-100'
                      }`}
                    >
                      <cat.icon className="mx-auto mb-1" size={20} />
                      <span className="text-xs">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={handleUpload}
                disabled={!uploadForm.title || !uploadForm.image || uploading}
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
                    <Upload className="mr-2" size={20} /> Share My Work
                  </>
                )}
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
              <div className={`absolute bottom-4 left-4 px-3 py-1.5 rounded-full text-sm font-bold text-white bg-gradient-to-r ${LEVEL_INFO[viewItem.level]?.color}`}>
                {LEVEL_INFO[viewItem.level]?.icon} Level {viewItem.level}
              </div>
            </div>
            
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{viewItem.title}</h2>
              <p className="text-gray-600 mb-4">{viewItem.description}</p>
              
              <div className="flex items-center justify-between border-t pt-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                    {viewItem.student_name?.charAt(0)}
                  </div>
                  <div className="ml-3">
                    <div className="font-bold text-gray-800">{viewItem.student_name}</div>
                    <div className="text-sm text-gray-500">{viewItem.student_index} • {viewItem.created_at}</div>
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

export default StudentShowcase;
