import React, { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { 
  Home, BookOpen, Calendar, ClipboardCheck, Award, PenTool, 
  MessageSquare, Smartphone, Rocket, Palette, Newspaper, Trophy,
  Users, Star, Settings, LogOut, Menu, X, ChevronDown, ChevronRight,
  Sparkles, Gamepad2, Brain, Video, Target, HelpCircle, FolderOpen, Gift
} from "lucide-react";

const Navigation = () => {
  const { user, logout, isTeacher, isStudent, hasSubscription, getLearningLevel } = useAuth();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);

  const isParent = user?.role === 'parent';

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const NavItem = ({ href, icon: Icon, label, color = "purple", isActive = false }) => {
    const colorStyles = {
      purple: "hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200",
      blue: "hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200",
      pink: "hover:bg-pink-50 hover:text-pink-600 hover:border-pink-200",
      green: "hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200",
      orange: "hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200",
      yellow: "hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200",
    };

    const activeStyles = {
      purple: "bg-purple-50 text-purple-600 border-purple-200 border-b-4",
      blue: "bg-blue-50 text-blue-600 border-blue-200 border-b-4",
      pink: "bg-pink-50 text-pink-600 border-pink-200 border-b-4",
      green: "bg-emerald-50 text-emerald-600 border-emerald-200 border-b-4",
      orange: "bg-orange-50 text-orange-600 border-orange-200 border-b-4",
      yellow: "bg-amber-50 text-amber-600 border-amber-200 border-b-4",
    };

    return (
      <a
        href={href}
        className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold text-slate-600 
          border-2 border-transparent transition-all duration-200 
          hover:scale-105 active:scale-95
          ${isActive ? activeStyles[color] : colorStyles[color]}`}
        data-testid={`nav-${label.toLowerCase().replace(/\s/g, '-')}`}
      >
        <Icon className="w-6 h-6" strokeWidth={2.5} />
        <span className="text-sm">{label}</span>
      </a>
    );
  };

  const ExpandableSection = ({ title, icon: Icon, children, color = "purple" }) => {
    const isExpanded = expandedSection === title;
    
    return (
      <div className="mb-2">
        <button
          onClick={() => setExpandedSection(isExpanded ? null : title)}
          className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl 
            font-bold text-slate-600 border-2 border-transparent
            hover:bg-slate-50 transition-all duration-200`}
        >
          <div className="flex items-center gap-3">
            <Icon className="w-6 h-6" strokeWidth={2.5} />
            <span className="text-sm">{title}</span>
          </div>
          {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
        {isExpanded && (
          <div className="ml-4 mt-2 space-y-1 animate-in slide-in-from-top-2 duration-200">
            {children}
          </div>
        )}
      </div>
    );
  };

  // Desktop Sidebar
  const Sidebar = () => (
    <aside className="hidden lg:flex flex-col w-72 min-h-screen bg-white border-r-2 border-slate-100 p-6" 
           style={{ fontFamily: "'Nunito', sans-serif" }}
           data-testid="desktop-sidebar">
      {/* Logo */}
      <div className="mb-8">
        <a href="/dashboard" className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
            <Rocket className="w-7 h-7 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-purple-600 tracking-tight">TEC Future</h1>
            <p className="text-xs text-slate-400 font-medium">Ready Learning 🌟</p>
          </div>
        </a>
      </div>

      {/* User Welcome Card */}
      {user && (
        <div className="mb-6 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl border-2 border-purple-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
              {getInitials(user.full_name)}
            </div>
            <div className="flex-1">
              <p className="font-bold text-slate-700 text-sm">Hi, {user.full_name?.split(' ')[0]}! 👋</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full text-xs font-semibold capitalize">
                  {user.role}
                </span>
                {hasSubscription && isStudent && (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-600 rounded-full text-xs font-semibold">
                    ⭐ Premium
                  </span>
                )}
              </div>
            </div>
          </div>
          {user.age_group && isStudent && (
            <div className="mt-3 p-2 bg-white rounded-xl">
              <p className="text-xs text-slate-500 font-medium">Learning Level</p>
              <p className="text-sm font-bold text-purple-600">{getLearningLevel(user.age_group)} 🎯</p>
            </div>
          )}
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 space-y-2 overflow-y-auto">
        <NavItem href="/dashboard" icon={Home} label="Dashboard" color="purple" />
        
        {/* Teacher/Admin Menu */}
        {isTeacher && (
          <>
            <div className="pt-4 pb-2">
              <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Teaching</p>
            </div>
            <NavItem href="/teacher" icon={BookOpen} label="Create Content" color="blue" />
            <NavItem href="/class-scheduler" icon={Calendar} label="Schedule" color="green" />
            <NavItem href="/attendance" icon={ClipboardCheck} label="Attendance" color="orange" />
            <NavItem href="/teacher-certificates" icon={Award} label="Certificates" color="yellow" />
            <NavItem href="/batch-showcase" icon={FolderOpen} label="Batch Showcase" color="pink" />
            
            <div className="pt-4 pb-2">
              <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Publishing</p>
            </div>
            <NavItem href="/write-article" icon={PenTool} label="Publish" color="pink" />
            <NavItem href="/article-reviews" icon={MessageSquare} label="Reviews" color="purple" />
            <NavItem href="/whatsapp-admin" icon={Smartphone} label="WhatsApp" color="green" />
          </>
        )}

        {/* Student Menu */}
        {isStudent && (
          <>
            <div className="pt-4 pb-2">
              <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Learning</p>
            </div>
            <NavItem href="/my-learning" icon={Rocket} label="My Learning" color="purple" />
            <NavItem href="/batch-showcase" icon={FolderOpen} label="Batch Showcase" color="blue" />
            <NavItem href="/showcase" icon={Palette} label="My Showcase" color="pink" />
            <NavItem href="/magazine" icon={Newspaper} label="Magazine" color="blue" />
            <NavItem href="/leaderboard" icon={Trophy} label="Leaderboard" color="yellow" />
            <NavItem href="/write-article" icon={PenTool} label="Write" color="green" />

            <ExpandableSection title="Fun Features" icon={Gamepad2} color="orange">
              <NavItem href="/ai-chat" icon={Brain} label="AI Tutor" color="purple" />
              <NavItem href="/quizzes" icon={HelpCircle} label="Quizzes" color="blue" />
              <NavItem href="/challenges" icon={Target} label="Challenges" color="orange" />
              <NavItem href="/certificates" icon={Award} label="Certificates" color="yellow" />
              <NavItem href="/live-classes" icon={Video} label="Live Classes" color="pink" />
            </ExpandableSection>

            <div className="pt-2">
              <a
                href="/subscription"
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold 
                  transition-all duration-200 hover:scale-105 active:scale-95
                  ${hasSubscription 
                    ? 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 border-2 border-amber-200' 
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'}`}
                data-testid="nav-subscription"
              >
                <Star className="w-6 h-6" strokeWidth={2.5} fill={hasSubscription ? "currentColor" : "none"} />
                <span className="text-sm">{hasSubscription ? 'Premium Active' : 'Go Premium!'}</span>
                {!hasSubscription && <Sparkles className="w-5 h-5 ml-auto" />}
              </a>
            </div>
          </>
        )}

        {/* Parent Menu */}
        {isParent && (
          <>
            <div className="pt-4 pb-2">
              <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Family</p>
            </div>
            <NavItem href="/parent-portal" icon={Users} label="My Children" color="pink" />
            <NavItem href="/leaderboard" icon={Trophy} label="Leaderboard" color="yellow" />
            <NavItem href="/referrals" icon={Gift} label="Refer & Earn" color="orange" />
          </>
        )}

        {/* Referral Link for All Users */}
        <div className="pt-4 pb-2">
          <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Rewards</p>
        </div>
        <a
          href="/referrals"
          className="flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold 
            bg-gradient-to-r from-orange-100 to-pink-100 text-orange-600 
            border-2 border-orange-200 hover:from-orange-200 hover:to-pink-200
            transition-all duration-200 hover:scale-105 active:scale-95"
          data-testid="nav-referrals"
        >
          <Gift className="w-6 h-6" strokeWidth={2.5} />
          <span className="text-sm">Refer & Earn 🎁</span>
        </a>
      </nav>

      {/* Logout Button */}
      <div className="pt-4 border-t-2 border-slate-100 mt-4">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold 
            text-red-500 hover:bg-red-50 border-2 border-transparent hover:border-red-200
            transition-all duration-200 hover:scale-105 active:scale-95"
          data-testid="logout-btn"
        >
          <LogOut className="w-6 h-6" strokeWidth={2.5} />
          <span className="text-sm">Logout</span>
        </button>
      </div>
    </aside>
  );

  // Mobile Top Bar
  const MobileTopBar = () => (
    <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b-2 border-slate-100 px-4 py-3"
         style={{ fontFamily: "'Nunito', sans-serif" }}>
      <div className="flex items-center justify-between">
        <a href="/dashboard" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-md">
            <Rocket className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-extrabold text-purple-600">TEC</span>
        </a>

        {user && (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
              {getInitials(user.full_name)}
            </div>
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center"
              data-testid="mobile-menu-toggle"
            >
              {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // Mobile Menu Overlay
  const MobileMenu = () => (
    showMobileMenu && (
      <div className="lg:hidden fixed inset-0 z-40 bg-white pt-20 overflow-y-auto animate-in slide-in-from-top duration-300"
           style={{ fontFamily: "'Nunito', sans-serif" }}>
        <div className="p-4 space-y-2">
          {/* User Card */}
          {user && (
            <div className="mb-4 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl border-2 border-purple-100">
              <p className="font-bold text-slate-700">Hi, {user.full_name}! 👋</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-3 py-1 bg-purple-100 text-purple-600 rounded-full text-sm font-semibold capitalize">
                  {user.role}
                </span>
                {hasSubscription && isStudent && (
                  <span className="px-3 py-1 bg-amber-100 text-amber-600 rounded-full text-sm font-semibold">
                    ⭐ Premium
                  </span>
                )}
              </div>
            </div>
          )}

          <NavItem href="/dashboard" icon={Home} label="Dashboard" color="purple" />

          {isTeacher && (
            <>
              <NavItem href="/teacher" icon={BookOpen} label="Create Content" color="blue" />
              <NavItem href="/class-scheduler" icon={Calendar} label="Schedule" color="green" />
              <NavItem href="/attendance" icon={ClipboardCheck} label="Attendance" color="orange" />
              <NavItem href="/teacher-certificates" icon={Award} label="Certificates" color="yellow" />
              <NavItem href="/write-article" icon={PenTool} label="Publish" color="pink" />
              <NavItem href="/article-reviews" icon={MessageSquare} label="Reviews" color="purple" />
              <NavItem href="/whatsapp-admin" icon={Smartphone} label="WhatsApp" color="green" />
            </>
          )}

          {isStudent && (
            <>
              <NavItem href="/my-learning" icon={Rocket} label="My Learning" color="purple" />
              <NavItem href="/showcase" icon={Palette} label="Showcase" color="pink" />
              <NavItem href="/magazine" icon={Newspaper} label="Magazine" color="blue" />
              <NavItem href="/leaderboard" icon={Trophy} label="Leaderboard" color="yellow" />
              <NavItem href="/write-article" icon={PenTool} label="Write" color="green" />
              <NavItem href="/certificates" icon={Award} label="Certificates" color="orange" />
              <NavItem href="/live-classes" icon={Video} label="Live Classes" color="pink" />
              <NavItem href="/subscription" icon={Star} label={hasSubscription ? 'Premium' : 'Subscribe'} color="yellow" />
            </>
          )}

          {isParent && (
            <>
              <NavItem href="/parent-portal" icon={Users} label="My Children" color="pink" />
              <NavItem href="/leaderboard" icon={Trophy} label="Leaderboard" color="yellow" />
            </>
          )}

          <div className="pt-4 border-t-2 border-slate-100">
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold 
                text-red-500 hover:bg-red-50 border-2 border-transparent hover:border-red-200
                transition-all duration-200"
              data-testid="mobile-logout-btn"
            >
              <LogOut className="w-6 h-6" strokeWidth={2.5} />
              <span className="text-sm">Logout</span>
            </button>
          </div>
        </div>
      </div>
    )
  );

  // Mobile Bottom Tab Bar
  const MobileBottomBar = () => (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-slate-100 px-2 py-2"
         style={{ fontFamily: "'Nunito', sans-serif" }}>
      <div className="flex justify-around items-center">
        {isStudent && (
          <>
            <a href="/dashboard" className="flex flex-col items-center p-2 text-slate-500 hover:text-purple-600 transition-colors">
              <Home className="w-6 h-6" strokeWidth={2.5} />
              <span className="text-xs font-semibold mt-1">Home</span>
            </a>
            <a href="/my-learning" className="flex flex-col items-center p-2 text-slate-500 hover:text-purple-600 transition-colors">
              <Rocket className="w-6 h-6" strokeWidth={2.5} />
              <span className="text-xs font-semibold mt-1">Learn</span>
            </a>
            <a href="/leaderboard" className="flex flex-col items-center p-2 text-slate-500 hover:text-amber-500 transition-colors">
              <Trophy className="w-6 h-6" strokeWidth={2.5} />
              <span className="text-xs font-semibold mt-1">Rank</span>
            </a>
            <a href="/magazine" className="flex flex-col items-center p-2 text-slate-500 hover:text-blue-600 transition-colors">
              <Newspaper className="w-6 h-6" strokeWidth={2.5} />
              <span className="text-xs font-semibold mt-1">Read</span>
            </a>
          </>
        )}

        {isTeacher && (
          <>
            <a href="/dashboard" className="flex flex-col items-center p-2 text-slate-500 hover:text-purple-600 transition-colors">
              <Home className="w-6 h-6" strokeWidth={2.5} />
              <span className="text-xs font-semibold mt-1">Home</span>
            </a>
            <a href="/class-scheduler" className="flex flex-col items-center p-2 text-slate-500 hover:text-green-600 transition-colors">
              <Calendar className="w-6 h-6" strokeWidth={2.5} />
              <span className="text-xs font-semibold mt-1">Schedule</span>
            </a>
            <a href="/attendance" className="flex flex-col items-center p-2 text-slate-500 hover:text-orange-500 transition-colors">
              <ClipboardCheck className="w-6 h-6" strokeWidth={2.5} />
              <span className="text-xs font-semibold mt-1">Attend</span>
            </a>
            <a href="/article-reviews" className="flex flex-col items-center p-2 text-slate-500 hover:text-purple-600 transition-colors">
              <MessageSquare className="w-6 h-6" strokeWidth={2.5} />
              <span className="text-xs font-semibold mt-1">Reviews</span>
            </a>
          </>
        )}

        {isParent && (
          <>
            <a href="/dashboard" className="flex flex-col items-center p-2 text-slate-500 hover:text-purple-600 transition-colors">
              <Home className="w-6 h-6" strokeWidth={2.5} />
              <span className="text-xs font-semibold mt-1">Home</span>
            </a>
            <a href="/parent-portal" className="flex flex-col items-center p-2 text-slate-500 hover:text-pink-600 transition-colors">
              <Users className="w-6 h-6" strokeWidth={2.5} />
              <span className="text-xs font-semibold mt-1">Kids</span>
            </a>
            <a href="/leaderboard" className="flex flex-col items-center p-2 text-slate-500 hover:text-amber-500 transition-colors">
              <Trophy className="w-6 h-6" strokeWidth={2.5} />
              <span className="text-xs font-semibold mt-1">Rank</span>
            </a>
          </>
        )}
      </div>
    </div>
  );

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&family=Outfit:wght@400;500;700&display=swap" rel="stylesheet" />
      <Sidebar />
      <MobileTopBar />
      <MobileMenu />
      <MobileBottomBar />
    </>
  );
};

export default Navigation;
