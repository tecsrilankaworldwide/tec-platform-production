import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './auth/AuthContext';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

const ArticleReviewDashboard = () => {
  const { token } = useAuth();
  const [articles, setArticles] = useState([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [reviewMode, setReviewMode] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadArticles();
  }, [filter, token]);

  const loadArticles = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/magazine/all-submissions`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { status: filter }
      });
      setArticles(response.data.articles || []);
      setStats(response.data.stats || { pending: 0, approved: 0, rejected: 0, total: 0 });
    } catch (error) {
      console.error('Failed to load articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const openReview = (article) => {
    setSelectedArticle(article);
    setEditedTitle(article.title || '');
    setEditedContent(article.content || '');
    setFeedback('');
    setReviewMode(true);
  };

  const closeReview = () => {
    setSelectedArticle(null);
    setReviewMode(false);
    setEditedTitle('');
    setEditedContent('');
    setFeedback('');
  };

  const handleReview = async (action) => {
    if (!selectedArticle) return;
    setSubmitting(true);
    
    try {
      await axios.post(
        `${API}/magazine/review/${selectedArticle.id}`,
        {
          action,
          feedback,
          edited_title: editedTitle !== selectedArticle.title ? editedTitle : null,
          edited_content: editedContent !== selectedArticle.content ? editedContent : null
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      closeReview();
      loadArticles();
    } catch (error) {
      console.error('Review failed:', error);
      alert('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'ai_news': '🤖',
      'tech_trends': '📱',
      'cool_inventions': '💡',
      'coding_corner': '💻',
      'student_stories': '📝',
      'global_tech': '🌍',
      'tech_news': '📰',
      'how_to': '🔧',
      'my_story': '📖',
      'app_review': '⭐',
      'opinion': '💭',
      'project_showcase': '🎨'
    };
    return icons[category] || '📄';
  };

  const getAgeGroupLabel = (ageGroup) => {
    const labels = {
      '4-6': '🌟 Little Learners',
      '7-9': '🔭 Young Explorers',
      '10-12': '💡 Smart Kids',
      '13-15': '🚀 Tech Teens',
      '16-18': '👑 Future Leaders'
    };
    return labels[ageGroup] || ageGroup;
  };

  const getStatusBadge = (article) => {
    if (article.status === 'approved' || article.approved) {
      return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">✅ Approved</span>;
    }
    if (article.status === 'rejected') {
      return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">❌ Rejected</span>;
    }
    return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">⏳ Pending</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6" data-testid="article-review-dashboard">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800" data-testid="review-dashboard-title">
            ✍️ Article Review Dashboard
          </h1>
          <p className="text-gray-600 mt-2">Review and publish student-submitted articles</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
            <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-gray-600 text-sm">Pending Review</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
            <div className="text-3xl font-bold text-green-600">{stats.approved}</div>
            <div className="text-gray-600 text-sm">Approved</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500">
            <div className="text-3xl font-bold text-red-600">{stats.rejected}</div>
            <div className="text-gray-600 text-sm">Rejected</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
            <div className="text-3xl font-bold text-purple-600">{stats.total}</div>
            <div className="text-gray-600 text-sm">Total Submissions</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {['pending', 'approved', 'rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                filter === status
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
              data-testid={`filter-${status}`}
            >
              {status === 'pending' && '⏳ '}
              {status === 'approved' && '✅ '}
              {status === 'rejected' && '❌ '}
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Articles List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin text-4xl mb-4">⏳</div>
            <p className="text-gray-500">Loading articles...</p>
          </div>
        ) : articles.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No {filter} articles</h3>
            <p className="text-gray-600">
              {filter === 'pending' ? 'All caught up! No articles waiting for review.' : `No ${filter} articles yet.`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {articles.map((article) => (
              <div
                key={article.id}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
                data-testid={`article-${article.id}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{getCategoryIcon(article.category)}</span>
                      <h3 className="text-lg font-bold text-gray-800">{article.title}</h3>
                      {getStatusBadge(article)}
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {article.summary || article.content?.substring(0, 150)}...
                    </p>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <span>👤 {article.author_name}</span>
                      <span>📍 {article.author_country}</span>
                      <span>{getAgeGroupLabel(article.age_group)}</span>
                      <span>📅 {new Date(article.created_at).toLocaleDateString()}</span>
                    </div>
                    
                    {article.review_feedback && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm">
                        <span className="font-medium">Review Feedback:</span> {article.review_feedback}
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-4">
                    <button
                      onClick={() => openReview(article)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      data-testid={`review-btn-${article.id}`}
                    >
                      {filter === 'pending' ? '📝 Review' : '👁️ View'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Review Modal */}
        {reviewMode && selectedArticle && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold">Review Article</h2>
                  <button
                    onClick={closeReview}
                    className="text-white/80 hover:text-white text-2xl"
                    data-testid="close-review-modal"
                  >
                    ✕
                  </button>
                </div>
                <div className="mt-2 text-purple-100 text-sm">
                  By {selectedArticle.author_name} • {getAgeGroupLabel(selectedArticle.age_group)}
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {/* Title (Editable) */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                    data-testid="edit-title-input"
                  />
                </div>

                {/* Content (Editable) */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                  <textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none min-h-[200px]"
                    data-testid="edit-content-input"
                  />
                </div>

                {/* Feedback */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Feedback for Student (Optional)
                  </label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                    placeholder="Provide constructive feedback for the student..."
                    rows={3}
                    data-testid="feedback-input"
                  />
                </div>

                {/* Article Meta */}
                <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
                  <div className="grid grid-cols-2 gap-2">
                    <div><strong>Category:</strong> {selectedArticle.category}</div>
                    <div><strong>Age Group:</strong> {selectedArticle.age_group}</div>
                    <div><strong>Submitted:</strong> {new Date(selectedArticle.created_at).toLocaleString()}</div>
                    <div><strong>Student ID:</strong> {selectedArticle.author_index || 'N/A'}</div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="border-t p-6 bg-gray-50 flex justify-end gap-4">
                <button
                  onClick={closeReview}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReview('reject')}
                  className="px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50"
                  disabled={submitting}
                  data-testid="reject-btn"
                >
                  {submitting ? 'Processing...' : '❌ Reject'}
                </button>
                <button
                  onClick={() => handleReview('approve')}
                  className="px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50"
                  disabled={submitting}
                  data-testid="approve-btn"
                >
                  {submitting ? 'Processing...' : '✅ Approve & Publish'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArticleReviewDashboard;
