import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from './auth/AuthContext';
import { 
  PenTool, FileText, Image, Bold, Italic, List, Link as LinkIcon, 
  Quote, Hash, Send, Eye, Save, X, Check, AlertCircle,
  Type, AlignLeft, Tag, Globe, Calendar, User, Sparkles
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

const ARTICLE_TEMPLATES = [
  { id: 'news', name: 'Tech News', icon: '📰', description: 'Report on latest tech/AI news' },
  { id: 'tutorial', name: 'How-To Guide', icon: '📚', description: 'Step-by-step tutorial' },
  { id: 'story', name: 'My Story', icon: '✨', description: 'Personal experience with tech' },
  { id: 'review', name: 'App/Tool Review', icon: '⭐', description: 'Review an app or tool' },
  { id: 'opinion', name: 'Opinion Piece', icon: '💭', description: 'Your thoughts on a topic' },
  { id: 'project', name: 'Project Showcase', icon: '🚀', description: 'Share your project' }
];

const CATEGORIES = [
  { id: 'ai_news', label: 'AI News' },
  { id: 'tech_trends', label: 'Tech Trends' },
  { id: 'inventions', label: 'Cool Inventions' },
  { id: 'coding', label: 'Coding Corner' },
  { id: 'student_stories', label: 'Student Stories' },
  { id: 'global_news', label: 'Global Tech' }
];

const AGE_GROUPS = ['4-6', '7-9', '10-12', '13-15', '16-18'];

const ArticleEditor = () => {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState('write');
  const [myArticles, setMyArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const textareaRef = useRef(null);

  const [article, setArticle] = useState({
    template: '',
    title: '',
    subtitle: '',
    category: 'student_stories',
    age_group: user?.age_group || '10-12',
    summary: '',
    introduction: '',
    main_content: '',
    key_points: ['', '', ''],
    conclusion: '',
    tags: [],
    cover_image_url: '',
    sources: '',
    author_bio: ''
  });

  const [tagInput, setTagInput] = useState('');

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    loadMyArticles();
  }, [token]);

  const loadMyArticles = async () => {
    try {
      const response = await axios.get(`${API}/magazine/my-articles`, { headers });
      setMyArticles(response.data.articles || []);
    } catch (error) {
      console.error('Failed to load articles:', error);
    }
  };

  const handleTemplateSelect = (template) => {
    setArticle({ ...article, template: template.id });
  };

  const handleAddTag = () => {
    if (tagInput.trim() && article.tags.length < 5) {
      setArticle({ ...article, tags: [...article.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const handleRemoveTag = (index) => {
    setArticle({ ...article, tags: article.tags.filter((_, i) => i !== index) });
  };

  const updateKeyPoint = (index, value) => {
    const newKeyPoints = [...article.key_points];
    newKeyPoints[index] = value;
    setArticle({ ...article, key_points: newKeyPoints });
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      await axios.post(`${API}/magazine/save-draft`, {
        ...article,
        status: 'draft'
      }, { headers });
      setSuccessMessage('Draft saved! ✅');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Failed to save draft:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!article.title || !article.main_content) {
      alert('Please fill in the title and main content.');
      return;
    }

    setSaving(true);
    try {
      // Combine all content for submission
      const fullContent = `
${article.introduction}

${article.main_content}

${article.key_points.filter(kp => kp).length > 0 ? `**Key Points:**\n${article.key_points.filter(kp => kp).map((kp, i) => `${i + 1}. ${kp}`).join('\n')}` : ''}

${article.conclusion}
      `.trim();

      await axios.post(`${API}/magazine/submit-article`, {
        title: article.title,
        subtitle: article.subtitle,
        content: fullContent,
        summary: article.summary || article.introduction.substring(0, 200),
        category: article.category,
        age_group: article.age_group,
        template: article.template,
        tags: article.tags,
        cover_image_url: article.cover_image_url,
        sources: article.sources,
        status: 'pending_review'
      }, { headers });

      setSuccessMessage('Article submitted for review! 🎉 Our editors will review it soon.');
      setTimeout(() => setSuccessMessage(null), 5000);
      
      // Reset form
      setArticle({
        template: '', title: '', subtitle: '', category: 'student_stories',
        age_group: user?.age_group || '10-12', summary: '', introduction: '',
        main_content: '', key_points: ['', '', ''], conclusion: '', tags: [],
        cover_image_url: '', sources: '', author_bio: ''
      });
      
      loadMyArticles();
    } catch (error) {
      console.error('Failed to submit:', error);
      alert('Failed to submit article. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getWordCount = () => {
    const text = `${article.introduction} ${article.main_content} ${article.conclusion}`;
    return text.trim().split(/\s+/).filter(w => w).length;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-rose-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 text-white p-6 shadow-lg">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold flex items-center">
            <PenTool className="mr-3" size={32} /> Article Writer
          </h1>
          <p className="text-orange-100 mt-1">Write and publish articles for the TEC Magazine</p>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="max-w-5xl mx-auto px-6 mt-4">
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg flex items-center">
            <Check className="mr-2" size={20} />{successMessage}
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto p-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('write')}
            className={`flex items-center px-5 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'write' 
                ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-lg' 
                : 'bg-white text-gray-600 hover:bg-gray-100 shadow'
            }`}
          >
            <PenTool size={18} className="mr-2" /> Write Article
          </button>
          <button
            onClick={() => setActiveTab('my-articles')}
            className={`flex items-center px-5 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'my-articles' 
                ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-lg' 
                : 'bg-white text-gray-600 hover:bg-gray-100 shadow'
            }`}
          >
            <FileText size={18} className="mr-2" /> My Articles ({myArticles.length})
          </button>
        </div>

        {activeTab === 'write' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Editor */}
            <div className="lg:col-span-2 space-y-6">
              {/* Template Selection */}
              {!article.template && (
                <div className="bg-white rounded-xl shadow p-6">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                    <Sparkles className="mr-2 text-orange-500" size={20} />
                    Choose Article Type
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {ARTICLE_TEMPLATES.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => handleTemplateSelect(template)}
                        className="p-4 border-2 border-gray-200 rounded-xl hover:border-orange-400 hover:bg-orange-50 text-left transition-all"
                        data-testid={`template-${template.id}`}
                      >
                        <span className="text-2xl">{template.icon}</span>
                        <div className="font-bold text-gray-800 mt-2">{template.name}</div>
                        <div className="text-xs text-gray-500">{template.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Article Form */}
              {article.template && (
                <>
                  {/* Title & Subtitle */}
                  <div className="bg-white rounded-xl shadow p-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Type size={16} className="inline mr-1" /> Article Title *
                        </label>
                        <input
                          type="text"
                          value={article.title}
                          onChange={(e) => setArticle({ ...article, title: e.target.value })}
                          placeholder="Enter a catchy title..."
                          className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-xl font-bold focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          data-testid="article-title"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Subtitle (optional)
                        </label>
                        <input
                          type="text"
                          value={article.subtitle}
                          onChange={(e) => setArticle({ ...article, subtitle: e.target.value })}
                          placeholder="A brief subtitle..."
                          className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Introduction */}
                  <div className="bg-white rounded-xl shadow p-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <AlignLeft size={16} className="inline mr-1" /> Introduction
                    </label>
                    <p className="text-xs text-gray-500 mb-2">Hook your readers! What is this article about?</p>
                    <textarea
                      value={article.introduction}
                      onChange={(e) => setArticle({ ...article, introduction: e.target.value })}
                      placeholder="Start with something interesting to grab attention..."
                      rows={4}
                      className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  {/* Main Content */}
                  <div className="bg-white rounded-xl shadow p-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FileText size={16} className="inline mr-1" /> Main Content *
                    </label>
                    <p className="text-xs text-gray-500 mb-2">The heart of your article. Explain, describe, and share!</p>
                    <textarea
                      ref={textareaRef}
                      value={article.main_content}
                      onChange={(e) => setArticle({ ...article, main_content: e.target.value })}
                      placeholder="Write your main content here...

Tips:
• Use simple sentences
• Add examples to explain difficult concepts
• Break into paragraphs for easy reading"
                      rows={12}
                      className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-500 font-mono"
                      data-testid="article-content"
                    />
                    <div className="flex justify-between mt-2 text-sm text-gray-500">
                      <span>{getWordCount()} words</span>
                      <span>Aim for 200-500 words</span>
                    </div>
                  </div>

                  {/* Key Points */}
                  <div className="bg-white rounded-xl shadow p-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <List size={16} className="inline mr-1" /> Key Points (optional)
                    </label>
                    <p className="text-xs text-gray-500 mb-3">Highlight 2-3 important takeaways</p>
                    <div className="space-y-2">
                      {article.key_points.map((point, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-bold">
                            {idx + 1}
                          </span>
                          <input
                            type="text"
                            value={point}
                            onChange={(e) => updateKeyPoint(idx, e.target.value)}
                            placeholder={`Key point ${idx + 1}...`}
                            className="flex-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Conclusion */}
                  <div className="bg-white rounded-xl shadow p-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Quote size={16} className="inline mr-1" /> Conclusion
                    </label>
                    <p className="text-xs text-gray-500 mb-2">Wrap up your article with a summary or call-to-action</p>
                    <textarea
                      value={article.conclusion}
                      onChange={(e) => setArticle({ ...article, conclusion: e.target.value })}
                      placeholder="End with a strong conclusion..."
                      rows={3}
                      className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  {/* Sources */}
                  <div className="bg-white rounded-xl shadow p-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <LinkIcon size={16} className="inline mr-1" /> Sources (optional)
                    </label>
                    <p className="text-xs text-gray-500 mb-2">Where did you learn this? Add links or references.</p>
                    <textarea
                      value={article.sources}
                      onChange={(e) => setArticle({ ...article, sources: e.target.value })}
                      placeholder="Add sources, links, or references..."
                      rows={2}
                      className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Article Settings */}
              <div className="bg-white rounded-xl shadow p-5 sticky top-6">
                <h3 className="font-bold text-gray-800 mb-4">Article Settings</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={article.category}
                      onChange={(e) => setArticle({ ...article, category: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Target Age Group</label>
                    <select
                      value={article.age_group}
                      onChange={(e) => setArticle({ ...article, age_group: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
                    >
                      {AGE_GROUPS.map(ag => (
                        <option key={ag} value={ag}>{ag} years</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Students in this age group from all countries will see your article!
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Tag size={14} className="inline mr-1" /> Tags
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                        placeholder="Add tag..."
                        className="flex-1 border rounded-lg px-3 py-2 text-sm"
                      />
                      <button
                        onClick={handleAddTag}
                        className="px-3 py-2 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {article.tags.map((tag, idx) => (
                        <span key={idx} className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-sm flex items-center">
                          #{tag}
                          <button onClick={() => handleRemoveTag(idx)} className="ml-1 hover:text-red-500">
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cover Image URL</label>
                    <input
                      type="url"
                      value={article.cover_image_url}
                      onChange={(e) => setArticle({ ...article, cover_image_url: e.target.value })}
                      placeholder="https://..."
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 space-y-3">
                  <button
                    onClick={() => setShowPreview(true)}
                    className="w-full py-3 border-2 border-orange-500 text-orange-600 rounded-lg font-medium hover:bg-orange-50 flex items-center justify-center"
                  >
                    <Eye className="mr-2" size={18} /> Preview Article
                  </button>
                  
                  <button
                    onClick={handleSaveDraft}
                    disabled={saving}
                    className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 flex items-center justify-center"
                  >
                    <Save className="mr-2" size={18} /> Save Draft
                  </button>
                  
                  <button
                    onClick={handleSubmitForReview}
                    disabled={saving || !article.title || !article.main_content}
                    className="w-full py-3 bg-gradient-to-r from-orange-500 to-rose-500 text-white rounded-lg font-bold hover:from-orange-600 hover:to-rose-600 disabled:opacity-50 flex items-center justify-center"
                    data-testid="submit-article-btn"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2" size={18} /> Submit for Review
                      </>
                    )}
                  </button>
                </div>

                {/* Guidelines */}
                <div className="mt-6 p-4 bg-orange-50 rounded-lg">
                  <h4 className="font-bold text-orange-800 text-sm mb-2">Writing Tips:</h4>
                  <ul className="text-xs text-orange-700 space-y-1">
                    <li>✓ Use simple, clear language</li>
                    <li>✓ Add examples to explain ideas</li>
                    <li>✓ Keep paragraphs short</li>
                    <li>✓ Proofread before submitting</li>
                    <li>✓ Be original and creative!</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* My Articles Tab */}
        {activeTab === 'my-articles' && (
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="font-bold text-gray-800 mb-4">My Submitted Articles</h3>
            
            {myArticles.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText className="mx-auto mb-3 text-gray-300" size={48} />
                <p>No articles submitted yet</p>
                <button
                  onClick={() => setActiveTab('write')}
                  className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-lg"
                >
                  Write Your First Article
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {myArticles.map((art) => (
                  <div key={art.id} className="p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-gray-800">{art.title}</h4>
                        <p className="text-sm text-gray-500 mt-1">{art.summary?.substring(0, 100)}...</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                          <span>{art.category}</span>
                          <span>{art.age_group} yrs</span>
                          <span>{art.created_at?.split('T')[0]}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          art.status === 'published' ? 'bg-green-100 text-green-700' :
                          art.status === 'pending_review' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {art.status === 'published' ? '✓ Published' :
                           art.status === 'pending_review' ? '⏳ Under Review' : 'Draft'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h3 className="font-bold text-gray-800">Article Preview</h3>
              <button onClick={() => setShowPreview(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6">
              {article.cover_image_url && (
                <img src={article.cover_image_url} alt="Cover" className="w-full h-48 object-cover rounded-lg mb-6" />
              )}
              
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{article.title || 'Untitled Article'}</h1>
              {article.subtitle && <p className="text-xl text-gray-500 mb-4">{article.subtitle}</p>}
              
              <div className="flex items-center gap-4 mb-6 text-sm text-gray-500">
                <span className="flex items-center"><User size={14} className="mr-1" />{user?.full_name}</span>
                <span className="flex items-center"><Globe size={14} className="mr-1" />{article.age_group} yrs</span>
                <span className="flex items-center"><Calendar size={14} className="mr-1" />{new Date().toLocaleDateString()}</span>
              </div>
              
              {article.tags.length > 0 && (
                <div className="flex gap-2 mb-6">
                  {article.tags.map((tag, idx) => (
                    <span key={idx} className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="prose max-w-none">
                {article.introduction && <p className="text-lg text-gray-700 mb-4">{article.introduction}</p>}
                
                {article.main_content && (
                  <div className="whitespace-pre-wrap text-gray-700">{article.main_content}</div>
                )}
                
                {article.key_points.filter(kp => kp).length > 0 && (
                  <div className="my-6 p-4 bg-orange-50 rounded-lg">
                    <h3 className="font-bold text-orange-800 mb-2">Key Points:</h3>
                    <ul className="space-y-2">
                      {article.key_points.filter(kp => kp).map((kp, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="w-6 h-6 bg-orange-200 text-orange-700 rounded-full flex items-center justify-center text-sm font-bold mr-2 flex-shrink-0">
                            {idx + 1}
                          </span>
                          {kp}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {article.conclusion && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg italic text-gray-700">
                    {article.conclusion}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArticleEditor;
