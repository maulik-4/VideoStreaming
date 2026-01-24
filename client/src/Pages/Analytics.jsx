import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosConfig';
import Sidebar from '../Components/Sidebar/Sidebar';
import Loader from '../Components/Loader';
import { FaChartPie, FaClock, FaFireAlt, FaPlay, FaRegDotCircle } from 'react-icons/fa';
import { MdCalendarToday, MdOutlineCategory, MdTimeline } from 'react-icons/md';

const formatDuration = (seconds = 0) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
};

const StatCard = ({ title, value, sub, icon, gradient }) => (
  <div
    className="p-4 md:p-5 rounded-xl shadow-lg border border-white/5"
    style={{
      background: gradient || 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(59,130,246,0.04))',
    }}
  >
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-sm uppercase tracking-wide opacity-70">{title}</h3>
      <div className="text-xl opacity-80">{icon}</div>
    </div>
    <div className="text-2xl font-semibold" style={{ color: 'var(--text)' }}>{value}</div>
    {sub && <p className="text-xs mt-1 opacity-70">{sub}</p>}
  </div>
);

const BarList = ({ title, items, labelKey = 'label', valueKey = 'value', unit = 'min' }) => {
  const max = useMemo(() => Math.max(...items.map((i) => i[valueKey] || 0), 1), [items, valueKey]);

  return (
    <div className="p-4 rounded-xl bg-card shadow-md border border-white/5">
      <div className="flex items-center gap-2 mb-3">
        <FaRegDotCircle className="opacity-70" />
        <h4 className="font-semibold" style={{ color: 'var(--text)' }}>{title}</h4>
      </div>
      <div className="space-y-3">
        {items.length === 0 && <p className="text-sm opacity-60">No data yet.</p>}
        {items.map((item, idx) => {
          const value = item[valueKey] || 0;
          const width = `${Math.max(6, (value / max) * 100)}%`;
          return (
            <div key={`${item[labelKey]}-${idx}`}> 
              <div className="flex justify-between text-sm mb-1">
                <span className="opacity-80">{item[labelKey]}</span>
                <span className="font-semibold" style={{ color: 'var(--text)' }}>{formatDuration(value)}</span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width, background: 'linear-gradient(90deg, var(--accent), #7c3aed)' }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const TimeGrid = ({ title, data, labelKey, valueKey }) => {
  const max = useMemo(() => Math.max(...data.map((d) => d[valueKey] || 0), 1), [data, valueKey]);
  return (
    <div className="p-4 rounded-xl bg-card shadow-md border border-white/5">
      <div className="flex items-center gap-2 mb-3">
        <MdTimeline className="opacity-70" />
        <h4 className="font-semibold" style={{ color: 'var(--text)' }}>{title}</h4>
      </div>
      {data.length === 0 && <p className="text-sm opacity-60">No data yet.</p>}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {data.map((d, idx) => (
          <div key={`${d[labelKey]}-${idx}`} className="p-3 rounded-lg bg-white/5 border border-white/5">
            <div className="text-xs opacity-70">{d[labelKey]}</div>
            <div className="text-lg font-semibold" style={{ color: 'var(--text)' }}>{formatDuration(d[valueKey])}</div>
            <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.max(6, (d[valueKey] || 0) / max * 100)}%`, background: 'var(--accent)' }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Analytics = ({ SideBar }) => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchAnalytics = async () => {
      try {
        const res = await axiosInstance.get('/history/analytics');
        if (res.data.success) {
          setData(res.data.data);
          setError(null);
        }
      } catch (err) {
        console.error('Failed to load analytics', err);
        const status = err.response?.status;
        const message = err.response?.data?.message || err.message;
        setError({ status, message });
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [navigate]);

  if (loading) return <Loader />;
  if (error) {
    return (
      <div className="p-6 max-w-3xl mx-auto text-sm" style={{ color: 'var(--text)' }}>
        <h2 className="text-xl font-semibold mb-2">Analytics unavailable</h2>
        <p className="opacity-80 mb-3">{error.message || 'Something went wrong while fetching analytics.'}</p>
        {error.status && <p className="mb-2">HTTP {error.status}</p>}
        <div className="space-y-2">
          <p className="opacity-70">Quick checks:</p>
          <ul className="list-disc ml-5 opacity-80 space-y-1">
            <li>Ensure you are logged in (protected route).</li>
            <li>Confirm the server has the <code>/history/analytics</code> endpoint deployed.</li>
            <li>If running locally, set <code>VITE_API_BASE_URL</code> to your API (e.g. http://localhost:9999).</li>
          </ul>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 rounded-lg"
          style={{ background: 'var(--accent)', color: 'white' }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return <div className="p-8" style={{ color: 'var(--text)' }}>No analytics yet.</div>;

  const { totals } = data;

  const peakHour = data.peakHours?.[0];
  const platformItems = (data.platformBreakdown || []).map((p) => ({
    label: p._id === 'youtube' ? 'YouTube' : 'Local',
    value: p.watchTime
  }));

  const categoryItems = (data.perCategory || []).map((c) => ({
    label: c._id || 'Unknown',
    value: c.watchTime
  }));

  const channelItems = (data.perChannel || []).slice(0, 8).map((c) => ({
    label: c._id || 'Unknown',
    value: c.watchTime
  }));

  const videoItems = (data.perVideo || []).slice(0, 6).map((v) => ({
    label: v._id.title,
    value: v.watchTime,
    meta: v._id.channelName
  }));

  const durationBuckets = (data.durationBuckets || []).map((d) => ({ label: d._id, value: d.watchTime }));
  const languageItems = (data.languageBreakdown || []).map((l) => ({ label: l._id, value: l.watchTime }));

  const dailyData = (data.daily || []).slice(-12).map((d) => ({ label: d._id, value: d.watchTime }));
  const weeklyData = (data.weekly || []).map((d) => ({ label: `W${d._id.week} ${d._id.year}`, value: d.watchTime }));

  return (
    <div className="flex" style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {SideBar && <Sidebar SideBar={SideBar} />}

      <div className="flex-1 p-4 md:p-6" style={{ marginLeft: SideBar ? '240px' : '0' }}>
        <div className="mb-6 flex items-center gap-3">
          <FaChartPie className="text-3xl" style={{ color: 'var(--accent)' }} />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--text)' }}>Watch Analytics</h1>
            <p className="text-sm opacity-70">A deep dive into your watch habits</p>
          </div>
        </div>

        {/* Top stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Total Watch Time"
            value={formatDuration(totals.totalWatchTime)}
            sub="All sessions combined"
            icon={<FaClock />}
            gradient="linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))"
          />
          <StatCard
            title="Sessions"
            value={`${totals.totalEntries || 0}`}
            sub="Total plays tracked"
            icon={<FaPlay />}
            gradient="linear-gradient(135deg, rgba(59,130,246,0.18), rgba(59,130,246,0.06))"
          />
          <StatCard
            title="Avg Session"
            value={formatDuration(totals.averageWatchTime || 0)}
            sub="Average watch time per play"
            icon={<MdTimeline />}
            gradient="linear-gradient(135deg, rgba(236,72,153,0.18), rgba(236,72,153,0.06))"
          />
          <StatCard
            title="Completed"
            value={`${totals.completedCount || 0}`}
            sub="Watched > 90%"
            icon={<FaFireAlt />}
            gradient="linear-gradient(135deg, rgba(249,115,22,0.18), rgba(249,115,22,0.06))"
          />
        </div>

        {/* Watch time by axes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <BarList title="By Platform" items={platformItems} />
          <BarList title="By Category / Tag" items={categoryItems} />
          <BarList title="By Creator / Channel" items={channelItems} />
        </div>

        {/* Videos and duration buckets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-card shadow-md border border-white/5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FaPlay />
                <h4 className="font-semibold" style={{ color: 'var(--text)' }}>Watch time per video (top 6)</h4>
              </div>
            </div>
            <div className="space-y-3">
              {videoItems.length === 0 && <p className="text-sm opacity-60">No data yet.</p>}
              {videoItems.map((v, idx) => (
                <div key={`${v.label}-${idx}`} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold" style={{ color: 'var(--text)' }}>{v.label}</div>
                    <div className="text-xs opacity-70">{v.meta}</div>
                  </div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>{formatDuration(v.value)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-card shadow-md border border-white/5">
            <div className="flex items-center gap-2 mb-3">
              <MdOutlineCategory />
              <h4 className="font-semibold" style={{ color: 'var(--text)' }}>Duration buckets</h4>
            </div>
            <div className="space-y-3">
              {durationBuckets.length === 0 && <p className="text-sm opacity-60">No data yet.</p>}
              {durationBuckets.map((b, idx) => (
                <div key={`${b.label}-${idx}`} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                  <span className="opacity-80">{b.label}</span>
                  <span className="font-semibold" style={{ color: 'var(--text)' }}>{formatDuration(b.value)}</span>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <BarList title="Languages" items={languageItems} />
            </div>
          </div>
        </div>

        {/* Time based */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <TimeGrid title="Daily watch time (last 12 days)" data={dailyData} labelKey="label" valueKey="value" />
          <TimeGrid title="Weekly watch time" data={weeklyData} labelKey="label" valueKey="value" />
        </div>

        {/* Peak hours & sessions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-10">
          <StatCard
            title="Peak hour"
            value={peakHour ? `${peakHour._id}:00` : '—'}
            sub={peakHour ? `Watch time: ${formatDuration(peakHour.watchTime)}` : 'No data yet'}
            icon={<MdCalendarToday />}
            gradient="linear-gradient(135deg, rgba(168,85,247,0.18), rgba(168,85,247,0.06))"
          />
          <StatCard
            title="Top platform"
            value={platformItems[0]?.label || '—'}
            sub={platformItems[0] ? `${formatDuration(platformItems[0].value)} watched` : 'No data yet'}
            icon={<FaChartPie />}
            gradient="linear-gradient(135deg, rgba(59,130,246,0.18), rgba(59,130,246,0.06))"
          />
          <StatCard
            title="Top category"
            value={categoryItems[0]?.label || '—'}
            sub={categoryItems[0] ? `${formatDuration(categoryItems[0].value)} watched` : 'No data yet'}
            icon={<MdOutlineCategory />}
            gradient="linear-gradient(135deg, rgba(16,185,129,0.18), rgba(16,185,129,0.06))"
          />
        </div>
      </div>
    </div>
  );
};

export default Analytics;
