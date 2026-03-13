import { useState, useEffect, useMemo, useCallback } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock, X, Loader2 } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { getAllPostsByUser, getProjects, schedulePost } from '../services/dbService';
import { getPlatform } from '../lib/platforms';
import type { GeneratedPost, Project } from '../types';

type PostWithProject = GeneratedPost & { project_name: string };

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-slate-500/20 border-slate-500/30',
  scheduled: 'bg-amber-500/20 border-amber-500/30',
  published: 'bg-emerald-500/20 border-emerald-500/30',
};

const STATUS_DOT: Record<string, string> = {
  draft: 'bg-slate-400',
  scheduled: 'bg-amber-400',
  published: 'bg-emerald-400',
};

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Monday = 0, Sunday = 6
  let startDay = firstDay.getDay() - 1;
  if (startDay < 0) startDay = 6;

  const days: { date: Date; inMonth: boolean }[] = [];

  // Previous month padding
  for (let i = startDay - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    days.push({ date: d, inMonth: false });
  }

  // Current month
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push({ date: new Date(year, month, i), inMonth: true });
  }

  // Next month padding (fill to 42 = 6 weeks)
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push({ date: new Date(year, month + 1, i), inMonth: false });
  }

  return days;
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function isToday(d: Date): boolean {
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

export default function CalendarPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostWithProject[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [rescheduling, setRescheduling] = useState<string | null>(null);
  const [newDateTime, setNewDateTime] = useState('');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [postsData, projectsData] = await Promise.all([
        getAllPostsByUser(user.id),
        getProjects(user.id),
      ]);
      setPosts(postsData);
      setProjects(projectsData);
    } catch (e) {
      console.error('Failed to load calendar data:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  // Group posts by date
  const postsByDate = useMemo(() => {
    const map: Record<string, PostWithProject[]> = {};
    posts.forEach((post) => {
      const dateStr = post.scheduled_at || post.created_at;
      if (!dateStr) return;
      const d = new Date(dateStr);
      const key = dateKey(d);
      if (!map[key]) map[key] = [];
      map[key].push(post);
    });
    return map;
  }, [posts]);

  const calendarDays = useMemo(() => getCalendarDays(year, month), [year, month]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  const selectedPosts = selectedDay ? postsByDate[selectedDay] || [] : [];

  // Reschedule a post
  const handleReschedule = async (postId: string) => {
    if (!newDateTime) return;
    try {
      await schedulePost(postId, new Date(newDateTime).toISOString());
      setRescheduling(null);
      setNewDateTime('');
      await loadData();
    } catch (e) {
      console.error('Failed to reschedule:', e);
    }
  };

  // Stats for current month
  const monthStats = useMemo(() => {
    let scheduled = 0, published = 0, draft = 0;
    calendarDays.forEach(({ date, inMonth }) => {
      if (!inMonth) return;
      const key = dateKey(date);
      const dayPosts = postsByDate[key] || [];
      dayPosts.forEach((p) => {
        if (p.status === 'scheduled') scheduled++;
        else if (p.status === 'published') published++;
        else draft++;
      });
    });
    return { scheduled, published, draft, total: scheduled + published + draft };
  }, [calendarDays, postsByDate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarDays className="w-7 h-7 text-primary" />
          <h1 className="text-2xl font-bold text-white">Content Calendar</h1>
        </div>

        {/* Month stats */}
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-slate-400">{monthStats.scheduled} scheduled</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-slate-400">{monthStats.published} published</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span className="text-slate-400">{monthStats.draft} drafts</span>
          </span>
        </div>
      </div>

      {/* Month Navigation */}
      <Card className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={prevMonth}>
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-white">
            {MONTHS[month]} {year}
          </h2>
          <Button variant="secondary" size="sm" onClick={goToday}>
            Today
          </Button>
        </div>

        <Button variant="ghost" size="sm" onClick={nextMonth}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </Card>

      <div className="flex gap-6">
        {/* Calendar Grid */}
        <Card className="flex-1 !p-0 overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-white/5">
            {DAYS.map((day) => (
              <div key={day} className="px-2 py-2.5 text-center text-xs font-medium text-slate-500 uppercase">
                {day}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {calendarDays.map(({ date, inMonth }, i) => {
              const key = dateKey(date);
              const dayPosts = postsByDate[key] || [];
              const today = isToday(date);
              const isSelected = selectedDay === key;

              return (
                <button
                  key={i}
                  onClick={() => setSelectedDay(isSelected ? null : key)}
                  className={`
                    relative min-h-[90px] p-1.5 border-b border-r border-white/5 text-left transition-all cursor-pointer
                    ${!inMonth ? 'opacity-30' : ''}
                    ${isSelected ? 'bg-primary/10 ring-1 ring-primary/30' : 'hover:bg-white/[0.03]'}
                  `}
                >
                  {/* Date number */}
                  <span
                    className={`
                      inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium
                      ${today ? 'bg-primary text-white' : 'text-slate-400'}
                    `}
                  >
                    {date.getDate()}
                  </span>

                  {/* Post indicators */}
                  {dayPosts.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {dayPosts.slice(0, 3).map((post) => {
                        const platform = getPlatform(post.platform);
                        return (
                          <div
                            key={post.id}
                            className={`flex items-center gap-1 px-1 py-0.5 rounded text-[10px] truncate border ${STATUS_COLORS[post.status]}`}
                          >
                            <span style={{ color: platform?.color }}>{platform?.icon}</span>
                            <span className="truncate text-slate-300">
                              {post.content.slice(0, 20)}
                            </span>
                          </div>
                        );
                      })}
                      {dayPosts.length > 3 && (
                        <div className="text-[10px] text-slate-500 px-1">
                          +{dayPosts.length - 3} more
                        </div>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Side panel — selected day details */}
        {selectedDay && (
          <div className="w-80 shrink-0 space-y-3">
            <Card>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white">
                  {new Date(selectedDay + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
                </h3>
                <button
                  onClick={() => setSelectedDay(null)}
                  className="text-slate-500 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {selectedPosts.length === 0 ? (
                <p className="text-sm text-slate-500 py-4 text-center">
                  No posts for this day
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedPosts.map((post) => {
                    const platform = getPlatform(post.platform);
                    const time = post.scheduled_at
                      ? new Date(post.scheduled_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                      : null;

                    return (
                      <div
                        key={post.id}
                        className={`p-3 rounded-xl border ${STATUS_COLORS[post.status]} transition-all`}
                      >
                        {/* Platform + Status */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold"
                              style={{ backgroundColor: platform?.color + '30', color: platform?.color }}
                            >
                              {platform?.icon}
                            </span>
                            <span className="text-xs font-medium text-white">{platform?.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[post.status]}`} />
                            <span className="text-[10px] text-slate-400 capitalize">{post.status}</span>
                          </div>
                        </div>

                        {/* Content */}
                        <p className="text-xs text-slate-300 leading-relaxed line-clamp-3 mb-2">
                          {post.content}
                        </p>

                        {/* Time + Project */}
                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                          <span>{post.project_name}</span>
                          {time && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {time}
                            </span>
                          )}
                        </div>

                        {/* Reschedule */}
                        {rescheduling === post.id ? (
                          <div className="mt-2 flex gap-1.5">
                            <input
                              type="datetime-local"
                              value={newDateTime}
                              onChange={(e) => setNewDateTime(e.target.value)}
                              min={new Date().toISOString().slice(0, 16)}
                              className="flex-1 px-2 py-1 bg-surface border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-primary/50"
                            />
                            <Button size="sm" onClick={() => handleReschedule(post.id)}>
                              Save
                            </Button>
                            <button
                              onClick={() => { setRescheduling(null); setNewDateTime(''); }}
                              className="text-slate-500 hover:text-white cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setRescheduling(post.id)}
                            className="mt-2 text-[10px] text-primary-light hover:underline cursor-pointer"
                          >
                            Reschedule
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
