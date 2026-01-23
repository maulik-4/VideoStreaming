import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosConfig';
import Sidebar from '../Components/Sidebar/Sidebar';
import Loader from '../Components/Loader';
import VideoCard from '../Components/VideoCard';
import { toast } from 'react-toastify';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

function generateSearchIntent(input) {
  const text = (input || '').trim();
  const lower = text.toLowerCase();
  let intent = 'explore';
  if (/(^|\s)(play|watch)\b/.test(lower)) intent = 'play';
  else if (/(^|\s)(search|find|look up)\b/.test(lower)) intent = 'search';

  let primary = text;
  const likeIdx = lower.indexOf('like ');
  if (likeIdx !== -1) {
    primary = text.slice(likeIdx + 5).trim();
  }

  if (!primary) primary = text;

  const base = primary.replace(/\b(scene|clip|video)\b/gi, '').trim();
  const related = [
    `${primary} official clip`,
    `${base} soundtrack scene`,
    `best ${base} scene`,
    `${primary} full scene`
  ];

  const language = /[\u0900-\u097F]/.test(text) ? 'hi' : 'en';

  return {
    intent,
    primary_query: primary,
    related_queries: related,
    language,
  };
}

async function searchYouTube(apiKey, queries) {
  const baseUrl = 'https://www.googleapis.com/youtube/v3/search';
  for (const q of queries) {
    const url = `${baseUrl}?part=snippet&type=video&maxResults=12&q=${encodeURIComponent(q)}&key=${apiKey}`;
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      const items = (data.items || []).filter(i => i.id && i.id.videoId);
      if (items.length > 0) return items;
    } catch (e) {
      // try next query
    }
  }
  return [];
}

const YouTubeVideoCard = ({ item, navigate }) => (
  <div
    onClick={() => navigate(`/youtube/${item.id.videoId}`)}
    className="video_card p-3 rounded-xl shadow-lg transition-all duration-300 cursor-pointer glass-card hover:scale-105 hover:shadow-xl"
  >
    <div className="video_thumbnail w-full h-40 rounded-lg mb-3 overflow-hidden relative bg-gray-700">
      <img
        src={item.snippet.thumbnails.medium?.url}
        alt={item.snippet.title}
        className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
      />
      <div className="absolute bottom-2 right-2 bg-red-600 px-2 py-0.5 rounded text-xs text-white font-bold">
        YouTube
      </div>
    </div>
    <h2 className="text-sm font-semibold line-clamp-2 mb-2">{item.snippet.title}</h2>
    <p className="text-xs text-muted line-clamp-1">{item.snippet.channelTitle}</p>
    <p className="text-xs text-muted mt-1">{new Date(item.snippet.publishedAt).toLocaleDateString()}</p>
  </div>
);

const Search = ({ SideBar }) => {
  const query = useQuery();
  const q = query.get('q') || '';
  const navigate = useNavigate();

  const [allVideos, setAllVideos] = useState([]);
  const [youtubeResults, setYoutubeResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showYouTubeResults, setShowYouTubeResults] = useState(false);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return allVideos.filter(v => !v.user?.isBlocked && (!term || v.title.toLowerCase().includes(term)));
  }, [allVideos, q]);

  useEffect(() => {
    setLoading(true);
    axiosInstance.get('/api/getAllVideos')
      .then(res => setAllVideos(res.data.data || []))
      .catch(() => toast.error('Failed to load videos'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading && q && filtered.length === 0) {
      const apiKey = import.meta.env.VITE_YT_API_KEY;
      if (!apiKey) {
        toast.info('YouTube API key not configured. No fallback available.');
        return;
      }

      const intent = generateSearchIntent(q);
      const queries = [intent.primary_query, ...intent.related_queries];
      toast.info('Searching YouTube for related content...');

      (async () => {
        const results = await searchYouTube(apiKey, queries);
        if (results.length > 0) {
          setYoutubeResults(results);
          setShowYouTubeResults(true);
          toast.success(`Found ${results.length} results on YouTube`);
        } else {
          toast.warn('No related YouTube results found.');
        }
      })();
    }
  }, [loading, q, filtered.length]);

  return (
    <div className="flex -mt-[8vh] relative min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <Sidebar SideBar={SideBar} />
      <div className="flex flex-col w-full overflow-x-hidden p-4 md:p-6 lg:p-8 mt-[5vh]">
        <h2 className="text-xl md:text-2xl font-semibold mb-2">Search results for: <span className="text-main">{q}</span></h2>
        
        {loading ? (
          <Loader />
        ) : filtered.length > 0 ? (
          <>
            <p className="text-muted text-sm mb-4">{filtered.length} local video{filtered.length !== 1 ? 's' : ''} found</p>
            <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filtered.map((video) => (
                <VideoCard key={video._id} video={video} navigate={navigate} />
              ))}
            </div>
          </>
        ) : showYouTubeResults && youtubeResults.length > 0 ? (
          <>
            <p className="text-muted text-sm mb-4">No local videos found. Showing YouTube results:</p>
            <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {youtubeResults.map((item) => (
                <YouTubeVideoCard key={item.id.videoId} item={item} navigate={navigate} />
              ))}
            </div>
          </>
        ) : (
          <div className="glass-card p-6 rounded-xl text-center">
            <div className="text-6xl mb-3">🔍</div>
            <p className="text-main mb-2">No results found</p>
            <p className="text-muted text-sm">Try a different search term or explore categories.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
