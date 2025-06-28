import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom'
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import './Home.css'
import { IoIosArrowForward, IoIosArrowBack, IoMdCloudUpload } from "react-icons/io";
import { HiMenu, HiX } from "react-icons/hi";
import axios from 'axios';
import Sample from '../assets/sample.png';
import { useMovieContext } from '../MovieContext';
import Login from '../Auth/Login';
import Register from '../Auth/Register';
import { GiFilmSpool } from "react-icons/gi";

const DOMAIN = import.meta.env.VITE_DOMAIN || 'http://localhost:3000';

// Cookie helpers
const setCookie = (name, value, days = 7) => {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = name + '=' + encodeURIComponent(value) + '; expires=' + expires + '; path=/';
};

const getCookie = (name) => {
    return document.cookie.split('; ').reduce((r, v) => {
        const parts = v.split('=');
        return parts[0] === name ? decodeURIComponent(parts[1]) : r
    }, null);
};

function Home() {
    const [currentIdx, setCurrentIdx] = useState(0);
    const [showArrows, setShowArrows] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const arrowTimeout = useRef(null);
    const { trailers, setTrailers, loading, setLoading } = useMovieContext();
    const [allMovies, setAllMovies] = useState([]);
    const [showLogin, setShowLogin] = useState(false);
    const [showRegister, setShowRegister] = useState(false);
    const [googleUser, setGoogleUser] = useState(null);

    // Check cookie for user on mount
    useEffect(() => {
        const cookieUser = getCookie('googleUser');
        if (cookieUser) {
            try {
                setGoogleUser(JSON.parse(cookieUser));
            } catch {
                setGoogleUser(null);
            }
        }
    }, []);

    // Show login after 2 seconds if not logged in
    useEffect(() => {
        if (!googleUser) {
            const timer = setTimeout(() => setShowLogin(true), 2000);
            return () => clearTimeout(timer);
        } else {
            setShowLogin(false);
            setShowRegister(false);
        }
    }, [googleUser]);

    // When user logs in, store in cookie and set user
    const handleLogin = useCallback((user) => {
        setGoogleUser(user);
        setCookie('googleUser', JSON.stringify(user));
        setShowLogin(false);
        setShowRegister(false);
    }, []);

    // Handle switching to register
    const handleSwitchToRegister = useCallback(() => {
        setShowLogin(false);
        setShowRegister(true);
    }, []);

    // Handle switching to login
    const handleSwitchToLogin = useCallback(() => {
        setShowRegister(false);
        setShowLogin(true);
    }, []);

    // Fetch all movies and preload first two trailers
    useEffect(() => {
        if (allMovies.length > 0) return;
        setLoading(true);

        const fetchMovies = async () => {
            try {
                const response = await axios.get(`${DOMAIN}/movie-ids`);
                const ids = response.data.map(movie => movie.id);
                const movies = [];

                // Fetch first movie
                if (ids.length > 0) {
                    try {
                        const res = await axios.get(`${DOMAIN}/movie/${ids[0]}`);
                        movies.push(res.data);
                        setAllMovies([res.data]);
                        setTrailers([res.data]);
                    } catch (error) {
                        console.error(`Error fetching movie ${ids[0]}:`, error);
                        const fallback = { id: ids[0], movie_title: `Movie ${ids[0]}`, description: 'No description available' };
                        movies.push(fallback);
                        setAllMovies([fallback]);
                        setTrailers([fallback]);
                    }
                }

                // Fetch second movie
                if (ids.length > 1) {
                    try {
                        const res = await axios.get(`${DOMAIN}/movie/${ids[1]}`);
                        movies.push(res.data);
                        setAllMovies([...movies]);
                        setTrailers([...movies]);
                    } catch (error) {
                        console.error(`Error fetching movie ${ids[1]}:`, error);
                        const fallback = { id: ids[1], movie_title: `Movie ${ids[1]}`, description: 'No description available' };
                        movies.push(fallback);
                        setAllMovies([...movies]);
                        setTrailers([...movies]);
                    }
                }

                // Fetch remaining movies for trends only
                const trendsMovies = [...movies];
                for (let i = 2; i < ids.length; i++) {
                    try {
                        const res = await axios.get(`${DOMAIN}/movie/${ids[i]}`);
                        trendsMovies.push(res.data);
                    } catch (error) {
                        console.error(`Error fetching movie ${ids[i]}:`, error);
                        trendsMovies.push({
                            id: ids[i],
                            movie_title: `Movie ${ids[i]}`,
                            description: 'No description available',
                            poster: null,
                            mux_playback_id: null
                        });
                    }
                }
                setAllMovies(trendsMovies);

            } catch (error) {
                console.error('Error fetching movie IDs:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchMovies();
    }, [setTrailers, setLoading, allMovies.length]);

    // Navigation handlers for trailers
    const handlePrev = useCallback(() => {
        setCurrentIdx(idx => (idx > 0 ? idx - 1 : idx));
    }, []);

    const handleNext = useCallback(() => {
        setCurrentIdx(idx => (trailers.length > 0 && idx < trailers.length - 1 ? idx + 1 : 0));
    }, [trailers.length]);

    // Arrow show/hide logic
    useEffect(() => {
        const handleMouseMove = () => {
            setShowArrows(true);
            if (arrowTimeout.current) clearTimeout(arrowTimeout.current);
            arrowTimeout.current = setTimeout(() => setShowArrows(false), 1000);
        };
        window.addEventListener('mousemove', handleMouseMove);
        arrowTimeout.current = setTimeout(() => setShowArrows(false), 1000);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            if (arrowTimeout.current) clearTimeout(arrowTimeout.current);
        };
    }, []);

    // Memoize trailer data
    const trailer = useMemo(() => trailers[currentIdx] || {}, [trailers, currentIdx]);

    // Automatically switch to next trailer when current finishes
    useEffect(() => {
        const video = document.querySelector('.background-video');
        if (!video) return;

        const handleEnded = () => {
            setCurrentIdx(idx => (trailers.length > 0 && idx < trailers.length - 1 ? idx + 1 : 0));
        };

        video.addEventListener('ended', handleEnded);
        return () => video.removeEventListener('ended', handleEnded);
    }, [trailers.length]);

    // Play video on load
    useEffect(() => {
        const video = document.querySelector('.background-video');
        if (video) {
            const playVideo = async () => {
                try {
                    await video.play();
                } catch (error) {
                    console.error('Autoplay failed:', error);
                }
            };
            playVideo();
        }
    }, [currentIdx]);

    return (
        <div className="main">
            {/* Login Modal */}
            {showLogin && !googleUser && (
                <div className="modal-overlay">
                    <div onClick={e => e.stopPropagation()}>
                        <Login
                            onLogin={handleLogin}
                            onSwitchToRegister={handleSwitchToRegister}
                        />
                    </div>
                </div>
            )}

            {/* Register Modal */}
            {showRegister && !googleUser && (
                <div className="modal-overlay">
                    <div onClick={e => e.stopPropagation()}>
                        <Register onSwitchToLogin={handleSwitchToLogin} />
                    </div>
                </div>
            )}

            {/* Block interaction if not logged in */}
            {(!googleUser || showLogin || showRegister) && (
                <div className="interaction-blocker" onClick={e => e.preventDefault()} />
            )}

            <nav className="navbar">
                <div className="nav-left">
                    <div className="logo">
                        <GiFilmSpool size={32} />
                        <span>Oli</span>
                    </div>
                    <ul className="nav-links desktop-menu">
                        <li><a href="/">Home</a></li>
                        <li><a href="/movies">Movies</a></li>
                        <li><a href="/series">Series</a></li>
                    </ul>
                </div>

                {mobileMenuOpen && (
                    <div className="mobile-menu">
                        <a href="/" onClick={() => setMobileMenuOpen(false)}>Home</a>
                        <a href="/movies" onClick={() => setMobileMenuOpen(false)}>Movies</a>
                        <a href="/series" onClick={() => setMobileMenuOpen(false)}>Series</a>
                    </div>
                )}

                <div className="nav-right">
                    <div className="user">
                        <div className='user-info'>
                            <img
                                src={googleUser?.picture || Sample}
                                alt="User"
                                onError={e => { e.target.onerror = null; e.target.src = Sample; }}
                            />
                            {googleUser && (
                                <p className="desktop-only">
                                    {googleUser.name || googleUser.username}
                                </p>
                            )}
                        </div>
                        {googleUser && (googleUser.email === "yuvarajacb11@gmail.com" || googleUser.email === 'naraen.karthick@gmail.com') && (
                            <Link to="/upload" title="Upload" className="upload-link">
                                <IoMdCloudUpload size={28} />
                            </Link>
                        )}
                        <button
                            className="mobile-menu-toggle mobile-only"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? <HiX size={24} /> : <HiMenu size={24} />}
                        </button>
                    </div>
                </div>
            </nav>

            {loading && trailers.length === 0 ? (
                <SkeletonTheme baseColor="#222" highlightColor="#444">
                    <div style={{ padding: 40 }}>
                        <Skeleton height={400} width="100%" style={{ marginBottom: 24 }} />
                        <Skeleton width={200} height={32} style={{ marginBottom: 12 }} />
                        <Skeleton count={2} width={300} style={{ marginBottom: 12 }} />
                        <Skeleton width={120} height={40} />
                    </div>
                </SkeletonTheme>
            ) : (
                <SkeletonTheme baseColor="#222" highlightColor="#444">
                    <div className="trailer">
                        {trailers.length > 0 && (
                            <>
                                {currentIdx > 0 && (
                                    <IoIosArrowBack className={`previous-trailer${showArrows ? '' : ' hide-arrow'}`} onClick={handlePrev} />
                                )}
                                {currentIdx < trailers.length - 1 && (
                                    <IoIosArrowForward className={`next-trailer${showArrows ? '' : ' hide-arrow'}`} onClick={handleNext} />
                                )}
                                <video
                                    src={trailer.trailer || 'https://ik.imagekit.io/f2t48dhjl/coolie-trailer.mp4?tr=orig'}
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    className="background-video"
                                    onError={(e) => {
                                        console.error('Video failed to load:', e);
                                        if (e.target.src !== 'https://ik.imagekit.io/f2t48dhjl/coolie-trailer.mp4?tr=orig') {
                                            e.target.src = 'https://ik.imagekit.io/f2t48dhjl/coolie-trailer.mp4?tr=orig';
                                        }
                                    }}
                                />
                                <div className="movie-details">
                                    <h5 className='movie-title'>
                                        {loading ? <Skeleton width={200} height={32} /> : trailer.movie_title}
                                    </h5>
                                    <p className='movie-description'>
                                        {loading ? <Skeleton count={2} width={300} /> : trailer.description}
                                    </p>
                                    <div className="movie-actions">
                                        {loading ? (
                                            <Skeleton width={120} height={40} />
                                        ) : (
                                            <Link to={`/watch/${trailer.id}`} className='watch-link' onClick={() => {
                                                localStorage.setItem('movie-title', trailer.movie_title);
                                                localStorage.setItem('movie-id', trailer.id);
                                                localStorage.setItem('playback-id', trailer.mux_playback_id || '');
                                            }}>
                                                <button className='watch-now'>Watch Now</button>
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                    <div className="top-trends">
                        <h2 className='trends-title'>Top Trends</h2>
                        <div className="trends-list">
                            {loading && allMovies.length === 0
                                ? Array.from({ length: 6 }).map((_, idx) => (
                                    <div className="trend-item" key={idx}>
                                        <Skeleton width={100} height={120} />
                                        <Skeleton width={80} />
                                    </div>
                                ))
                                : allMovies.map((movie, index) => (
                                    <div className="trend-item" key={movie.id || index}>
                                        {console.log('Movie:', movie.movie_title,movie.poster)}
                                        <img src={movie.poster || Sample} alt={movie.movie_title} className='poster' />
                                        <div className="hover-info">
                                            <div className="hover-content">
                                                <p>{movie.movie_title}</p>
                                            </div>
                                            <Link to={`/watch/${movie.id}`} className='watch-button' onClick={() => {
                                                localStorage.setItem('movie-title', movie.movie_title);
                                                localStorage.setItem('movie-id', movie.id);
                                                localStorage.setItem('playback-id', movie.mux_playback_id || '');
                                            }}>
                                                <button className='watch-now'>Watch Now</button>
                                            </Link>
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                </SkeletonTheme>
            )}
        </div>
    )
}

export default Home