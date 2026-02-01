import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './auth/AuthContext';
import { 
  Newspaper, BookOpen, PenTool, Globe, Calendar, Heart, 
  MessageCircle, Send, ChevronRight, Star, Sparkles, 
  Lightbulb, Rocket, Brain, Users, X, Filter, Clock,
  ThumbsUp, Share2, Eye, Award
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

// Age group magazines
const MAGAZINES = {
  '4-6': {
    name: 'Little Learners Monthly',
    icon: '🌟',
    color: 'from-pink-400 to-rose-500',
    tagline: 'Fun Tech Adventures for Young Minds!',
    description: 'Simple stories and colorful pictures about robots, computers, and cool inventions!'
  },
  '7-9': {
    name: 'Young Explorers Digest',
    icon: '🔭',
    color: 'from-blue-400 to-cyan-500',
    tagline: 'Discover Amazing Tech & Science!',
    description: 'Exciting articles about AI helpers, space tech, and how things work!'
  },
  '10-12': {
    name: 'Smart Kids Tech Times',
    icon: '💡',
    color: 'from-purple-400 to-indigo-500',
    tagline: 'Tech News for Curious Minds!',
    description: 'In-depth stories about coding, AI projects, and future technology!'
  },
  '13-15': {
    name: 'Teen Tech Tribune',
    icon: '🚀',
    color: 'from-orange-400 to-red-500',
    tagline: 'Your Gateway to the Tech World!',
    description: 'Latest trends in AI, programming, startups, and digital innovation!'
  },
  '16-18': {
    name: 'Future Leaders Review',
    icon: '👑',
    color: 'from-amber-400 to-yellow-500',
    tagline: 'Preparing Tomorrow\'s Tech Leaders!',
    description: 'Advanced tech analysis, career insights, and industry breakthroughs!'
  }
};

const ARTICLE_CATEGORIES = [
  { id: 'ai_news', label: 'AI News', icon: Brain },
  { id: 'tech_trends', label: 'Tech Trends', icon: Rocket },
  { id: 'inventions', label: 'Cool Inventions', icon: Lightbulb },
  { id: 'coding', label: 'Coding Corner', icon: PenTool },
  { id: 'student_stories', label: 'Student Stories', icon: Users },
  { id: 'global_news', label: 'Global Tech', icon: Globe }
];

const TechAIMagazine = () => {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState('read');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState(user?.age_group || '10-12');
  const [articles, setArticles] = useState([]);
  const [studentArticles, setStudentArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewArticle, setViewArticle] = useState(null);
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [writeForm, setWriteForm] = useState({
    title: '',
    content: '',
    category: 'student_stories'
  });
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  const headers = { Authorization: `Bearer ${token}` };
  const currentMagazine = MAGAZINES[selectedAgeGroup] || MAGAZINES['10-12'];

  useEffect(() => {
    if (user?.age_group) {
      setSelectedAgeGroup(user.age_group);
    }
    loadArticles();
  }, [token, selectedAgeGroup]);

  const loadArticles = async () => {
    setLoading(true);
    try {
      // Load official articles
      const response = await axios.get(`${API}/magazine/articles?age_group=${selectedAgeGroup}`, { headers });
      setArticles(response.data.articles || []);
      
      // Load student contributions
      const studentResponse = await axios.get(`${API}/magazine/student-articles?age_group=${selectedAgeGroup}`, { headers });
      setStudentArticles(studentResponse.data.articles || []);
    } catch (error) {
      console.error('Failed to load articles:', error);
      // Demo articles for display
      setArticles([
        {
          id: '1', title: 'How AI is Helping Doctors Save Lives', category: 'ai_news',
          summary: 'Discover how artificial intelligence is helping doctors find diseases early!',
          content: 'Artificial Intelligence is becoming a superhero in hospitals around the world...',
          author: 'TEC Editorial Team', date: 'January 2026', read_time: '5 min',
          likes: 156, views: 1240, featured: true
        },
        {
          id: '2', title: 'New Robot Can Clean the Ocean!', category: 'inventions',
          summary: 'Scientists created a smart robot that swims and collects plastic from the sea.',
          content: 'A team of engineers has built an amazing robot that can swim through the ocean...',
          author: 'TEC Science Desk', date: 'January 2026', read_time: '4 min',
          likes: 98, views: 876, featured: false
        },
        {
          id: '3', title: 'Kids Around the World Learning to Code', category: 'global_news',
          summary: 'From Sri Lanka to Brazil, children are becoming coding champions!',
          content: 'All around the world, kids just like you are learning to write computer code...',
          author: 'TEC Global', date: 'January 2026', read_time: '6 min',
          likes: 234, views: 1567, featured: true
        },
        {
          id: '4', title: 'What is ChatGPT and How Does It Work?', category: 'ai_news',
          summary: 'Learn about the AI that can chat with you and answer questions!',
          content: 'You may have heard about ChatGPT - it\'s an AI that can have conversations...',
          author: 'TEC AI Team', date: 'January 2026', read_time: '5 min',
          likes: 312, views: 2100, featured: false
        }
      ]);
      
      setStudentArticles([
        {
          id: 's1', title: 'My First Python Program', category: 'coding',
          summary: 'How I learned to make a calculator in Python!',
          content: 'Last month, I decided to learn Python programming. It was challenging at first...',
          author_name: 'Tharushi S.', author_country: 'Sri Lanka', author_index: 'SRI-S-1001',
          date: 'January 2026', likes: 45, approved: true
        },
        {
          id: 's2', title: 'AI Helped Me With Homework', category: 'student_stories',
          summary: 'My experience using AI tools for learning',
          content: 'I was stuck on a math problem for hours. Then my teacher showed me how to use AI...',
          author_name: 'Raj K.', author_country: 'India', author_index: 'IND-S-1002',
          date: 'January 2026', likes: 67, approved: true
        },
        {
          id: 's3', title: 'Cool Tech I Saw at the Science Fair', category: 'tech_trends',
          summary: 'Amazing inventions from students around the world',
          content: 'At our school science fair, I saw some incredible projects made by students...',
          author_name: 'Sarah M.', author_country: 'UAE', author_index: 'UAE-S-1001',
          date: 'January 2026', likes: 38, approved: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitArticle = async () => {
    if (!writeForm.title || !writeForm.content) return;
    
    setSubmitting(true);
    try {
      await axios.post(`${API}/magazine/submit-article`, {
        title: writeForm.title,
        content: writeForm.content,
        category: writeForm.category,
        age_group: selectedAgeGroup
      }, { headers });
      
      setShowWriteModal(false);
      setWriteForm({ title: '', content: '', category: 'student_stories' });
      setSuccessMessage('Your article has been submitted for review! 🎉');
      setTimeout(() => setSuccessMessage(null), 5000);
      loadArticles();
    } catch (error) {
      console.error('Failed to submit:', error);
      alert('Failed to submit article. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeArticle = async (articleId, isStudent = false) => {
    try {
      await axios.post(`${API}/magazine/articles/${articleId}/like`, { is_student: isStudent }, { headers });
      if (isStudent) {
        setStudentArticles(articles => articles.map(a => 
          a.id === articleId ? { ...a, likes: a.likes + 1 } : a
        ));
      } else {
        setArticles(articles => articles.map(a => 
          a.id === articleId ? { ...a, likes: a.likes + 1 } : a
        ));
      }
    } catch (error) {
      console.error('Failed to like:', error);
    }
  };

  const filteredArticles = selectedCategory === 'all' 
    ? articles 
    : articles.filter(a => a.category === selectedCategory);

  const filteredStudentArticles = selectedCategory === 'all'
    ? studentArticles
    : studentArticles.filter(a => a.category === selectedCategory);

  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading magazine...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50">
      {/* Magazine Header */}
      <div className={`bg-gradient-to-r ${currentMagazine.color} text-white`}>
        <div className="max-w-6xl mx-auto p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-4xl">{currentMagazine.icon}</span>
                <div>
                  <h1 className="text-3xl font-bold">{currentMagazine.name}</h1>
                  <p className="text-white/80">{currentMagazine.tagline}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-3 text-white/90 text-sm">
                <span className="flex items-center"><Calendar size={16} className="mr-1" />{currentMonth} Edition</span>
                <span className="flex items-center"><Globe size={16} className="mr-1" />Global Edition</span>
                <span className="px-3 py-1 bg-white/20 rounded-full">Ages {selectedAgeGroup}</span>
              </div>
            </div>
            <button
              onClick={() => setShowWriteModal(true)}
              className="flex items-center px-5 py-3 bg-white text-gray-800 rounded-xl font-bold hover:bg-gray-100 shadow-lg"
              data-testid="write-article-btn"
            >
              <PenTool className="mr-2" size={20} /> Write for Magazine
            </button>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="max-w-6xl mx-auto px-6 mt-4">
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg flex items-center">
            <Award className="mr-2" size={20} />{successMessage}
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto p-6">
        {/* Age Group Selector */}
        <div className="bg-white rounded-xl shadow p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={18} className="text-purple-600" />
            <span className="font-medium text-gray-700">Select Magazine Edition:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(MAGAZINES).map(([ageGroup, mag]) => (
              <button
                key={ageGroup}
                onClick={() => setSelectedAgeGroup(ageGroup)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedAgeGroup === ageGroup
                    ? `bg-gradient-to-r ${mag.color} text-white shadow-lg`
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                data-testid={`magazine-${ageGroup}`}
              >
                {mag.icon} {ageGroup} yrs
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'read', label: 'Read Articles', icon: Newspaper },
            { id: 'student', label: 'Student Contributions', icon: Users },
            { id: 'featured', label: 'Featured', icon: Star }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-5 py-3 rounded-xl font-medium transition-all ${
                activeTab === tab.id 
                  ? `bg-gradient-to-r ${currentMagazine.color} text-white shadow-lg` 
                  : 'bg-white text-gray-600 hover:bg-gray-100 shadow'
              }`}
            >
              <tab.icon size={18} className="mr-2" />{tab.label}
            </button>
          ))}
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${
              selectedCategory === 'all' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 shadow'
            }`}
          >
            All Topics
          </button>
          {ARTICLE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center ${
                selectedCategory === cat.id ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 shadow hover:bg-purple-50'
              }`}
            >
              <cat.icon size={14} className="mr-1" />{cat.label}
            </button>
          ))}
        </div>

        {/* Read Articles Tab */}
        {activeTab === 'read' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Featured Article */}
            {filteredArticles.filter(a => a.featured)[0] && (
              <div className="lg:col-span-2">
                <div 
                  className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-all"
                  onClick={() => setViewArticle(filteredArticles.filter(a => a.featured)[0])}
                >
                  <div className={`h-48 bg-gradient-to-br ${currentMagazine.color} flex items-center justify-center`}>
                    <Sparkles className="text-white/50" size={80} />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-bold">⭐ FEATURED</span>
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                        {ARTICLE_CATEGORIES.find(c => c.id === filteredArticles.filter(a => a.featured)[0].category)?.label}
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">{filteredArticles.filter(a => a.featured)[0].title}</h2>
                    <p className="text-gray-600 mb-4">{filteredArticles.filter(a => a.featured)[0].summary}</p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{filteredArticles.filter(a => a.featured)[0].author}</span>
                      <div className="flex items-center gap-4">
                        <span className="flex items-center"><Clock size={14} className="mr-1" />{filteredArticles.filter(a => a.featured)[0].read_time}</span>
                        <span className="flex items-center"><Eye size={14} className="mr-1" />{filteredArticles.filter(a => a.featured)[0].views}</span>
                        <span className="flex items-center"><Heart size={14} className="mr-1" />{filteredArticles.filter(a => a.featured)[0].likes}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Article List */}
            <div className="space-y-4">
              {filteredArticles.filter(a => !a.featured).map((article) => (
                <div 
                  key={article.id}
                  className="bg-white rounded-xl shadow p-4 cursor-pointer hover:shadow-lg transition-all"
                  onClick={() => setViewArticle(article)}
                >
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                    {ARTICLE_CATEGORIES.find(c => c.id === article.category)?.label}
                  </span>
                  <h3 className="font-bold text-gray-800 mt-2 mb-1">{article.title}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2">{article.summary}</p>
                  <div className="flex items-center justify-between mt-3 text-xs text-gray-400">
                    <span>{article.read_time} read</span>
                    <span className="flex items-center"><Heart size={12} className="mr-1" />{article.likes}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Student Contributions Tab */}
        {activeTab === 'student' && (
          <div>
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-800 flex items-center">
                    <Users className="mr-2 text-purple-600" size={24} />
                    Student Writers from Around the World
                  </h2>
                  <p className="text-gray-600 mt-1">Amazing articles written by students in the {selectedAgeGroup} age group!</p>
                </div>
                <button
                  onClick={() => setShowWriteModal(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700"
                >
                  <PenTool size={16} className="inline mr-1" /> Submit Your Article
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStudentArticles.map((article) => (
                <div 
                  key={article.id}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all cursor-pointer"
                  onClick={() => setViewArticle({ ...article, isStudent: true })}
                >
                  <div className={`h-24 bg-gradient-to-br ${currentMagazine.color} flex items-center justify-center relative`}>
                    <PenTool className="text-white/30" size={40} />
                    <div className="absolute bottom-2 right-2 flex items-center gap-1">
                      <Globe className="text-white/80" size={14} />
                      <span className="text-white/90 text-xs font-medium">{article.author_country}</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                      {ARTICLE_CATEGORIES.find(c => c.id === article.category)?.label}
                    </span>
                    <h3 className="font-bold text-gray-800 mt-2 mb-1">{article.title}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">{article.summary}</p>
                    
                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                          {article.author_name?.charAt(0)}
                        </div>
                        <div className="ml-2">
                          <div className="text-sm font-medium text-gray-800">{article.author_name}</div>
                          <div className="text-xs text-gray-500">{article.author_index}</div>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleLikeArticle(article.id, true); }}
                        className="flex items-center text-pink-500 hover:text-pink-600"
                      >
                        <Heart size={16} className="mr-1" />{article.likes}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredStudentArticles.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl">
                <PenTool className="mx-auto text-gray-300 mb-4" size={48} />
                <h3 className="text-xl font-bold text-gray-600">No student articles yet</h3>
                <p className="text-gray-500 mt-2">Be the first to share your story!</p>
                <button
                  onClick={() => setShowWriteModal(true)}
                  className="mt-4 px-6 py-3 bg-purple-600 text-white rounded-xl font-medium"
                >
                  Write an Article
                </button>
              </div>
            )}
          </div>
        )}

        {/* Featured Tab */}
        {activeTab === 'featured' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-6 text-white">
              <div className="flex items-center">
                <Star className="mr-4" size={48} />
                <div>
                  <h2 className="text-2xl font-bold">Editor's Picks</h2>
                  <p className="text-white/80">The best articles selected by our editorial team!</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...filteredArticles.filter(a => a.featured), ...filteredStudentArticles.filter(a => a.likes >= 30)].map((article) => (
                <div 
                  key={article.id}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden flex cursor-pointer hover:shadow-xl transition-all"
                  onClick={() => setViewArticle(article)}
                >
                  <div className={`w-32 bg-gradient-to-br ${currentMagazine.color} flex items-center justify-center`}>
                    <Star className="text-white/50" size={40} />
                  </div>
                  <div className="p-4 flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="text-yellow-500" size={16} />
                      <span className="text-xs font-bold text-yellow-600">EDITOR'S PICK</span>
                    </div>
                    <h3 className="font-bold text-gray-800 mb-1">{article.title}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2">{article.summary}</p>
                    <div className="flex items-center justify-between mt-3 text-sm">
                      <span className="text-gray-600">{article.author || article.author_name}</span>
                      <span className="flex items-center text-pink-500">
                        <Heart size={14} className="mr-1" fill="currentColor" />{article.likes}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Article View Modal */}
      {viewArticle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className={`h-32 bg-gradient-to-br ${currentMagazine.color} relative`}>
              <button
                onClick={() => setViewArticle(null)}
                className="absolute top-4 right-4 p-2 bg-white/20 text-white rounded-full hover:bg-white/30"
              >
                <X size={24} />
              </button>
              <div className="absolute bottom-4 left-6 text-white">
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                  {ARTICLE_CATEGORIES.find(c => c.id === viewArticle.category)?.label}
                </span>
              </div>
            </div>
            
            <div className="p-6">
              <h1 className="text-3xl font-bold text-gray-800 mb-4">{viewArticle.title}</h1>
              
              <div className="flex items-center justify-between mb-6 pb-4 border-b">
                <div className="flex items-center">
                  {viewArticle.isStudent ? (
                    <>
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold">
                        {viewArticle.author_name?.charAt(0)}
                      </div>
                      <div className="ml-3">
                        <div className="font-medium text-gray-800">{viewArticle.author_name}</div>
                        <div className="text-sm text-gray-500">{viewArticle.author_country} • {viewArticle.author_index}</div>
                      </div>
                    </>
                  ) : (
                    <div>
                      <div className="font-medium text-gray-800">{viewArticle.author}</div>
                      <div className="text-sm text-gray-500">{viewArticle.date}</div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleLikeArticle(viewArticle.id, viewArticle.isStudent)}
                    className="flex items-center px-4 py-2 bg-pink-100 text-pink-600 rounded-full hover:bg-pink-200"
                  >
                    <Heart size={18} className="mr-2" />{viewArticle.likes} Likes
                  </button>
                  <button className="flex items-center px-4 py-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200">
                    <Share2 size={18} className="mr-2" />Share
                  </button>
                </div>
              </div>

              <div className="prose max-w-none">
                <p className="text-lg text-gray-700 leading-relaxed">{viewArticle.content || viewArticle.summary}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Write Article Modal */}
      {showWriteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800 flex items-center">
                <PenTool className="mr-2 text-purple-600" size={24} />
                Write for {currentMagazine.name}
              </h3>
              <button onClick={() => setShowWriteModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <div className="bg-purple-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-purple-800">
                <strong>Your article will be visible to students aged {selectedAgeGroup} from all countries!</strong>
                <br />Share your experiences, discoveries, and stories about technology and AI.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Article Title *</label>
                <input
                  type="text"
                  value={writeForm.title}
                  onChange={(e) => setWriteForm({ ...writeForm, title: e.target.value })}
                  placeholder="Give your article an interesting title"
                  className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500"
                  data-testid="article-title-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <div className="grid grid-cols-3 gap-2">
                  {ARTICLE_CATEGORIES.filter(c => c.id !== 'all').map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setWriteForm({ ...writeForm, category: cat.id })}
                      className={`p-3 rounded-lg text-center transition-all ${
                        writeForm.category === cat.id
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-purple-100'
                      }`}
                    >
                      <cat.icon className="mx-auto mb-1" size={18} />
                      <span className="text-xs">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Article *</label>
                <textarea
                  value={writeForm.content}
                  onChange={(e) => setWriteForm({ ...writeForm, content: e.target.value })}
                  placeholder="Write your article here... Share your thoughts, experiences, and discoveries!"
                  rows={10}
                  className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500"
                  data-testid="article-content-input"
                />
                <p className="text-sm text-gray-500 mt-1">{writeForm.content.length} characters</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowWriteModal(false)}
                  className="flex-1 px-4 py-3 border rounded-lg hover:bg-gray-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitArticle}
                  disabled={!writeForm.title || !writeForm.content || submitting}
                  className={`flex-1 px-4 py-3 bg-gradient-to-r ${currentMagazine.color} text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center`}
                  data-testid="submit-article-btn"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2" size={18} /> Submit Article
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TechAIMagazine;
